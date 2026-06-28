import { describe, it, expect, vi, beforeEach } from "vitest";

// Prisma mockeado: nunca toca la base real. Cubrimos lo que usan canReviewListing
// (listing/review) y getListingBuyers (conversation/offer).
vi.mock("@/lib/prisma", () => ({
  prisma: {
    listing: { findUnique: vi.fn() },
    review: { findUnique: vi.fn(), groupBy: vi.fn() },
    conversation: { findMany: vi.fn() },
    offer: { findFirst: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  canReviewListing,
  reviewTargetFor,
  getSellerRatings,
  getBuyerRatings,
  getListingBuyers,
  normalizeTitle,
  titlesAreSimilar,
  roundRating,
  summarizeRatings,
} from "@/lib/listings";

const db = prisma as unknown as {
  listing: { findUnique: ReturnType<typeof vi.fn> };
  review: { findUnique: ReturnType<typeof vi.fn>; groupBy: ReturnType<typeof vi.fn> };
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

describe("reviewTargetFor (puro, doble sentido)", () => {
  const listing = { sellerId: "S", status: "SOLD", soldToId: "B" };
  it("el comprador (soldTo) califica al VENDEDOR", () => {
    expect(reviewTargetFor(listing, "B")).toEqual({ targetId: "S", targetRole: "SELLER" });
  });
  it("el vendedor califica al COMPRADOR", () => {
    expect(reviewTargetFor(listing, "S")).toEqual({ targetId: "B", targetRole: "BUYER" });
  });
  it("un usuario ajeno no califica", () => {
    expect(reviewTargetFor(listing, "X")).toBe(null);
  });
  it("si no está vendida o no hay comprador, nadie califica", () => {
    expect(reviewTargetFor({ sellerId: "S", status: "ACTIVE", soldToId: null }, "B")).toBe(null);
    expect(reviewTargetFor({ sellerId: "S", status: "SOLD", soldToId: null }, "S")).toBe(null);
  });
});

describe("canReviewListing (Prisma mockeado, doble sentido)", () => {
  it("comprador → califica al vendedor (target SELLER) si no reseñó", async () => {
    db.listing.findUnique.mockResolvedValue({ sellerId: "s1", status: "SOLD", soldToId: "b1" });
    db.review.findUnique.mockResolvedValue(null);
    expect(await canReviewListing("b1", "l1")).toEqual({
      canReview: true,
      targetId: "s1",
      targetRole: "SELLER",
      alreadyReviewed: false,
    });
  });

  it("vendedor → califica al comprador (target BUYER)", async () => {
    db.listing.findUnique.mockResolvedValue({ sellerId: "s1", status: "SOLD", soldToId: "b1" });
    db.review.findUnique.mockResolvedValue(null);
    expect(await canReviewListing("s1", "l1")).toEqual({
      canReview: true,
      targetId: "b1",
      targetRole: "BUYER",
      alreadyReviewed: false,
    });
  });

  it("no permite si no está vendida (ni consulta reviews)", async () => {
    db.listing.findUnique.mockResolvedValue({ sellerId: "s1", status: "ACTIVE", soldToId: null });
    const r = await canReviewListing("b1", "l1");
    expect(r.canReview).toBe(false);
    expect(r.targetRole).toBe(null);
    expect(db.review.findUnique).not.toHaveBeenCalled();
  });

  it("un usuario ajeno no puede calificar", async () => {
    db.listing.findUnique.mockResolvedValue({ sellerId: "s1", status: "SOLD", soldToId: "b1" });
    const r = await canReviewListing("ajeno", "l1");
    expect(r.canReview).toBe(false);
    expect(r.targetRole).toBe(null);
  });

  it("no permite si ya dejó una reseña (una por listing+author)", async () => {
    db.listing.findUnique.mockResolvedValue({ sellerId: "s1", status: "SOLD", soldToId: "b1" });
    db.review.findUnique.mockResolvedValue({ id: "rev1" });
    expect(await canReviewListing("b1", "l1")).toEqual({
      canReview: false,
      targetId: "s1",
      targetRole: "SELLER",
      alreadyReviewed: true,
    });
  });

  it("targetId null si la publicación no existe", async () => {
    db.listing.findUnique.mockResolvedValue(null);
    expect(await canReviewListing("b1", "nope")).toEqual({
      canReview: false,
      targetId: null,
      targetRole: null,
      alreadyReviewed: false,
    });
  });
});

describe("getSellerRatings / getBuyerRatings (agregados filtrados por rol)", () => {
  it("getSellerRatings consulta con targetRole=SELLER (feed)", async () => {
    db.review.groupBy.mockResolvedValue([{ targetId: "s1", _avg: { rating: 5 }, _count: 2 }]);
    const map = await getSellerRatings(["s1"]);
    expect(map.get("s1")).toEqual({ rating: 5, count: 2 });
    expect(db.review.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ targetRole: "SELLER" }) })
    );
  });
  it("getBuyerRatings consulta con targetRole=BUYER (ofertas/perfil)", async () => {
    db.review.groupBy.mockResolvedValue([{ targetId: "b1", _avg: { rating: 4 }, _count: 3 }]);
    const map = await getBuyerRatings(["b1"]);
    expect(map.get("b1")).toEqual({ rating: 4, count: 3 });
    expect(db.review.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ targetRole: "BUYER" }) })
    );
  });
  it("sin ids no consulta", async () => {
    expect((await getSellerRatings([])).size).toBe(0);
    expect(db.review.groupBy).not.toHaveBeenCalled();
  });
});
