import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthedUser } from "@/lib/auth-token";

// Mis publicaciones (privado: sellerId = yo). Estado + datos para la lista y
// para "marcar vendido". Nunca devuelve publicaciones de otro.
export async function GET(req: Request) {
  const user = await getAuthedUser(req);
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const listings = await prisma.listing.findMany({
    where: { sellerId: user.id, status: { not: "DELETED" } },
    include: { images: { orderBy: { position: "asc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  return NextResponse.json({
    listings: listings.map((l) => ({
      id: l.id,
      title: l.title,
      price: Number(l.price),
      image: l.images[0]?.url ?? null,
      status: l.status,
      viewCount: l.viewCount,
      featured: l.featuredUntil ? new Date(l.featuredUntil) > now : false,
      createdAt: l.createdAt,
    })),
  });
}
