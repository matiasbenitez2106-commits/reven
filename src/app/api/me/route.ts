import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { profileSchema } from "@/lib/validations";
import { geocode } from "@/lib/geo";
import { deleteUserAccount } from "@/lib/account";
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

// Elimina la cuenta del usuario actual y todos sus datos (derecho de supresión).
// Borra imágenes de Cloudinary (DNI/selfie, fotos y avatar) y el registro en la
// base (que en cascada elimina publicaciones, mensajes, favoritos, etc.).
export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const limited = await enforceRateLimit(req, "delete_account", RATE_LIMITS.deleteAccount, user.id);
  if (limited) return limited;

  // No permitimos eliminar la ÚNICA cuenta de administrador (dejaría al sistema sin admin).
  if (user.role === "ADMIN") {
    const admins = await prisma.user.count({ where: { role: "ADMIN" } });
    if (admins <= 1) {
      return NextResponse.json(
        { error: "No podés eliminar la única cuenta de administrador." },
        { status: 409 }
      );
    }
  }

  // No permitimos borrar la cuenta si hay denuncias EN REVISIÓN en su contra:
  // evita que alguien destruya la evidencia que la justicia podría requerir.
  const openReports = await prisma.report.count({
    where: { status: "PENDING", listing: { sellerId: user.id } },
  });
  if (openReports > 0) {
    return NextResponse.json(
      {
        error:
          "No podés eliminar tu cuenta mientras tengas denuncias en revisión. Escribinos a soporte para resolverlo.",
      },
      { status: 409 }
    );
  }

  try {
    await deleteUserAccount(user.id);
  } catch (e) {
    console.error("No se pudo eliminar la cuenta:", e);
    // Propagamos el motivo (p.ej. fallo al borrar imágenes) para no aparentar un borrado exitoso.
    const msg = e instanceof Error ? e.message : "No se pudo eliminar la cuenta.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
