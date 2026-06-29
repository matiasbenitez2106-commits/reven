import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthedUser } from "@/lib/auth-token";
import { isConversationParticipant } from "@/lib/conversations";
import { resolveConversationUnlocked } from "@/lib/conversation-unlock";

type Params = { params: { id: string } };

// Cabecera de una conversación (otra parte + publicación + unlock del contacto).
// PRIVADO: solo un participante del hilo (comprador o vendedor) puede leerla.
export async function GET(req: Request, { params }: Params) {
  const user = await getAuthedUser(req);
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const convo = await prisma.conversation.findUnique({
    where: { id: params.id },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          price: true,
          status: true,
          soldToId: true,
          images: { orderBy: { position: "asc" }, take: 1 },
        },
      },
      buyer: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, verification: true } },
      seller: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, verification: true } },
    },
  });
  if (!convo) return NextResponse.json({ error: "Conversación no encontrada" }, { status: 404 });

  // GATE de acceso: nadie lee una conversación de la que no es parte.
  if (!isConversationParticipant(convo, user.id)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const other = convo.buyerId === user.id ? convo.seller : convo.buyer;
  const unlocked = await resolveConversationUnlocked({
    listingId: convo.listingId,
    buyerId: convo.buyerId,
    soldToId: convo.listing.soldToId,
  });

  return NextResponse.json({
    id: convo.id,
    meId: user.id,
    unlocked,
    listing: {
      id: convo.listing.id,
      title: convo.listing.title,
      price: Number(convo.listing.price),
      status: convo.listing.status,
      image: convo.listing.images[0]?.url ?? null,
    },
    other: {
      id: other.id,
      name: `${other.firstName} ${other.lastName}`,
      avatarUrl: other.avatarUrl,
      verification: other.verification,
    },
  });
}
