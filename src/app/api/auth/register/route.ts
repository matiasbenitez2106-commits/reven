import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { geocode } from "@/lib/geo";

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { firstName, lastName, email, password, province, city } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Ya existe una cuenta con ese email." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // Geocoding aproximado de la ubicación del usuario (para búsquedas por proximidad)
  let latitude: number | null = null;
  let longitude: number | null = null;
  try {
    const coords = await geocode(`${city}, ${province}`);
    if (coords) {
      latitude = coords.lat;
      longitude = coords.lng;
    }
  } catch {
    // no bloqueante
  }

  const user = await prisma.user.create({
    data: { firstName, lastName, email, passwordHash, province, city, latitude, longitude },
    select: { id: true, email: true },
  });

  return NextResponse.json(user, { status: 201 });
}
