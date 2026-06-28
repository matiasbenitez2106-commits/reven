import { prisma } from "./prisma";

// ──────────────────────────────────────────────
// Destrabar el contacto en el chat una vez cerrado el trato (I12).
// Una conversación (listingId L, buyerId B) se DESTRABA cuando:
//   listing.soldToId === B   O   existe Offer{listingId:L, buyerId:B, status:ACCEPTED}
// Si no, el contacto se sigue enmascarando (comportamiento de I4).
// ──────────────────────────────────────────────

/** Lógica PURA: ¿está desbloqueada la conversación de este comprador? */
export function isConversationUnlocked(params: {
  soldToId: string | null;
  buyerId: string;
  hasAcceptedOffer: boolean;
}): boolean {
  return params.soldToId === params.buyerId || params.hasAcceptedOffer;
}

/** Resuelve el unlock de UNA conversación (corto-circuito por soldTo; si no, 1 query). */
export async function resolveConversationUnlocked(params: {
  listingId: string;
  buyerId: string;
  soldToId: string | null;
}): Promise<boolean> {
  // Si la publicación ya se vendió a este comprador, está desbloqueada sin consultar.
  if (params.soldToId === params.buyerId) return true;
  const accepted = await prisma.offer.findFirst({
    where: { listingId: params.listingId, buyerId: params.buyerId, status: "ACCEPTED" },
    select: { id: true },
  });
  return isConversationUnlocked({
    soldToId: params.soldToId,
    buyerId: params.buyerId,
    hasAcceptedOffer: !!accepted,
  });
}

/**
 * Resuelve el unlock de un conjunto de conversaciones SIN N+1 (para el inbox):
 * el soldTo ya viene en cada conversación; las que faltan se resuelven con UNA
 * sola query de ofertas ACCEPTED por los pares (listingId, buyerId).
 * Devuelve el Set de conversationIds desbloqueadas.
 */
export async function resolveUnlockedConversations(
  convos: { id: string; listingId: string; buyerId: string; soldToId: string | null }[]
): Promise<Set<string>> {
  const unlocked = new Set<string>();
  const pending = [];
  for (const c of convos) {
    if (c.soldToId === c.buyerId) unlocked.add(c.id);
    else pending.push(c);
  }
  if (pending.length === 0) return unlocked;

  const offers = await prisma.offer.findMany({
    where: {
      status: "ACCEPTED",
      listingId: { in: pending.map((c) => c.listingId) },
      buyerId: { in: pending.map((c) => c.buyerId) },
    },
    select: { listingId: true, buyerId: true },
  });
  // Membresía por par EXACTO: una oferta cruzada (otro par) no destraba a nadie.
  const acceptedKeys = new Set(offers.map((o) => `${o.listingId}|${o.buyerId}`));
  for (const c of pending) {
    if (acceptedKeys.has(`${c.listingId}|${c.buyerId}`)) unlocked.add(c.id);
  }
  return unlocked;
}
