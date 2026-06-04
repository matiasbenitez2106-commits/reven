import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Registra una visita a la publicación (no cuenta las del propio dueño)
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    select: { sellerId: true, status: true },
  });
  if (!listing || listing.status === "DELETED") {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  if (user?.id === listing.sellerId) {
    return NextResponse.json({ ok: true, counted: false });
  }
  await prisma.listing.update({
    where: { id: params.id },
    data: { viewCount: { increment: 1 } },
  });
  return NextResponse.json({ ok: true, counted: true });
}
