import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { listingSchema } from "@/lib/validations";
import { notify } from "@/lib/notifications";
import { sendReviewPromptEmail } from "@/lib/email";
import { deleteImage } from "@/lib/storage";
import { geocode } from "@/lib/geo";
import { findDuplicateActiveListing, getListingBuyers } from "@/lib/listings";
import { logEvent } from "@/lib/analytics";

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
        // Validamos contra la MISMA fuente que el modal: getListingBuyers incluye a
        // quien escribió por la publicación O a quien tiene una oferta aceptada
        // (con Ofertas, D4, el comprador puede no haber chateado nunca). Así UI y
        // servidor siempre coinciden y no se asigna a cualquier usuario.
        const buyers = await getListingBuyers(existing.id);
        if (!buyers.some((b) => b.id === raw)) {
          return NextResponse.json(
            { error: "El comprador seleccionado no es válido para esta publicación" },
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
    // Evento de embudo: venta concretada (marcada como vendida).
    if (status === "SOLD") await logEvent("venta_concretada");

    // Liberar la reserva: si pasó de RESERVED a ACTIVE, avisamos al comprador que
    // tenía la oferta aceptada que la publicación volvió a estar disponible.
    if (existing.status === "RESERVED" && status === "ACTIVE") {
      const accepted = await prisma.offer.findFirst({
        where: { listingId: existing.id, status: "ACCEPTED" },
        orderBy: { updatedAt: "desc" },
        select: { buyerId: true },
      });
      if (accepted) {
        await notify({
          userId: accepted.buyerId,
          type: "OFFER",
          title: "La reserva se liberó",
          body: "La publicación que tenías reservada volvió a estar disponible.",
          link: `/articulos/${existing.id}`,
        });
      }
    }

    // Si se marcó como VENDIDA, cerramos las ofertas abiertas (PENDING/COUNTERED)
    // que hayan quedado colgadas, para que nadie pueda aceptarlas después.
    if (status === "SOLD") {
      const open = await prisma.offer.findMany({
        where: { listingId: existing.id, status: { in: ["PENDING", "COUNTERED"] } },
        select: { buyerId: true, status: true },
      });
      if (open.length > 0) {
        await prisma.offer.updateMany({
          where: { listingId: existing.id, status: { in: ["PENDING", "COUNTERED"] } },
          data: { status: "REJECTED" },
        });
        const buyers = Array.from(
          new Set(open.filter((o) => o.status === "PENDING").map((o) => o.buyerId))
        );
        for (const bId of buyers) {
          await notify({
            userId: bId,
            type: "OFFER",
            title: "Tu oferta fue rechazada",
            body: "La publicación se vendió.",
            link: `/articulos/${existing.id}`,
          });
        }
      }
    }

    // Venta a un comprador real (no "vendí por fuera"): avisar a AMBOS para que se
    // califiquen (reputación en doble sentido).
    if (status === "SOLD" && soldToId) {
      const [buyer, seller] = await Promise.all([
        prisma.user.findUnique({ where: { id: soldToId }, select: { email: true, firstName: true } }),
        prisma.user.findUnique({
          where: { id: existing.sellerId },
          select: { email: true, firstName: true },
        }),
      ]);
      const sellerName = seller?.firstName ?? "el vendedor";
      const buyerName = buyer?.firstName ?? "el comprador";

      // Comprador → calificar al vendedor.
      await notify({
        userId: soldToId,
        type: "REVIEW",
        title: "¡Felicitaciones por tu compra! 🎉",
        body: `Contanos cómo te fue — calificá a ${sellerName}.`,
        link: `/articulos/${existing.id}`,
      });
      // Vendedor → calificar al comprador.
      await notify({
        userId: existing.sellerId,
        type: "REVIEW",
        title: "¡Vendiste! 🎉",
        body: `Contanos cómo te fue — calificá a ${buyerName}.`,
        link: `/articulos/${existing.id}`,
      });

      try {
        if (buyer) {
          await sendReviewPromptEmail(buyer.email, existing.title, sellerName, existing.id, "Calificar al vendedor");
        }
        if (seller) {
          await sendReviewPromptEmail(seller.email, existing.title, buyerName, existing.id, "Calificar al comprador");
        }
      } catch (e) {
        console.error("emails aviso para calificar:", e);
      }
    }

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
