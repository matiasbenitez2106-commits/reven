import { prisma } from "./prisma";

/**
 * Cliente Prisma o transacción (tx): así el upsert puede correr dentro de un
 * $transaction. Tipamos solo lo que usamos (conversation.upsert), idéntico en el
 * cliente y en el tx — el union plano no sirve con el cliente extendido de Prisma 5.
 */
type Db = { conversation: { upsert: (typeof prisma)["conversation"]["upsert"] } };

/** Texto del Message de una oferta (para el inbox preview y como fallback). */
function offerBody(amount: number): string {
  return `Oferta: $${amount.toLocaleString("es-AR")}`;
}

/**
 * Data para crear un Message de tipo OFFER (puro, sin DB). El body "Oferta: $X"
 * NO pasa por hideContactInfo (I4 solo enmascara TEXT).
 */
export function offerMessageData(params: { offerId: string; senderId: string; amount: number }) {
  return {
    kind: "OFFER" as const,
    offerId: params.offerId,
    senderId: params.senderId,
    body: offerBody(params.amount),
  };
}

/**
 * Devuelve la conversación (listingId, buyerId), creándola si no existe.
 * Idempotente vía el @@unique([listingId, buyerId]) (upsert): ofertar no duplica
 * la conversación si ya hay un chat abierto.
 */
export async function findOrCreateConversation(
  listingId: string,
  buyerId: string,
  sellerId: string,
  db: Db = prisma
): Promise<{ id: string }> {
  return db.conversation.upsert({
    where: { listingId_buyerId: { listingId, buyerId } },
    create: { listingId, buyerId, sellerId },
    update: {},
    select: { id: true },
  });
}
