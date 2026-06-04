import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Cantidad de mensajes no leídos del usuario (para el badge del navbar)
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ count: 0 });

  const count = await prisma.message.count({
    where: {
      senderId: { not: user.id },
      readAt: null,
      conversation: { OR: [{ buyerId: user.id }, { sellerId: user.id }] },
    },
  });

  return NextResponse.json({ count });
}
