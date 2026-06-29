import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { activePlan } from "@/lib/subscriptions";
import { roundRating } from "@/lib/listings";

type Params = { params: { id: string } };

// Perfil público de un usuario (público): reputación como vendedor y comprador,
// miembro desde, ventas concretadas y sus publicaciones activas. Espeja /usuarios/[id].
export async function GET(_req: Request, { params }: Params) {
  const u = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      verification: true,
      city: true,
      province: true,
      createdAt: true,
      proPlan: true,
      proUntil: true,
    },
  });
  if (!u) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  const [sellerStats, buyerStats, soldCount, listings] = await Promise.all([
    prisma.review.aggregate({
      where: { targetId: u.id, targetRole: "SELLER" },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.review.aggregate({
      where: { targetId: u.id, targetRole: "BUYER" },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.listing.count({ where: { sellerId: u.id, status: "SOLD" } }),
    prisma.listing.findMany({
      where: { sellerId: u.id, status: "ACTIVE" },
      include: { images: { orderBy: { position: "asc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
      take: 24,
    }),
  ]);

  const now = new Date();
  return NextResponse.json({
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    avatarUrl: u.avatarUrl,
    verification: u.verification,
    city: u.city,
    province: u.province,
    memberSince: u.createdAt,
    plan: activePlan(u.proPlan, u.proUntil),
    sellerRating: roundRating(sellerStats._avg.rating),
    sellerReviewCount: sellerStats._count,
    buyerRating: roundRating(buyerStats._avg.rating),
    buyerReviewCount: buyerStats._count,
    soldCount,
    listings: listings.map((l) => ({
      id: l.id,
      title: l.title,
      price: Number(l.price),
      image: l.images[0]?.url ?? null,
      city: l.city,
      neighborhood: l.neighborhood,
      condition: l.condition,
      sellerVerified: u.verification === "VERIFIED",
      featured: l.featuredUntil ? new Date(l.featuredUntil) > now : false,
    })),
  });
}
