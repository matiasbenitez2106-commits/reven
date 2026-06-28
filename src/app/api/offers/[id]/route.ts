import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { offerActionSchema } from "@/lib/validations";
import { notify } from "@/lib/notifications";
import { sendOfferClosedEmail } from "@/lib/email";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/ratelimit";
import {
  actorRole,
  proposerRole,
  canActOnOffer,
  isOfferExpired,
  computeExpiry,
  siblingsToReject,
  isListingOpenForOffers,
} from "@/lib/offers";
import { findOrCreateConversation, offerMessageData } from "@/lib/conversations";
import { formatPrice } from "@/lib/utils";

type Params = { params: { id: string } };

// Aceptar / rechazar / contraofertar / cancelar una oferta. Todo validado en el
// servidor (no se confía en el cliente): rol, estado vigente y vencimiento.
export async function PATCH(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const limited = await enforceRateLimit(req, "offer", RATE_LIMITS.write, user.id);
  if (limited) return limited;

  const parsed = offerActionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const { action, amount, message } = parsed.data;

  const offer = await prisma.offer.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      listingId: true,
      buyerId: true,
      sellerId: true,
      proposedById: true,
      status: true,
      amount: true,
      expiresAt: true,
      listing: { select: { title: true, status: true } },
    },
  });
  if (!offer) return NextResponse.json({ error: "Oferta no encontrada" }, { status: 404 });

  const role = actorRole(offer, user.id);
  if (!role) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const now = new Date();
  // Expiry también al ACTUAR: nadie puede aceptar/contraofertar una oferta vencida.
  if (isOfferExpired(offer.status, offer.expiresAt, now)) {
    await prisma.offer.update({ where: { id: offer.id }, data: { status: "EXPIRED" } });
    return NextResponse.json({ error: "La oferta venció (48 hs)." }, { status: 409 });
  }

  const proposer = proposerRole(offer);
  if (!canActOnOffer({ status: offer.status, proposer, actor: role, action })) {
    return NextResponse.json(
      { error: "No podés realizar esa acción sobre esta oferta." },
      { status: 403 }
    );
  }

  const otherPartyId = role === "SELLER" ? offer.buyerId : offer.sellerId;
  // Toda la negociación vive en un hilo (listingId, buyerId): las notifs de oferta
  // linkean a esa conversación.
  const convLink = (id: string) => `/mensajes/${id}`;

  // ── Cancelar (retira el proponente) / Rechazar (declina el receptor) ──
  if (action === "cancel" || action === "reject") {
    const status = action === "cancel" ? "CANCELLED" : "REJECTED";
    const conversation = await prisma.$transaction(async (tx) => {
      await tx.offer.update({ where: { id: offer.id }, data: { status } });
      return findOrCreateConversation(offer.listingId, offer.buyerId, offer.sellerId, tx);
    });
    await notify({
      userId: otherPartyId,
      type: "OFFER",
      title: action === "cancel" ? "Retiraron una oferta" : "Rechazaron una oferta",
      body: `Por "${offer.listing.title}"`,
      link: convLink(conversation.id),
    });
    return NextResponse.json({ ok: true });
  }

  // ── Contraoferta: nueva fila ligada por parentOfferId; la actual pasa a COUNTERED ──
  if (action === "counter") {
    if (!amount) {
      return NextResponse.json({ error: "Falta el monto de la contraoferta." }, { status: 400 });
    }
    const { created, conversationId } = await prisma.$transaction(async (tx) => {
      await tx.offer.update({ where: { id: offer.id }, data: { status: "COUNTERED" } });
      const created = await tx.offer.create({
        data: {
          listingId: offer.listingId,
          buyerId: offer.buyerId,
          sellerId: offer.sellerId,
          proposedById: user.id,
          amount,
          message: message || null,
          status: "PENDING",
          parentOfferId: offer.id,
          expiresAt: computeExpiry(now),
        },
        select: { id: true },
      });
      // La contraoferta también aparece como card en el mismo hilo. senderId = quien
      // contraoferta. body "Oferta: $X" NO pasa por hideContactInfo (I4 solo TEXT).
      const conversation = await findOrCreateConversation(offer.listingId, offer.buyerId, offer.sellerId, tx);
      await tx.message.create({
        data: { conversationId: conversation.id, ...offerMessageData({ offerId: created.id, senderId: user.id, amount }) },
      });
      await tx.conversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });
      return { created, conversationId: conversation.id };
    });
    await notify({
      userId: otherPartyId,
      type: "OFFER",
      title: `Contraoferta: ${formatPrice(amount)}`,
      body: `Por "${offer.listing.title}"`,
      link: convLink(conversationId),
    });
    return NextResponse.json({ ok: true, id: created.id });
  }

  // ── Aceptar: reservar + rechazar hermanas + notificar, TODO atómico ──
  // Revalidá el estado ACTUAL de la publicación: una oferta colgada en una publi
  // que ya se vendió/borró/pausó por otro flujo NO debe resucitarla a RESERVED.
  if (!isListingOpenForOffers(offer.listing.status)) {
    return NextResponse.json(
      { error: "La publicación ya no está disponible." },
      { status: 409 }
    );
  }

  // Hermanas = ofertas activas de OTROS compradores en esta publicación.
  const siblings = await prisma.offer.findMany({
    where: { listingId: offer.listingId, status: { in: ["PENDING", "COUNTERED"] } },
    select: { id: true, buyerId: true, status: true },
  });
  const rejectedBuyerIds = Array.from(
    new Set(
      siblingsToReject(siblings, offer.buyerId)
        .filter((o) => o.status === "PENDING")
        .map((o) => o.buyerId)
    )
  );

  await prisma.$transaction(async (tx) => {
    await tx.offer.update({ where: { id: offer.id }, data: { status: "ACCEPTED" } });
    await tx.listing.update({ where: { id: offer.listingId }, data: { status: "RESERVED" } });
    await tx.offer.updateMany({
      where: {
        listingId: offer.listingId,
        buyerId: { not: offer.buyerId },
        status: { in: ["PENDING", "COUNTERED"] },
      },
      data: { status: "REJECTED" },
    });
    // El hilo del trato cerrado (comprador↔vendedor de esta oferta).
    const conversation = await findOrCreateConversation(offer.listingId, offer.buyerId, offer.sellerId, tx);
    // Notificaciones in-app dentro de la transacción (atómicas con el estado).
    await tx.notification.create({
      data: {
        userId: offer.buyerId,
        type: "OFFER",
        title: `¡Trato cerrado! ${formatPrice(offer.amount)}`,
        body: `"${offer.listing.title}" quedó reservada para vos.`,
        link: convLink(conversation.id),
      },
    });
    await tx.notification.create({
      data: {
        userId: offer.sellerId,
        type: "OFFER",
        title: `¡Trato cerrado! ${formatPrice(offer.amount)}`,
        body: `"${offer.listing.title}" quedó reservada.`,
        link: convLink(conversation.id),
      },
    });
    if (rejectedBuyerIds.length) {
      // Cada comprador rechazado ve el card en SU propio hilo (fallback al artículo).
      const sibConvos = await tx.conversation.findMany({
        where: { listingId: offer.listingId, buyerId: { in: rejectedBuyerIds } },
        select: { id: true, buyerId: true },
      });
      const convByBuyer = new Map(sibConvos.map((c) => [c.buyerId, c.id]));
      for (const bId of rejectedBuyerIds) {
        const cid = convByBuyer.get(bId);
        await tx.notification.create({
          data: {
            userId: bId,
            type: "OFFER",
            title: "Tu oferta fue rechazada",
            body: `"${offer.listing.title}" se reservó para otro comprador.`,
            link: cid ? convLink(cid) : `/articulos/${offer.listingId}`,
          },
        });
      }
    }
  });

  // Email a la otra parte (quien NO ejecutó la aceptación), neutro. Post-commit.
  try {
    const other = await prisma.user.findUnique({
      where: { id: otherPartyId },
      select: { email: true },
    });
    if (other) {
      await sendOfferClosedEmail(other.email, offer.listing.title, offer.amount, offer.listingId);
    }
  } catch (e) {
    console.error("email trato cerrado:", e);
  }

  return NextResponse.json({ ok: true });
}
