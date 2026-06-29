import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthedUser } from "@/lib/auth-token";
import { getListingBuyers } from "@/lib/listings";

type Params = { params: { id: string } };

// Candidatos a comprador para "marcar vendido" (quien escribió por la publi O tiene
// una oferta aceptada). PRIVADO y SOLO el dueño de la publicación — nadie ve los
// compradores de una publicación ajena.
export async function GET(req: Request, { params }: Params) {
  const user = await getAuthedUser(req);
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    select: { sellerId: true, status: true },
  });
  if (!listing || listing.status === "DELETED") {
    return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
  }
  // GATE: solo el dueño.
  if (listing.sellerId !== user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const buyers = await getListingBuyers(params.id);
  return NextResponse.json({ buyers });
}
