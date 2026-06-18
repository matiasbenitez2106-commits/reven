import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Reactivación de cuenta en período de gracia (ver docs/plan-borrado-dos-fases.md).
// Deshace la baja: solo si la cuenta REALMENTE puede reactivarse. Una cuenta
// bloqueada por denuncia (legalHoldAt) NO la reactiva el usuario: la resuelve un admin.
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const current = await prisma.user.findUnique({
    where: { id: user.id },
    select: { deletionScheduledFor: true, legalHoldAt: true },
  });
  if (!current) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  // 1) VERIFICAR antes de tocar nada. ───────────────────────────────

  // Bloqueada por denuncia: solo un admin puede resolverla.
  if (current.legalHoldAt) {
    return NextResponse.json(
      {
        ok: false,
        reason: "blocked",
        message:
          "Tu cuenta está retenida por una disputa abierta y no se puede reactivar desde acá. Escribinos a soporte y lo resolvemos.",
      },
      { status: 409 }
    );
  }

  // No está en proceso de baja: no hay nada que reactivar.
  if (!current.deletionScheduledFor) {
    return NextResponse.json(
      {
        ok: false,
        reason: "not_in_grace",
        message: "Tu cuenta no está en proceso de baja, así que no hay nada que reactivar.",
      },
      { status: 409 }
    );
  }

  // Venció el plazo de gracia: ya no se puede reactivar.
  const now = new Date();
  if (current.deletionScheduledFor <= now) {
    return NextResponse.json(
      {
        ok: false,
        reason: "expired",
        message:
          "El plazo para reactivar tu cuenta ya venció. Si necesitás ayuda, escribinos a soporte.",
      },
      { status: 409 }
    );
  }

  // 2) + 3) Reactivar, en una sola operación atómica. ───────────────
  await prisma.$transaction([
    // Borramos las marcas de baja: la cuenta deja de estar programada para borrarse.
    prisma.user.update({
      where: { id: user.id },
      data: { deletionRequestedAt: null, deletionScheduledFor: null },
    }),
    // Despausamos SOLO las publicaciones que pausó la baja (las que tienen la marca),
    // y les limpiamos la marca. Las que el dueño pausó a mano quedan como están.
    prisma.listing.updateMany({
      where: { sellerId: user.id, deletionPausedAt: { not: null } },
      data: { status: "ACTIVE", deletionPausedAt: null },
    }),
  ]);

  return NextResponse.json({ ok: true, reactivated: true });
}
