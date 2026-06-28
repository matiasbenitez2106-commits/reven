import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { conversation: { upsert: vi.fn() } },
}));

import { prisma } from "@/lib/prisma";
import { findOrCreateConversation, offerMessageData } from "@/lib/conversations";

const db = prisma as unknown as { conversation: { upsert: ReturnType<typeof vi.fn> } };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("offerMessageData (puro)", () => {
  it("arma un Message OFFER linkeado al offer, con body formateado", () => {
    expect(offerMessageData({ offerId: "o1", senderId: "b1", amount: 45000 })).toEqual({
      kind: "OFFER",
      offerId: "o1",
      senderId: "b1",
      body: "Oferta: $45.000",
    });
  });
  it("una contraoferta usa el mismo shape (otro offerId/sender)", () => {
    const m = offerMessageData({ offerId: "o2", senderId: "s1", amount: 30000 });
    expect(m.kind).toBe("OFFER");
    expect(m.offerId).toBe("o2");
    expect(m.senderId).toBe("s1");
  });
});

describe("findOrCreateConversation (idempotente)", () => {
  it("usa upsert por (listingId, buyerId) → no duplica si ya existe", async () => {
    db.conversation.upsert.mockResolvedValue({ id: "c1" });
    const r = await findOrCreateConversation("L", "B", "S");
    expect(r).toEqual({ id: "c1" });
    expect(db.conversation.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { listingId_buyerId: { listingId: "L", buyerId: "B" } },
        create: { listingId: "L", buyerId: "B", sellerId: "S" },
        update: {},
      })
    );
  });
});
