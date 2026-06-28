import { describe, it, expect, vi, beforeEach } from "vitest";

// Prisma mockeado: nunca toca la base real. Cubrimos lo que usan canReviewListing
// (listing/review) y getListingBuyers (conversation/offer).
vi.mock("@/lib/prisma", () => ({
  prisma: {
    listing: { findUnique: vi.fn() },
    review: { findUnique: vi.fn() },
    conversation: { findMany: vi.fn() },
    offer: { findFirst: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  canReviewListing,
  getListingBuyers,
  normalizeTitle,
  titlesAreSimilar,
  roundRating,
  summarizeRatings,
} from "@/lib/listings";

const db = prisma as unknown as {
  listing: { findUnique: ReturnType<typeof vi.fn> };
  review: { findUnique: ReturnType<typeof vi.fn> };
  conversation: { findMany: ReturnType<typeof vi.fn> };
  offer: { findFirst: ReturnType<typeof vi.fn> };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getListingBuyers — comprador de oferta aceptada SIN conversación", () => {
  it("incluye al comprador de la oferta aceptada aunque no haya chateado (soldTo válido)", async () => {
    db.conversation.findMany.mockResolvedValue([]); // nadie escribió por la publi
    db.offer.findFirst.mockResolvedValue({
      buyer: { id: "buyerOferta", firstName: "Ana", lastName: "P", avatarUrl: null },
    });
    const buyers = await getListingBuyers("l1");
    expect(buyers).toEqual([
      { id: "buyerOferta", firstName: "Ana", lastName: "P", avatarUrl: null, fromAcceptedOffer: true },
    ]);
    // El servidor valida soldToId contra esta misma lista → ese comprador es válido.
    expect(buyers.some((b) => b.id === "buyerOferta")).toBe(true);
  });

  it("sin conversaciones ni oferta aceptada, no hay candidatos", async () => {
    db.conversation.findMany.mockResolvedValue([]);
    db.offer.findFirst.mockResolvedValue(null);
    expect(await getListingBuyers("l1")).toEqual([]);
  });
});

describe("roundRating", () => {
  it("redondea el promedio a 1 decimal", () => {
    expect(roundRating(4.83)).toBe(4.8);
    expect(roundRating(4.27)).toBe(4.3);
    expect(roundRating(5)).toBe(5);
  });
  it("null si no hay promedio (sin reseñas)", () => {
    expect(roundRating(null)).toBe(null);
    expect(roundRating(undefined)).toBe(null);
  });
});

describe("summarizeRatings (agregado por vendedor, sin N+1)", () => {
  it("indexa por targetId con promedio redondeado y conteo", () => {
    const map = summarizeRatings([
      { targetId: "s1", _avg: { rating: 4.833 }, _count: 12 },
      { targetId: "s2", _avg: { rating: 3 }, _count: 1 },
    ]);
    expect(map.get("s1")).toEqual({ rating: 4.8, count: 12 });
    expect(map.get("s2")).toEqual({ rating: 3, count: 1 });
    expect(map.get("s3")).toBeUndefined();
  });
});

describe("normalizeTitle (puro, sin DB)", () => {
  it("baja a minúsculas, saca acentos y une número+unidad", () => {
    expect(normalizeTitle("iPhone 13 Pro")).toBe("iphone 13 pro");
    expect(normalizeTitle("Sillón  64 GB")).toBe("sillon 64gb");
    expect(normalizeTitle("Heladera  Whirlpool!!")).toBe("heladera whirlpool");
  });
});

describe("titlesAreSimilar (puro, sin DB)", () => {
  it("detecta el mismo producto pese al texto de relleno", () => {
    expect(titlesAreSimilar("iPhone 13 Pro", "vendo iphone 13 pro urgente")).toBe(true);
  });
  it("distingue productos realmente distintos", () => {
    expect(titlesAreSimilar("Heladera Whirlpool", "Bicicleta rodado 29")).toBe(false);
  });
});

describe("canReviewListing (Prisma mockeado)", () => {
  it("permite si está SOLD, soy el comprador y no reseñé", async () => {
    db.listing.findUnique.mockResolvedValue({ sellerId: "s1", status: "SOLD", soldToId: "b1" });
    db.review.findUnique.mockResolvedValue(null);
    expect(await canReviewListing("b1", "l1")).toEqual({
      canReview: true,
      sellerId: "s1",
      alreadyReviewed: false,
    });
  });

  it("no permite si la publicación no está vendida (ni consulta reviews)", async () => {
    db.listing.findUnique.mockResolvedValue({ sellerId: "s1", status: "ACTIVE", soldToId: null });
    const r = await canReviewListing("b1", "l1");
    expect(r.canReview).toBe(false);
    expect(r.sellerId).toBe("s1");
    expect(db.review.findUnique).not.toHaveBeenCalled();
  });

  it("no permite si no soy el comprador registrado", async () => {
    db.listing.findUnique.mockResolvedValue({ sellerId: "s1", status: "SOLD", soldToId: "otro" });
    expect((await canReviewListing("b1", "l1")).canReview).toBe(false);
  });

  it("no permite si ya dejé una reseña", async () => {
    db.listing.findUnique.mockResolvedValue({ sellerId: "s1", status: "SOLD", soldToId: "b1" });
    db.review.findUnique.mockResolvedValue({ id: "rev1" });
    expect(await canReviewListing("b1", "l1")).toEqual({
      canReview: false,
      sellerId: "s1",
      alreadyReviewed: true,
    });
  });

  it("devuelve sellerId null si la publicación no existe", async () => {
    db.listing.findUnique.mockResolvedValue(null);
    expect(await canReviewListing("b1", "nope")).toEqual({
      canReview: false,
      sellerId: null,
      alreadyReviewed: false,
    });
  });
});
