import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { profileSchema } from "@/lib/validations";
import { geocode } from "@/lib/geo";
import { sendBajaSolicitadaEmail } from "@/lib/email";
import { appBaseUrl } from "@/lib/urls";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/ratelimit";

// Actualiza el perfil del usuario actual
export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const parsed = profileSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const current = await prisma.user.findUnique({
    where: { id: user.id },
    select: { city: true, province: true, latitude: true, longitude: true },
  });

  // Re-geocoding si cambió la ubicación
  let lat = current?.latitude ?? null;
  let lng = current?.longitude ?? null;
  if (current && (current.city !== d.city || current.province !== d.province)) {
    try {
      const g = await geocode(`${d.city}, ${d.province}`);
      if (g) {
        lat = g.lat;
        lng = g.lng;
      }
    } catch {
      /* no bloqueante */
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      firstName: d.firstName,
      lastName: d.lastName,
      province: d.province,
      city: d.city,
      avatarUrl: d.avatarUrl || null,
      latitude: lat,
      longitude: lng,
    },
  });

  return NextResponse.json({ ok: true });
}

// Baja de cuenta en DOS FASES (ver docs/plan-borrado-dos-fases.md).
// Ya no borra al instante: programa el borrado a 90 días (período de gracia) o,
// si hay una denuncia abierta, deja la cuenta BLOQUEADA (sin borrado programado).
export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  // [SE MANTIENE] Límite anti-abuso.
  const limited = await enforceRateLimit(req, "delete_account", RATE_LIMITS.deleteAccount, user.id);
  if (limited) return limited;

  // [SE MANTIENE] No se puede dar de baja la ÚNICA cuenta de administrador.
  if (user.role === "ADMIN") {
    const admins = await prisma.user.count({ where: { role: "ADMIN" } });
    if (admins <= 1) {
      return NextResponse.json(
        { error: "No podés eliminar la única cuenta de administrador." },
        { status: 409 }
      );
    }
  }

  const current = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      deletionScheduledFor: true,
      legalHoldAt: true,
    },
  });
  if (!current) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  // Anti doble-clic: si ya está en gracia o bloqueada, no re-hacemos nada
  // (no reiniciamos los 90 días ni reenviamos el email).
  if (current.deletionScheduledFor || current.legalHoldAt) {
    return NextResponse.json({ ok: true, alreadyRequested: true });
  }

  // ¿Tiene denuncias EN REVISIÓN? → CAMINO DEL BLOQUEO.
  const openReports = await prisma.report.count({
    where: { status: "PENDING", listing: { sellerId: user.id } },
  });

  if (openReports > 0) {
    // Datos congelados (legalHoldAt), publicaciones pausadas, SIN fecha de borrado
    // y SIN Email 1. El borrado lo decidirá un admin a mano (Paso 6).
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { legalHoldAt: new Date() } }),
      prisma.listing.updateMany({
        where: { sellerId: user.id, status: "ACTIVE" },
        data: { status: "PAUSED" },
      }),
    ]);
    return NextResponse.json({
      ok: true,
      blocked: true,
      message:
        "Tu baja quedó pendiente por una disputa abierta en tu cuenta. La vamos a completar cuando ese tema se resuelva. Si tenés dudas, escribinos a soporte.",
    });
  }

  // CAMINO NORMAL: período de GRACIA de 90 días.
  const now = new Date();
  const deletionDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      // Usamos las fechas como marca de "en gracia" (NO suspendedAt), para que
      // la persona pueda seguir entrando a reactivar (ver Paso 4).
      data: { deletionRequestedAt: now, deletionScheduledFor: deletionDate },
    }),
    prisma.listing.updateMany({
      where: { sellerId: user.id, status: "ACTIVE" },
      data: { status: "PAUSED" },
    }),
  ]);

  // Email 1 — NO bloqueante: si falla, la baja igual queda registrada.
  try {
    const reactivateUrl = `${appBaseUrl(req)}/cuenta`;
    const name = `${current.firstName} ${current.lastName}`.trim();
    await sendBajaSolicitadaEmail(current.email, name, reactivateUrl, deletionDate);
  } catch (e) {
    console.error("No se pudo enviar el email de baja solicitada:", e);
  }

  return NextResponse.json({ ok: true, scheduled: true });
}
