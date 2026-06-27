import { describe, it, expect } from "vitest";
import {
  computeExpiry,
  isOfferExpired,
  proposerRole,
  actorRole,
  canActOnOffer,
  validateNewOffer,
  hasLivePendingOffer,
  siblingsToReject,
  canReleaseReservation,
  isListingOpenForOffers,
  OFFER_TTL_HOURS,
} from "@/lib/offers";

describe("validateNewOffer (no ofertar en la propia)", () => {
  it("rechaza si comprador === vendedor", () => {
    expect(validateNewOffer("u1", "u1").ok).toBe(false);
  });
  it("permite si son distintos", () => {
    expect(validateNewOffer("buyer", "seller").ok).toBe(true);
  });
});

describe("hasLivePendingOffer (una activa por comprador)", () => {
  it("true si hay una PENDING", () => {
    expect(hasLivePendingOffer([{ status: "COUNTERED" }, { status: "PENDING" }])).toBe(true);
  });
  it("false si no hay ninguna PENDING (terminales o superadas)", () => {
    expect(
      hasLivePendingOffer([{ status: "COUNTERED" }, { status: "REJECTED" }, { status: "CANCELLED" }])
    ).toBe(false);
    expect(hasLivePendingOffer([])).toBe(false);
  });
});

describe("computeExpiry / isOfferExpired (48 hs)", () => {
  const base = new Date("2026-01-01T00:00:00.000Z");
  it("vence exactamente 48 hs después", () => {
    expect(OFFER_TTL_HOURS).toBe(48);
    expect(computeExpiry(base).getTime() - base.getTime()).toBe(48 * 3600 * 1000);
  });
  it("una PENDING pasada está vencida; una futura no", () => {
    const exp = computeExpiry(base); // +48 h
    const after = new Date(base.getTime() + 49 * 3600 * 1000);
    const before = new Date(base.getTime() + 1 * 3600 * 1000);
    expect(isOfferExpired("PENDING", exp, after)).toBe(true);
    expect(isOfferExpired("PENDING", exp, before)).toBe(false);
  });
  it("solo una PENDING puede vencer (no ACCEPTED/COUNTERED)", () => {
    const exp = computeExpiry(base);
    const after = new Date(base.getTime() + 49 * 3600 * 1000);
    expect(isOfferExpired("ACCEPTED", exp, after)).toBe(false);
    expect(isOfferExpired("COUNTERED", exp, after)).toBe(false);
  });
});

describe("máquina de transiciones (canActOnOffer)", () => {
  // Oferta del comprador esperando al vendedor (proposer = BUYER).
  const buyerOffer = { status: "PENDING" as const, proposer: "BUYER" as const };
  it("el vendedor puede aceptar/rechazar/contraofertar la oferta del comprador", () => {
    for (const action of ["accept", "reject", "counter"] as const) {
      expect(canActOnOffer({ ...buyerOffer, actor: "SELLER", action })).toBe(true);
    }
  });
  it("el comprador solo puede cancelar la suya", () => {
    expect(canActOnOffer({ ...buyerOffer, actor: "BUYER", action: "cancel" })).toBe(true);
    for (const action of ["accept", "reject", "counter"] as const) {
      expect(canActOnOffer({ ...buyerOffer, actor: "BUYER", action })).toBe(false);
    }
  });
  it("el vendedor no puede cancelar la oferta del comprador", () => {
    expect(canActOnOffer({ ...buyerOffer, actor: "SELLER", action: "cancel" })).toBe(false);
  });

  // Contraoferta del vendedor esperando al comprador (proposer = SELLER).
  const counter = { status: "PENDING" as const, proposer: "SELLER" as const };
  it("ante una contraoferta: el comprador acepta/rechaza/contra; el vendedor solo cancela la suya", () => {
    for (const action of ["accept", "reject", "counter"] as const) {
      expect(canActOnOffer({ ...counter, actor: "BUYER", action })).toBe(true);
    }
    expect(canActOnOffer({ ...counter, actor: "SELLER", action: "cancel" })).toBe(true);
    expect(canActOnOffer({ ...counter, actor: "BUYER", action: "cancel" })).toBe(false);
  });

  it("no se puede actuar sobre una oferta que no está PENDING", () => {
    for (const status of ["ACCEPTED", "REJECTED", "COUNTERED", "EXPIRED", "CANCELLED"] as const) {
      expect(canActOnOffer({ status, proposer: "BUYER", actor: "SELLER", action: "accept" })).toBe(false);
    }
  });
});

describe("proposerRole / actorRole", () => {
  const offer = { buyerId: "b", sellerId: "s", proposedById: "b" };
  it("proposerRole sale de proposedById", () => {
    expect(proposerRole({ proposedById: "b", sellerId: "s" })).toBe("BUYER");
    expect(proposerRole({ proposedById: "s", sellerId: "s" })).toBe("SELLER");
  });
  it("actorRole identifica la parte o null", () => {
    expect(actorRole(offer, "s")).toBe("SELLER");
    expect(actorRole(offer, "b")).toBe("BUYER");
    expect(actorRole(offer, "x")).toBe(null);
  });
});

describe("siblingsToReject (rechazo de hermanas al aceptar)", () => {
  const offers = [
    { id: "o1", buyerId: "ganador", status: "PENDING" as const }, // la aceptada
    { id: "o2", buyerId: "otro1", status: "PENDING" as const },
    { id: "o3", buyerId: "otro2", status: "COUNTERED" as const },
    { id: "o4", buyerId: "otro3", status: "REJECTED" as const }, // ya terminal
    { id: "o5", buyerId: "ganador", status: "COUNTERED" as const }, // del ganador, no se toca
  ];
  it("incluye activas de OTROS compradores; excluye al ganador y a las terminales", () => {
    const ids = siblingsToReject(offers, "ganador")
      .map((o) => o.id)
      .sort();
    expect(ids).toEqual(["o2", "o3"]);
  });
});

describe("canReleaseReservation", () => {
  it("solo se libera desde RESERVED", () => {
    expect(canReleaseReservation("RESERVED")).toBe(true);
    expect(canReleaseReservation("ACTIVE")).toBe(false);
    expect(canReleaseReservation("SOLD")).toBe(false);
  });
});

describe("isListingOpenForOffers (no resucitar al aceptar)", () => {
  it("solo una publicación ACTIVE admite reservar/aceptar", () => {
    expect(isListingOpenForOffers("ACTIVE")).toBe(true);
    for (const s of ["RESERVED", "SOLD", "PAUSED", "DELETED"]) {
      expect(isListingOpenForOffers(s)).toBe(false);
    }
  });
});
