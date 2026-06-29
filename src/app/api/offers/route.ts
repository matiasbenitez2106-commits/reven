import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { offerSchema } from "@/lib/validations";
import { notify } from "@/lib/notifications";
import { sendNewOfferEmail } from "@/lib/email";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/ratelimit";
import { validateNewOffer, hasLivePendingOffer, computeExpiry, proposerRole } from "@/lib/offers";
import { findOrCreateConversation, offerMessageData, offerNoteMessageData } from "@/lib/conversations";
import { getBuyerRatings } from "@/lib/listings";
import { getAuthedUser } from "@/lib/auth-token";
import { logEvent } from "@/lib/analytics";
import { formatPrice } from "@/lib/utils";

// Ofertas RECIBIDAS por este usuario (privado: sellerId = yo). Espeja /ofertas:
// una fila por negociación (sin COUNTERED), con ★ del comprador y el chat linkeado.
export async function GET(req: Request) {
  const user = await getAuthedUser(req);
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const now = new Date();
  // Expiry perezoso: vencé las PENDING vencidas dirigidas a este vendedor.
  await prisma.offer.updateMany({
    where: { sellerId: user.id, status: "PENDING", expiresAt: { lt: now } },
    data: { status: "EXPIRED" },
  });

  // SOLO las recibidas por mí (sellerId = user.id). Nunca las de otro vendedor.
  const offers = await prisma.offer.findMany({
    where: { sellerId: user.id, status: { not: "COUNTERED" } },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      amount: true,
      status: true,
      message: true,
      createdAt: true,
      proposedById: true,
      sellerId: true,
      buyerId: true,
      buyer: { select: { firstName: true, lastName: true, avatarUrl: true } },
      listing: { select: { id: true, title: true } },
    },
  });

  const buyerRatings = await getBuyerRatings(offers.map((o) => o.buyerId));
  // Conversaciones del vendedor → conversationId por par (listingId, buyerId).
  const convos = await prisma.conversation.findMany({
    where: { sellerId: user.id },
    select: { id: true, listingId: true, buyerId: true },
  });
  const convoByPair = new Map(convos.map((c) => [`${c.listingId}::${c.buyerId}`, c.id]));

  const result = offers.map((o) => {
    const br = buyerRatings.get(o.buyerId);
    return {
      id: o.id,
      amount: o.amount,
      status: o.status,
      message: o.message,
      createdAt: o.createdAt,
      proposer: proposerRole(o),
      buyer: {
        id: o.buyerId,
        name: `${o.buyer.firstName} ${o.buyer.lastName}`,
        avatarUrl: o.buyer.avatarUrl,
        rating: br && br.count > 0 ? { rating: br.rating ?? 0, count: br.count } : null,
      },
      listing: { id: o.listing.id, title: o.listing.title },
      conversationId: convoByPair.get(`${o.listing.id}::${o.buyerId}`) ?? null,
    };
  });

  return NextResponse.json({ offers: result });
}

// Crear una oferta sobre una publicación (la hace el comprador).
// D4: ofertar NO requiere verificación (a diferencia de mensajear).
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const limited = await enforceRateLimit(req, "offer", RATE_LIMITS.write, user.id);
  if (limited) return limited;

  const parsed = offerSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const { listingId, amount, message } = parsed.data;

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, sellerId: true, status: true, title: true },
  });
  if (!listing || listing.status === "DELETED") {
    return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
  }
  if (listing.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "Esta publicación no está disponible para ofertas." },
      { status: 409 }
    );
  }

  // sellerId se deriva del listing (nunca del cliente). No ofertar en la propia.
  const v = validateNewOffer(user.id, listing.sellerId);
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });

  const now = new Date();
  // Expiry perezoso: vencé cualquier PENDING vencida de este comprador acá.
  await prisma.offer.updateMany({
    where: { listingId, buyerId: user.id, status: "PENDING", expiresAt: { lt: now } },
    data: { status: "EXPIRED" },
  });

  // Una sola oferta viva (PENDING) por (publicación, comprador).
  const myOffers = await prisma.offer.findMany({
    where: { listingId, buyerId: user.id },
    select: { status: true },
  });
  if (hasLivePendingOffer(myOffers)) {
    return NextResponse.json(
      { error: "Ya tenés una oferta activa en esta publicación." },
      { status: 409 }
    );
  }

  // La oferta vive DENTRO del chat: en una sola transacción creamos la Offer,
  // buscamos/creamos la conversación (comprador↔vendedor por esta publi) y
  // dejamos el mensaje especial kind=OFFER. Lo creamos con prisma directo (no por
  // el route de mensajes) a propósito: así NO dispara la notif de "nuevo mensaje"
  // ni pasa por el gate de verificación — ofertar sigue sin verificación (D4).
  const { offer, conversationId } = await prisma.$transaction(async (tx) => {
    const offer = await tx.offer.create({
      data: {
        listingId,
        buyerId: user.id,
        sellerId: listing.sellerId,
        proposedById: user.id,
        amount,
        message: message || null,
        status: "PENDING",
        expiresAt: computeExpiry(now),
      },
      select: { id: true },
    });
    const conversation = await findOrCreateConversation(listingId, user.id, listing.sellerId, tx);
    // body "Oferta: $X": NO pasa por hideContactInfo (I4 solo enmascara TEXT).
    await tx.message.create({
      data: { conversationId: conversation.id, ...offerMessageData({ offerId: offer.id, senderId: user.id, amount }), createdAt: now },
    });
    // Mensaje opcional → burbuja TEXT normal, JUSTO DEBAJO del card (createdAt +1ms).
    // Va por I4/unlock como cualquier texto. Sin notif extra (ya va la de oferta).
    const note = offerNoteMessageData({ senderId: user.id, message, after: now });
    if (note) await tx.message.create({ data: { conversationId: conversation.id, ...note } });
    // Subir la conversación al tope del inbox.
    await tx.conversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });
    return { offer, conversationId: conversation.id };
  });
  await logEvent("oferta_hecha");

  // Notificar al vendedor (in-app siempre + email: evento clave). Linkea al chat.
  await notify({
    userId: listing.sellerId,
    type: "OFFER",
    title: `Nueva oferta: ${formatPrice(amount)}`,
    body: `Por "${listing.title}"`,
    link: `/mensajes/${conversationId}`,
  });
  try {
    const seller = await prisma.user.findUnique({
      where: { id: listing.sellerId },
      select: { email: true },
    });
    if (seller) await sendNewOfferEmail(seller.email, user.name ?? "Alguien", listing.title, amount);
  } catch (e) {
    console.error("email oferta nueva:", e);
  }

  return NextResponse.json({ ok: true, id: offer.id }, { status: 201 });
}
