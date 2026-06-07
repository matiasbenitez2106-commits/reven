import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { notify } from "@/lib/notifications";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/ratelimit";

// Lista de conversaciones del usuario
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const convos = await prisma.conversation.findMany({
    where: { OR: [{ buyerId: user.id }, { sellerId: user.id }] },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          status: true,
          images: { orderBy: { position: "asc" }, take: 1 },
        },
      },
      buyer: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, verification: true } },
      seller: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, verification: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });

  const ids = convos.map((c) => c.id);
  const unread = ids.length
    ? await prisma.message.groupBy({
        by: ["conversationId"],
        where: { conversationId: { in: ids }, senderId: { not: user.id }, readAt: null },
        _count: { _all: true },
      })
    : [];
  const unreadMap = new Map(unread.map((u) => [u.conversationId, u._count._all]));

  const conversations = convos.map((c) => {
    const other = c.buyerId === user.id ? c.seller : c.buyer;
    return {
      id: c.id,
      listing: {
        id: c.listing.id,
        title: c.listing.title,
        status: c.listing.status,
        image: c.listing.images[0]?.url ?? null,
      },
      other: {
        id: other.id,
        name: `${other.firstName} ${other.lastName}`,
        avatarUrl: other.avatarUrl,
        verification: other.verification,
      },
      lastMessage: c.messages[0]
        ? {
            body: c.messages[0].body,
            createdAt: c.messages[0].createdAt,
            mine: c.messages[0].senderId === user.id,
          }
        : null,
      unread: unreadMap.get(c.id) ?? 0,
      updatedAt: c.updatedAt,
    };
  });

  return NextResponse.json({ conversations });
}

// Crear (o recuperar) la conversación de un comprador con el vendedor de una publicación
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const limited = await enforceRateLimit(req, "contact", RATE_LIMITS.contact, user.id);
  if (limited) return limited;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { verification: true },
  });
  if (dbUser?.verification !== "VERIFIED") {
    return NextResponse.json(
      { error: "Verificá tu identidad para contactar vendedores." },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const listingId: string | undefined = body?.listingId;
  if (!listingId) return NextResponse.json({ error: "Falta listingId" }, { status: 400 });

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, sellerId: true, status: true, title: true },
  });
  if (!listing || listing.status === "DELETED") {
    return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
  }
  if (listing.sellerId === user.id) {
    return NextResponse.json({ error: "No podés contactarte a vos mismo." }, { status: 400 });
  }

  const existing = await prisma.conversation.findUnique({
    where: { listingId_buyerId: { listingId, buyerId: user.id } },
    select: { id: true },
  });
  if (existing) return NextResponse.json(existing, { status: 200 });

  const convo = await prisma.conversation.create({
    data: { listingId, buyerId: user.id, sellerId: listing.sellerId },
    select: { id: true },
  });

  // Aviso al vendedor: nuevo interesado
  await notify({
    userId: listing.sellerId,
    type: "CONTACT",
    title: "Tenés un nuevo interesado",
    body: listing.title,
    link: `/mensajes/${convo.id}`,
  });

  return NextResponse.json(convo, { status: 201 });
}
