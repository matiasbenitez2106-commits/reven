import type { OfferStatus } from "@prisma/client";

// ──────────────────────────────────────────────
// Lógica PURA de ofertas (sin DB) — testeable de forma aislada.
// ──────────────────────────────────────────────

export const OFFER_TTL_HOURS = 48;
const OFFER_TTL_MS = OFFER_TTL_HOURS * 60 * 60 * 1000;

export type Party = "BUYER" | "SELLER";
export type OfferAction = "accept" | "reject" | "counter" | "cancel";

/** Vencimiento de una oferta: 48 hs desde su creación (D1). */
export function computeExpiry(createdAt: Date): Date {
  return new Date(createdAt.getTime() + OFFER_TTL_MS);
}

/**
 * ¿Una oferta PENDING ya venció? Solo una PENDING puede vencer; las demás ya
 * están en un estado terminal o superadas.
 */
export function isOfferExpired(status: OfferStatus, expiresAt: Date, now: Date): boolean {
  return status === "PENDING" && now.getTime() >= expiresAt.getTime();
}

/** Rol de quien propuso la oferta, derivado de proposedById (explícito, no inferido). */
export function proposerRole(offer: { proposedById: string; sellerId: string }): Party {
  return offer.proposedById === offer.sellerId ? "SELLER" : "BUYER";
}

/** Rol del usuario respecto de la oferta, o null si no es ninguna de las partes. */
export function actorRole(offer: { buyerId: string; sellerId: string }, userId: string): Party | null {
  if (userId === offer.sellerId) return "SELLER";
  if (userId === offer.buyerId) return "BUYER";
  return null;
}

/**
 * ¿Puede `actor` ejecutar `action` sobre la oferta?
 * - Solo se actúa sobre la oferta PENDING (la vigente del hilo).
 * - Quien la PROPUSO solo puede cancelarla (retirarla).
 * - Quien la RECIBIÓ puede aceptar / rechazar / contraofertar.
 * Así: el vendedor responde la oferta del comprador (accept/reject/counter) y el
 * comprador puede cancelar la suya o, ante una contraoferta, aceptar/rechazar/contra.
 */
export function canActOnOffer(params: {
  status: OfferStatus;
  proposer: Party;
  actor: Party;
  action: OfferAction;
}): boolean {
  if (params.status !== "PENDING") return false;
  const isProposer = params.actor === params.proposer;
  switch (params.action) {
    case "cancel":
      return isProposer;
    case "accept":
    case "reject":
    case "counter":
      return !isProposer;
    default:
      return false;
  }
}

/** D2/regla: no se puede ofertar en la propia publicación. */
export function validateNewOffer(buyerId: string, sellerId: string): { ok: boolean; error?: string } {
  if (buyerId === sellerId) {
    return { ok: false, error: "No podés ofertar en tu propia publicación." };
  }
  return { ok: true };
}

/**
 * ¿El comprador ya tiene una oferta viva en esta publicación? La vigente de todo
 * hilo es la hoja PENDING; las COUNTERED son ancestros superados. Por eso "viva"
 * ⟺ existe una PENDING (D2: una sola activa por comprador y publicación).
 */
export function hasLivePendingOffer(offers: { status: OfferStatus }[]): boolean {
  return offers.some((o) => o.status === "PENDING");
}

/**
 * Al ACEPTAR: hermanas a rechazar = ofertas de OTROS compradores en la misma
 * publicación que sigan activas (PENDING o COUNTERED).
 */
export function siblingsToReject<T extends { buyerId: string; status: OfferStatus }>(
  offers: T[],
  acceptedBuyerId: string
): T[] {
  return offers.filter(
    (o) => o.buyerId !== acceptedBuyerId && (o.status === "PENDING" || o.status === "COUNTERED")
  );
}

/** El vendedor puede liberar la reserva solo si la publicación está RESERVED. */
export function canReleaseReservation(listingStatus: string): boolean {
  return listingStatus === "RESERVED";
}

/**
 * Una publicación admite ofertas nuevas y puede reservarse SOLO si está ACTIVE.
 * Se revalida al aceptar: una oferta colgada en una publi ya vendida/borrada NO
 * debe "resucitarla" a RESERVED.
 */
export function isListingOpenForOffers(listingStatus: string): boolean {
  return listingStatus === "ACTIVE";
}
