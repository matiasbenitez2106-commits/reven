import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ImageOff } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ChatThread } from "@/components/chat/ChatThread";
import { Avatar } from "@/components/ui/Avatar";
import { VerificationBadge } from "@/components/VerificationBadge";
import { formatPrice } from "@/lib/utils";
import { resolveConversationUnlocked } from "@/lib/conversation-unlock";

export const metadata = { title: "Conversación" };

export default async function ConversationPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar");

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
      messages: { orderBy: { createdAt: "asc" }, take: 200 },
    },
  });

  if (!convo) notFound();
  if (convo.buyerId !== user.id && convo.sellerId !== user.id) redirect("/mensajes");

  const other = convo.buyerId === user.id ? convo.seller : convo.buyer;
  const thumb = convo.listing.images[0]?.url ?? null;

  // Marca como leídos los mensajes entrantes al abrir
  await prisma.message.updateMany({
    where: { conversationId: convo.id, senderId: { not: user.id }, readAt: null },
    data: { readAt: new Date() },
  });

  const initialMessages = convo.messages.map((m) => ({
    id: m.id,
    body: m.body,
    senderId: m.senderId,
    createdAt: m.createdAt.toISOString(),
  }));

  // ¿Trato cerrado con este comprador? Si sí, el contacto se destraba (I12).
  const unlocked = await resolveConversationUnlocked({
    listingId: convo.listingId,
    buyerId: convo.buyerId,
    soldToId: convo.listing.soldToId,
  });

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-3xl flex-col px-4 py-4">
      {/* Encabezado */}
      <div className="mb-3 flex items-center gap-3 border-b border-line dark:border-stone-800 pb-3">
        <Link href="/mensajes" className="rounded-lg p-1.5 text-gray-500 dark:text-stone-400 hover:bg-surface-hover dark:hover:bg-stone-800">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Avatar firstName={other.firstName} lastName={other.lastName} src={other.avatarUrl} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">
            {other.firstName} {other.lastName}
          </p>
          <VerificationBadge status={other.verification} />
        </div>
        <Link
          href={`/articulos/${convo.listing.id}`}
          className="flex items-center gap-2 rounded-lg border border-line dark:border-stone-800 p-1.5 hover:bg-surface-hover dark:hover:bg-stone-800"
        >
          <div className="h-9 w-9 overflow-hidden rounded bg-surface-sunken dark:bg-stone-800">
            {thumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumb} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-300 dark:text-stone-600">
                <ImageOff className="h-4 w-4" />
              </div>
            )}
          </div>
          <div className="hidden sm:block">
            <p className="max-w-[140px] truncate text-xs font-medium">{convo.listing.title}</p>
            <p className="text-xs text-gray-500 dark:text-stone-400">{formatPrice(Number(convo.listing.price))}</p>
          </div>
        </Link>
      </div>

      <ChatThread
        conversationId={convo.id}
        meId={user.id}
        initialMessages={initialMessages}
        unlocked={unlocked}
        disabled={convo.listing.status === "DELETED"}
        className="min-h-0 flex-1"
      />
    </div>
  );
}
