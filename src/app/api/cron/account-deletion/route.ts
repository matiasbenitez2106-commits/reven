import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { deleteUserAccount } from "@/lib/account";
import { sendBajaRecordatorioEmail, sendCuentaBorradaEmail } from "@/lib/email";
import { appBaseUrl } from "@/lib/urls";

// Robot diario de borrado de cuentas (ver docs/plan-borrado-dos-fases.md, Paso 7).
// PARTE 3 — Borrado real + emails, gobernados por el interruptor ACCOUNT_DELETION_LIVE.
//   - APAGADO (modo ENSAYO, por defecto): solo detecta y loguea. No borra, no bloquea,
//     no manda emails, no escribe en la base.
//   - ENCENDIDO (modo REAL): borra de verdad, bloquea las que tengan denuncias y manda
//     los emails 2 (recordatorio) y 3 (confirmación).
//
// ⚠️ PENDIENTE ANTES DE ACTIVAR EL MODO REAL (ACCOUNT_DELETION_LIVE=true):
//    reforzar la re-verificación de denuncias DENTRO de deleteUserAccount (último chequeo
//    antes del delete) para cerrar la ventana TOCTOU entre el conteo de denuncias y el
//    borrado. Hoy el chequeo está en este archivo, justo antes de borrar; falta la barrera
//    final dentro de la función de borrado. No activar el modo real sin esto.
export const dynamic = "force-dynamic";

// Tope de borrados por corrida (red contra timeouts). El resto queda para la corrida
// del día siguiente: el robot es idempotente (vuelve a tomarlas).
const MAX_BORRADOS_POR_CORRIDA = 50;
// Cuántos días antes del vencimiento se manda el recordatorio (email 2).
const DIAS_RECORDATORIO = 7;

