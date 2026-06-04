import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// IDs de las publicaciones que el usuario guardó (para estado en cliente)
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ids: [] });
  const favs = await prisma.favorite.findMany({
    where: { userId: user.id },
    select: { listingId: true },
  });
  return NextResponse.json({ ids: favs.map((f) => f.listingId) });
}

// Toggle de favorito
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const listingId: string | undefined = body?.listingId;
  if (!listingId) return NextResponse.json({ error: "Falta listingId" }, { status: 400 });

  const existing = await prisma.favorite.findUnique({
    where: { userId_listingId: { userId: user.id, listingId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return NextResponse.json({ favorited: false });
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, status: true },
  });
  if (!listing || listing.status === "DELETED") {
    return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
  }

  await prisma.favorite.create({ data: { userId: user.id, listingId } });
  return NextResponse.json({ favorited: true });
}
