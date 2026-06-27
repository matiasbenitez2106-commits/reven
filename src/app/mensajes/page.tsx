import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircle, ImageOff } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { formatRelative, hideContactInfo } from "@/lib/utils";

export const metadata = { title: "Mensajes" };

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar");

  const convos = await prisma.conversation.findMany({
    where: { OR: [{ buyerId: user.id }, { sellerId: user.id }] },
    include: {
      listing: { select: { title: true, images: { orderBy: { position: "asc" }, take: 1 } } },
      buyer: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      seller: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });

  const ids = convos.map((c) => c.id);
  const unread = ids.length
    ? await prisma.message.groupBy({
        by: ["conversationId"],
        where: { conversationId: { in: ids }, senderId: { not: user.id }, readAt: null },
        _count: { _all: true },
      })
    : [];
  const unreadMap = new Map(unread.map((u) => [u.conversationId, u._count._all]));

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Mensajes</h1>

      {convos.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-12 text-center">
          <MessageCircle className="h-12 w-12 text-gray-300 dark:text-stone-600" />
          <p className="font-medium">No tenés conversaciones</p>
          <p className="text-sm text-gray-500 dark:text-stone-400">
            Cuando contactes a un vendedor (o te contacten), vas a verlo acá.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-line dark:divide-stone-800 overflow-hidden rounded-xl border border-line dark:border-stone-800 bg-surface dark:bg-stone-900">
          {convos.map((c) => {
            const other = c.buyerId === user.id ? c.seller : c.buyer;
            const last = c.messages[0];
            const unreadCount = unreadMap.get(c.id) ?? 0;
            const thumb = c.listing.images[0]?.url ?? null;
            return (
              <Link
                key={c.id}
                href={`/mensajes/${c.id}`}
                className="flex items-center gap-3 p-3 transition hover:bg-surface-hover dark:hover:bg-stone-800"
              >
                <div className="relative">
                  <Avatar firstName={other.firstName} lastName={other.lastName} src={other.avatarUrl} size={44} />
                  {thumb ? (
                    // Anillo blanco intencional: separa la miniatura del avatar (contraste sobre
                    // imagen, mismo criterio que los botones sobre foto). No migrar a token de paleta.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb}
                      alt=""
                      className="absolute -bottom-1 -right-1 h-5 w-5 rounded border border-white object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-medium">
                      {other.firstName} {other.lastName}
                    </p>
                    {last && (
                      <span className="shrink-0 text-xs text-gray-400 dark:text-stone-500">
                        {formatRelative(last.createdAt)}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-gray-500 dark:text-stone-400">{c.listing.title}</p>
                  {last && (
                    <p className="truncate text-sm text-gray-600 dark:text-stone-300">
                      {last.senderId === user.id ? "Vos: " : ""}
                      {hideContactInfo(last.body)}
                    </p>
                  )}
                </div>
                {unreadCount > 0 && <Badge color="brand">{unreadCount}</Badge>}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
