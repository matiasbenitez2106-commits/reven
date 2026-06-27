import { describe, it, expect, vi, beforeEach } from "vitest";

// Prisma mockeado: nunca toca la base real. Solo necesitamos los findUnique que
// usa canReviewListing (listing y review).
vi.mock("@/lib/prisma", () => ({
  prisma: {
    listing: { findUnique: vi.fn() },
    review: { findUnique: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { canReviewListing, normalizeTitle, titlesAreSimilar } from "@/lib/listings";

const db = prisma as unknown as {
  listing: { findUnique: ReturnType<typeof vi.fn> };
  review: { findUnique: ReturnType<typeof vi.fn> };
};

beforeEach(() => {
  vi.clearAllMocks();
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
