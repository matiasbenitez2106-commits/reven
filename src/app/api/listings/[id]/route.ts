import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { listingSchema } from "@/lib/validations";
import { deleteImage } from "@/lib/storage";
import { geocode } from "@/lib/geo";
import { findDuplicateActiveListing } from "@/lib/listings";

type Params = { params: { id: string } };

// Detalle público de una publicación
export async function GET(_req: Request, { params }: Params) {
  const l = await prisma.listing.findUnique({
    where: { id: params.id },
    include: {
      images: { orderBy: { position: "asc" } },
      category: true,
      seller: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          verification: true,
          city: true,
          province: true,
          avatarUrl: true,
          createdAt: true,
        },
      },
    },
  });

  if (!l || l.status === "DELETED") {
    return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
  }

  return NextResponse.json({
    ...l,
    price: Number(l.price),
  });
}

// Editar / cambiar estado (solo dueño)
export async function PATCH(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const existing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: { images: true },
  });
  if (!existing || existing.status === "DELETED") {
    return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
  }
  const isAdmin = user.role === "ADMIN";
  if (existing.sellerId !== user.id && !isAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);

  // Cambio de estado simple (marcar vendido / pausar / reactivar) — dueño o admin
  if (body && typeof body.status === "string" && !body.title) {
    const status = body.status;
    if (!["ACTIVE", "SOLD", "PAUSED"].includes(status)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }

    // Comprador (opcional) al marcar como vendido. Se valida SIEMPRE en el
    // servidor: no se confía en lo que manda el cliente.
    let soldToId: string | null = null;
    if (status === "SOLD") {
      // Marcar como vendido es solo del dueño (el admin modera por su propia ruta).
      if (existing.sellerId !== user.id) {
        return NextResponse.json(
          { error: "Solo el dueño puede marcar como vendido" },
          { status: 403 }
        );
      }
      const raw = body.soldToId;
      if (typeof raw === "string" && raw.length > 0) {
        // El comprador tiene que haber escrito por ESTA publicación (tener una
        // conversación). Si no, se rechaza: evita asignar a cualquier usuario.
        const convo = await prisma.conversation.findUnique({
          where: { listingId_buyerId: { listingId: existing.id, buyerId: raw } },
          select: { id: true },
        });
        if (!convo) {
          return NextResponse.json(
            { error: "El comprador seleccionado no escribió por esta publicación" },
            { status: 400 }
          );
        }
        soldToId = raw;
      }
      // Si no viene soldToId válido, queda null: "vendí por fuera de Trato".
    }

    const updated = await prisma.listing.update({
      where: { id: existing.id },
      data: {
        status,
        // Al vender: fija fecha y comprador. Al reactivar/pausar: los limpia.
        soldAt: status === "SOLD" ? new Date() : null,
        soldToId: status === "SOLD" ? soldToId : null,
      },
      select: { id: true, status: true },
    });
    return NextResponse.json(updated);
  }

  // Edición completa
  const parsed = listingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const d = parsed.data;

  // La edición completa es solo del dueño (el admin solo modera estado/eliminación)
  if (existing.sellerId !== user.id) {
    return NextResponse.json({ error: "Solo el dueño puede editar" }, { status: 403 });
  }

  // Evita que la edición choque con otra publicación activa del mismo producto
  const dup = await findDuplicateActiveListing(user.id, d.title, existing.id);
  if (dup) {
    return NextResponse.json(
      { error: `Ya tenés otra publicación activa parecida ("${dup}").` },
      { status: 409 }
    );
  }

  // Borrar de storage las imágenes que se quitaron
  const keepUrls = new Set(d.images.map((i) => i.url));
  const removed = existing.images.filter((img) => !keepUrls.has(img.url));
  await Promise.all(removed.map((img) => deleteImage(img.publicId)));

  // Re-geocoding si cambió la ubicación y no vinieron coords
  let lat = d.latitude ?? existing.latitude;
  let lng = d.longitude ?? existing.longitude;
  if (
    (d.city !== existing.city || d.province !== existing.province) &&
    d.latitude == null &&
    d.longitude == null
  ) {
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

  await prisma.$transaction([
    prisma.listingImage.deleteMany({ where: { listingId: existing.id } }),
    prisma.listing.update({
      where: { id: existing.id },
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
        images: {
          create: d.images.map((img, i) => ({
            url: img.url,
            publicId: img.publicId ?? null,
            position: i,
          })),
        },
      },
    }),
  ]);

  return NextResponse.json({ id: existing.id });
}

// Eliminar (solo dueño)
export async function DELETE(_req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const existing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: { images: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
  }
  // Dueño o admin (moderación)
  if (existing.sellerId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  await Promise.all(existing.images.map((img) => deleteImage(img.publicId)));
  await prisma.listing.delete({ where: { id: existing.id } });

  return NextResponse.json({ ok: true });
}
