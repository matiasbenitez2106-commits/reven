import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { offer: { findFirst: vi.fn(), findMany: vi.fn() } },
}));

import { prisma } from "@/lib/prisma";
import {
  isConversationUnlocked,
  resolveConversationUnlocked,
  resolveUnlockedConversations,
} from "@/lib/conversation-unlock";

const db = prisma as unknown as {
  offer: { findFirst: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn> };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("isConversationUnlocked (puro)", () => {
  it("desbloquea si la publicación se vendió a ESTE comprador", () => {
    expect(isConversationUnlocked({ soldToId: "B", buyerId: "B", hasAcceptedOffer: false })).toBe(true);
  });
  it("desbloquea si hay oferta aceptada", () => {
    expect(isConversationUnlocked({ soldToId: null, buyerId: "B", hasAcceptedOffer: true })).toBe(true);
  });
  it("bloqueada si no hay soldTo ni oferta aceptada", () => {
    expect(isConversationUnlocked({ soldToId: null, buyerId: "B", hasAcceptedOffer: false })).toBe(false);
  });
  it("bloqueada si se vendió a OTRO comprador (no es esta conversación)", () => {
    expect(isConversationUnlocked({ soldToId: "OTRO", buyerId: "B", hasAcceptedOffer: false })).toBe(false);
  });
});

describe("resolveConversationUnlocked (fetch)", () => {
  it("corto-circuito: soldTo a este comprador → unlocked SIN consultar ofertas", async () => {
    const r = await resolveConversationUnlocked({ listingId: "L", buyerId: "B", soldToId: "B" });
    expect(r).toBe(true);
    expect(db.offer.findFirst).not.toHaveBeenCalled();
  });
  it("oferta aceptada de este comprador → unlocked", async () => {
    db.offer.findFirst.mockResolvedValue({ id: "o1" });
    expect(await resolveConversationUnlocked({ listingId: "L", buyerId: "B", soldToId: null })).toBe(true);
  });
  it("oferta/sold de OTRO comprador NO destraba: el findFirst filtra por buyerId", async () => {
    db.offer.findFirst.mockResolvedValue(null); // no hay oferta aceptada PARA B
    const r = await resolveConversationUnlocked({ listingId: "L", buyerId: "B", soldToId: "OTRO" });
    expect(r).toBe(false);
    expect(db.offer.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ buyerId: "B", status: "ACCEPTED" }),
      })
    );
  });
});

describe("resolveUnlockedConversations (batch, sin N+1)", () => {
  it("destraba por soldTo y por oferta aceptada; deja locked a la de otro comprador, en 1 query", async () => {
    // Solo hay una oferta aceptada: (L2, B2).
    db.offer.findMany.mockResolvedValue([{ listingId: "L2", buyerId: "B2" }]);
    const set = await resolveUnlockedConversations([
      { id: "c1", listingId: "L1", buyerId: "B1", soldToId: "B1" }, // soldTo a su comprador
      { id: "c2", listingId: "L2", buyerId: "B2", soldToId: null }, // oferta aceptada
      { id: "c3", listingId: "L3", buyerId: "B3", soldToId: "OTRO" }, // vendida a otro, sin oferta
    ]);
    expect(set.has("c1")).toBe(true);
    expect(set.has("c2")).toBe(true);
    expect(set.has("c3")).toBe(false);
    expect(db.offer.findMany).toHaveBeenCalledTimes(1);
  });
});
