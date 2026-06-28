import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { messageSchema } from "@/lib/validations";
import { notify } from "@/lib/notifications";
import { sendNewMessageEmail } from "@/lib/email";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/ratelimit";
import { hideContactInfo } from "@/lib/utils";
import { resolveConversationUnlocked } from "@/lib/conversation-unlock";

type Params = { params: { id: string } };

async function ensureParticipant(conversationId: string, userId: string) {
  const convo = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { buyerId: true, sellerId: true },
  });
  if (!convo) return { ok: false as const, status: 404, error: "Conversación no encontrada" };
  if (convo.buyerId !== userId && convo.sellerId !== userId) {
    return { ok: false as const, status: 403, error: "No autorizado" };
  }
  return { ok: true as const };
}

// Mensajes de una conversación (soporta ?after=ISO para polling)
export async function GET(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const check = await ensureParticipant(params.id, user.id);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

  const after = new URL(req.url).searchParams.get("after");
  const where: { conversationId: string; createdAt?: { gt: Date } } = {
    conversationId: params.id,
  };
  if (after) {
    const d = new Date(after);
    if (!isNaN(d.getTime())) where.createdAt = { gt: d };
  }

  const messages = await prisma.message.findMany({
    where,
    orderBy: { createdAt: "asc" },
    include: {
      // Para los mensajes kind=OFFER: datos para renderizar el card y sus botones.
      offer: {
        select: {
          id: true,
          amount: true,
          status: true,
          proposedById: true,
          buyerId: true,
          sellerId: true,
          expiresAt: true,
        },
      },
    },
  });

  // Marca como leídos los mensajes del otro participante
  await prisma.message.updateMany({
    where: { conversationId: params.id, senderId: { not: user.id }, readAt: null },
    data: { readAt: new Date() },
  });

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      kind: m.kind,
      body: m.body,
      senderId: m.senderId,
      createdAt: m.createdAt,
      offer: m.offer,
    })),
  });
}

// Enviar un mensaje
export async function POST(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const limited = await enforceRateLimit(req, "message", RATE_LIMITS.message, user.id);
  if (limited) return limited;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { verification: true },
  });
  if (dbUser?.verification !== "VERIFIED") {
    return NextResponse.json({ error: "Verificá tu identidad para enviar mensajes." }, { status: 403 });
  }

  const check = await ensureParticipant(params.id, user.id);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

  const parsed = messageSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Mensaje inválido" }, { status: 400 });
  }

  // ¿El destinatario ya tenía mensajes sin leer de este remitente? (para no spamear emails)
  const priorUnread = await prisma.message.count({
    where: { conversationId: params.id, senderId: user.id, readAt: null },
  });

  const msg = await prisma.message.create({
    data: { conversationId: params.id, senderId: user.id, body: parsed.data.body },
  });
  await prisma.conversation.update({
    where: { id: params.id },
    data: { updatedAt: new Date() },
  });

  // Notifica al otro participante (in-app siempre; email solo la 1ª vez que queda sin leer)
  const convo = await prisma.conversation.findUnique({
    where: { id: params.id },
    select: {
      buyerId: true,
      sellerId: true,
      listingId: true,
      listing: { select: { title: true, soldToId: true } },
    },
  });
  if (convo) {
    const recipientId = convo.buyerId === user.id ? convo.sellerId : convo.buyerId;
    // Si el trato está cerrado con este comprador (I12), el contacto va CRUDO en la
    // notif/email; si no, enmascarado (I4). El Message ya quedó CRUDO en la DB arriba.
    const unlocked = await resolveConversationUnlocked({
      listingId: convo.listingId,
      buyerId: convo.buyerId,
      soldToId: convo.listing.soldToId,
    });
    const safeBody = unlocked ? parsed.data.body : hideContactInfo(parsed.data.body);
    await notify({
      userId: recipientId,
      type: "MESSAGE",
      title: `Nuevo mensaje de ${user.name ?? "alguien"}`,
      body: safeBody.slice(0, 80),
      link: `/mensajes/${params.id}`,
    });

    if (priorUnread === 0) {
      try {
        const recipient = await prisma.user.findUnique({
          where: { id: recipientId },
          select: { email: true },
        });
        if (recipient) {
          await sendNewMessageEmail(
            recipient.email,
            user.name ?? "Alguien",
            convo.listing.title,
            safeBody,
            params.id
          );
        }
      } catch (e) {
        console.error("No se pudo enviar el email de mensaje nuevo:", e);
      }
    }
  }

  return NextResponse.json(
    { id: msg.id, kind: msg.kind, body: msg.body, senderId: msg.senderId, createdAt: msg.createdAt, offer: null },
    { status: 201 }
  );
}
