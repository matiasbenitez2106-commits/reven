import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { profileSchema } from "@/lib/validations";
import { geocode } from "@/lib/geo";

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