async function runRobot(req: Request) {
  // (1) Llave de acceso: CRON_SECRET, comparación en tiempo constante.
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron:account-deletion] CRON_SECRET no está configurada; se rechaza.");
    return noStore(NextResponse.json({ error: "No autorizado" }, { status: 401 }));
  }
  const expected = Buffer.from(`Bearer ${secret}`);
  const provided = Buffer.from(req.headers.get("authorization") ?? "");
  if (expected.length !== provided.length || !crypto.timingSafeEqual(expected, provided)) {
    return noStore(NextResponse.json({ error: "No autorizado" }, { status: 401 }));
  }

  // (2) Interruptor: apagado por defecto = modo ENSAYO (no destructivo).
  const live = process.env.ACCOUNT_DELETION_LIVE === "true";
  const now = new Date();

  try {
    // ── A) BORRADOS: cuentas que cumplen las 3 condiciones ───────────────
    const where = { deletionScheduledFor: { not: null, lte: now }, legalHoldAt: null };
    const totalVencidas = await prisma.user.count({ where });
    const candidatas = await prisma.user.findMany({
      where,
      select: { id: true }, // minimización: en ensayo no cargamos datos personales
      orderBy: { deletionScheduledFor: "asc" }, // las más vencidas primero
      take: MAX_BORRADOS_POR_CORRIDA,
    });
    console.log(
      `[cron:account-deletion] modo=${live ? "REAL" : "ENSAYO"} · vencidas=${totalVencidas} · se procesan hasta ${candidatas.length} esta corrida`
    );

    let borradas = 0, bloqueadas = 0, errores = 0;

    for (const u of candidatas) {
      try {
        // (RED DE SEGURIDAD) Re-chequear denuncias abiertas EN ESTE MOMENTO.
        // Busca denuncias donde el usuario es VENDEDOR (sobre SUS publicaciones).
        const denuncias = await prisma.report.count({
          where: { status: "PENDING", listing: { sellerId: u.id } },
        });
        if (denuncias > 0) {
          // Apareció una denuncia después de la baja → NO borrar; bloquear para el admin.
          if (live) {
            await prisma.user.update({ where: { id: u.id }, data: { legalHoldAt: new Date() } });
          }
          bloqueadas++;
          console.warn(
            `[cron:account-deletion] ${u.id}: ${denuncias} denuncia(s) abierta(s) → ${live ? "BLOQUEADA, no se borra" : "se bloquearía (ensayo)"}`
          );
          continue;
        }

        if (!live) {
          borradas++; // en ensayo = "se borraría"
          console.log(`[cron:account-deletion] ${u.id}: se borraría (ensayo)`);
          continue;
        }

        // Modo real: recién acá leemos los datos personales (minimización), ANTES de borrar.
        const datos = await prisma.user.findUnique({
          where: { id: u.id },
          select: { email: true, firstName: true, lastName: true },
        });
        if (!datos) continue; // ya no existe (carrera): nada que hacer
        const email = datos.email;
        const nombre = `${datos.firstName} ${datos.lastName}`.trim();

        // Borrado real reusando la función existente (Cloudinary + cascada).
        await deleteUserAccount(u.id);
        borradas++;
        console.warn(`[cron:account-deletion] ${u.id}: BORRADA`);

        // Email 3 (confirmación), best-effort: si falla, NO rompe el borrado.
        try {
          await sendCuentaBorradaEmail(email, nombre);
        } catch (e) {
          console.error(`[cron:account-deletion] ${u.id}: borrada OK, pero falló el email de confirmación:`, e);
        }
      } catch (e) {
        // Una cuenta que falla no corta la corrida: se anota y se sigue.
        errores++;
        console.error(`[cron:account-deletion] ${u.id}: ERROR al procesar, se saltea:`, e);
      }
    }

    // ── B) RECORDATORIOS (email 2): a ~DIAS_RECORDATORIO días del vencimiento ──
    const limite = new Date(now.getTime() + DIAS_RECORDATORIO * 86_400_000);
    const aRecordar = await prisma.user.findMany({
      where: {
        legalHoldAt: null,
        deletionReminderSentAt: null,                   // todavía no se le mandó
        deletionScheduledFor: { gt: now, lte: limite }, // vence dentro de los próximos 7 días
      },
      select: { id: true, deletionScheduledFor: true },
    });
    console.log(`[cron:account-deletion] recordatorios a enviar: ${aRecordar.length}`);

    let recordatorios = 0, recordatoriosErrores = 0;
    const baseUrl = appBaseUrl();
    if (live && aRecordar.length > 0 && !baseUrl) {
      console.error("[cron:account-deletion] Sin NEXTAUTH_URL/APP_URL: se omiten los recordatorios de esta corrida (el link quedaría sin dominio).");
    } else {
      for (const u of aRecordar) {
        if (!live) {
          recordatorios++; // en ensayo = "se mandaría"
          console.log(`[cron:account-deletion] ${u.id}: se mandaría recordatorio (ensayo)`);
          continue;
        }
        try {
          const datos = await prisma.user.findUnique({
            where: { id: u.id },
            select: { email: true, firstName: true, lastName: true },
          });
          if (!datos) continue;
          const nombre = `${datos.firstName} ${datos.lastName}`.trim();
          await sendBajaRecordatorioEmail(datos.email, nombre, `${baseUrl}/cuenta`, u.deletionScheduledFor!);
          // Marca para no repetir el recordatorio en futuras corridas.
          await prisma.user.update({ where: { id: u.id }, data: { deletionReminderSentAt: new Date() } });
          recordatorios++;
        } catch (e) {
          recordatoriosErrores++;
          console.error(`[cron:account-deletion] ${u.id}: falló el recordatorio:`, e);
        }
      }
    }

    const resumen = {
      ok: true,
      mode: live ? "live" : "dry-run",
      vencidas: totalVencidas,
      procesadas: candidatas.length,
      borradas,
      bloqueadas,
      errores,
      recordatorios,
      recordatoriosErrores,
    };
    console.log(`[cron:account-deletion] resumen: ${JSON.stringify(resumen)}`);
    return noStore(NextResponse.json(resumen));
  } catch (e) {
    console.error("[cron:account-deletion] ERROR general de la corrida:", e);
    return noStore(NextResponse.json({ error: "Falló la corrida del robot." }, { status: 500 }));
  }
}

// Evita que cualquier intermediario cachee la respuesta de una acción que cambia estado.
function noStore(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store");
  return res;
}

// Vercel Cron dispara la tarea con GET; exponemos también POST para llamadas manuales.
export const GET = runRobot;
export const POST = runRobot;
