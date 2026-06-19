import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { deleteUserAccount } from "@/lib/account";

const bodySchema = z.object({ email: z.string().min(1) });

// Completa la baja de una cuenta BLOQUEADA por denuncia (borrado real e
// irreversible). Opción D: el admin debe escribir el email de la cuenta para
// confirmar. TODAS las salvaguardas se verifican acá, en el servidor (no alcanza
// con la pantalla). Ver docs/plan-borrado-dos-fases.md (Paso 6).
export async function POST(req: Request, { params }: { params: { id: string } }) {
  // (1) Solo ADMIN, además del middleware.
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Falta el email de confirmación." }, { status: 400 });
  }
  const typedEmail = parsed.data.email.trim().toLowerCase();

  const target = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, email: true, role: true, legalHoldAt: true },
  });
  if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  // Salvaguarda extra: no borrar la propia cuenta del admin desde acá.
  if (target.id === admin.id) {
    return NextResponse.json(
      { error: "No podés borrar tu propia cuenta desde acá." },
      { status: 400 }
    );
  }

  // (2) Tiene que estar realmente BLOQUEADA.
  if (!target.legalHoldAt) {
    return NextResponse.json(
      {
        error:
          "Esta cuenta no está bloqueada, así que no corresponde completar la baja desde acá.",
      },
      { status: 409 }
    );
  }

  // (3) No puede quedar ninguna denuncia abierta (re-chequeado AHORA).
  const pendientes = await prisma.report.count({
    where: { status: "PENDING", listing: { sellerId: target.id } },
  });
  if (pendientes > 0) {
    return NextResponse.json(
      {
        error: `Todavía hay ${pendientes} denuncia(s) abierta(s) sobre esta cuenta. Resolvelas antes de completar la baja.`,
      },
      { status: 409 }
    );
  }

  // (4) Confirmación reforzada: el email escrito debe coincidir con el de la cuenta.
  if (typedEmail !== target.email.trim().toLowerCase()) {
    return NextResponse.json(
      { error: "El email no coincide con el de la cuenta. No se borró nada." },
      { status: 400 }
    );
  }

  // (5) Protección del único admin.
  if (target.role === "ADMIN") {
    const admins = await prisma.user.count({ where: { role: "ADMIN" } });
    if (admins <= 1) {
      return NextResponse.json(
        { error: "No podés borrar la única cuenta de administrador." },
        { status: 409 }
      );
    }
  }

  // (7) Rastro en el log ANTES de borrar (después, el email ya no existe).
  console.warn(
    `[baja-bloqueada] admin ${admin.id} (${admin.email}) completa la baja de la cuenta ${target.id} (${target.email})`
  );

  // (6) Borrado real reutilizando la función existente (Cloudinary + cascada).
  try {
    await deleteUserAccount(target.id, { requireNoOpenReports: true });
  } catch (e) {
    // El error completo queda en el LOG del servidor (para diagnóstico). Al admin
    // le devolvemos solo un texto genérico, sin exponer detalles internos
    // (p. ej. rutas o publicIds de Cloudinary).
    console.error(`[baja-bloqueada] FALLO el borrado de ${target.id}:`, e);
    return NextResponse.json(
      { error: "No se pudo completar el borrado. Quedó registrado; probá de nuevo en un momento." },
      { status: 500 }
    );
  }

  console.warn(`[baja-bloqueada] OK: cuenta ${target.id} borrada por admin ${admin.id}`);
  return NextResponse.json({ ok: true, deleted: true });
}
