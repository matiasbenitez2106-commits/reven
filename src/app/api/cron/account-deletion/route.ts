import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

// Robot diario de borrado de cuentas (ver docs/plan-borrado-dos-fases.md, Paso 7).
// PARTE 2 — SOLO MODO ENSAYO: detecta qué cuentas borraría y lo registra en el log.
// NO borra, NO manda emails, NO escribe en la base. El borrado real y los emails se
// conectan en la parte 3, gobernados por el interruptor ACCOUNT_DELETION_LIVE.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // (1) Llave de acceso: solo quien trae CRON_SECRET puede ejecutar el robot.
  // Vercel Cron manda este header automáticamente cuando CRON_SECRET está configurada.
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Falla cerrada: si no hay clave configurada, no se ejecuta nada.
    console.error("[cron:account-deletion] CRON_SECRET no está configurada; se rechaza.");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  // Comparación en TIEMPO CONSTANTE (como en src/lib/mercadopago.ts), para no
  // filtrar la clave por diferencias de tiempo de respuesta.
  const expected = Buffer.from(`Bearer ${secret}`);
  const provided = Buffer.from(req.headers.get("authorization") ?? "");
  if (
    expected.length !== provided.length ||
    !crypto.timingSafeEqual(expected, provided)
  ) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // (2) Interruptor: apagado por defecto = modo ENSAYO (no destructivo).
  const live = process.env.ACCOUNT_DELETION_LIVE === "true";

  // (3) Filtro de las tres condiciones (cuentas que se borrarían):
  //     venció el plazo + no se reactivó + no está bloqueada por denuncia.
  const now = new Date();
  const candidates = await prisma.user.findMany({
    where: {
      deletionScheduledFor: { not: null, lte: now }, // plazo vencido y baja vigente (si reactivó, queda null y se excluye)
      legalHoldAt: null,                              // no bloqueada por denuncia
    },
    select: { id: true, deletionScheduledFor: true },
  });

  // (4) Registro en el log: cuántas y cuáles (por id, sin datos personales).
  const ids = candidates.map((c) => c.id);
  console.log(
    `[cron:account-deletion] modo=${live ? "REAL" : "ENSAYO"} · cuentas que se borrarían: ${ids.length}`
  );
  if (ids.length > 0) {
    console.log(`[cron:account-deletion] ids: ${ids.join(", ")}`);
  }

  // (5) PARTE 3 (futuro): acá, SOLO si `live`, se ejecutará el borrado real
  //     (reusando deleteUserAccount) y se mandarán los emails 2 y 3, con la
  //     re-verificación de denuncias por cada cuenta. Por ahora NO se hace nada
  //     destructivo, ni siquiera con el interruptor encendido.
  //
  //     PENDIENTES PARA LA PARTE 3 (anotados para no perderlos):
  //       (a) pasar el método de GET a POST cuando conecte el borrado real.
  //       (b) evaluar procesar de a tandas (lotes) si hiciera falta por volumen.

  return NextResponse.json({
    ok: true,
    mode: live ? "live" : "dry-run",
    wouldDelete: ids.length,
  });
}
