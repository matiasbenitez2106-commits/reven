import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { listingSchema, searchSchema } from "@/lib/validations";
import { searchListings, findDuplicateActiveListing } from "@/lib/listings";
import { geocode } from "@/lib/geo";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/ratelimit";
import { logEvent } from "@/lib/analytics";

// Búsqueda / listado público de publicaciones
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = searchSchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }
  const result = await searchListings(parsed.data);
  return NextResponse.json(result);
}

// Crear publicación (requiere identidad verificada)
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const limited = await enforceRateLimit(req, "listing", RATE_LIMITS.write, user.id);
  if (limited) return limited;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { verification: true },
  });
  if (dbUser?.verification !== "VERIFIED") {
    return NextResponse.json(
      { error: "Necesitás verificar tu identidad para publicar." },
      { status: 403 }
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = listingSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const d = parsed.data;

  // Evita publicaciones duplicadas del mismo producto (mismo vendedor)
  const dup = await findDuplicateActiveListing(user.id, d.title);
  if (dup) {
    return NextResponse.json(
      {
        error: `Ya tenés una publicación activa parecida ("${dup}"). Editá esa en vez de crear otra del mismo producto.`,
      },
      { status: 409 }
    );
  }

  // Geocoding si no vino lat/lng del cliente
  let lat = d.latitude ?? null;
  let lng = d.longitude ?? null;
  if (lat == null || lng == null) {
    try {
      const q = `${d.neighborhood ? d.neighborhood + ", " : ""}${d.city}, ${d.province}`;
      const g = await geocode(q);
      if (g) {
        lat = g.lat;
        lng = g.lng;
      }
    } catch {
      /* no bloqueante */
    }
  }

  const listing = await prisma.listing.create({
    data: {
      title: d.title,
      description: d.description,
      price: d.price,
      condition: d.condition,
      categoryId: d.categoryId,
      province: d.province,
      city: d.city,
      neighborhood: d.neighborhood || null,
      latitude: lat,
      longitude: lng,
      sellerId: user.id,
      images: {
        create: d.images.map((img, i) => ({
          url: img.url,
          publicId: img.publicId ?? null,
          position: i,
        })),
      },
    },
    select: { id: true },
  });
  await logEvent("publicacion_creada");

  return NextResponse.json(listing, { status: 201 });
}
