import { redirect } from "next/navigation";
import Link from "next/link";
import { Tag, Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/auth";
import { Avatar } from "@/components/ui/Avatar";
import { OFFER_STATUS_LABELS } from "@/lib/constants";
import { formatPrice, formatRelative } from "@/lib/utils";
import { proposerRole } from "@/lib/offers";
import { getBuyerRatings } from "@/lib/listings";

export const metadata = { title: "Ofertas recibidas" };
export const dynamic = "force-dynamic";

export default async function OffersInboxPage() {
  const user = await getCurrentDbUser();
  if (!user) redirect("/ingresar");

  const now = new Date();
  // Expiry perezoso: vencé las PENDING vencidas dirigidas a este vendedor.
  await prisma.offer.updateMany({
    where: { sellerId: user.id, status: "PENDING", expiresAt: { lt: now } },
    data: { status: "EXPIRED" },
  });

  // Una fila por negociación: ocultamos las COUNTERED (ancestros superados); la
  // hoja del hilo es la que muestra el estado actual.
  const offers = await prisma.offer.findMany({
    where: { sellerId: user.id, status: { not: "COUNTERED" } },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      amount: true,
      status: true,
      message: true,
      createdAt: true,
      proposedById: true,
      sellerId: true,
      buyerId: true,
      buyer: { select: { firstName: true, lastName: true, avatarUrl: true } },
      listing: { select: { id: true, title: true } },
    },
  });

  // Reputación COMO COMPRADOR de cada oferente (1 query batch, sin N+1): le sirve al
  // vendedor para decidir a quién aceptar.
  const buyerRatings = await getBuyerRatings(offers.map((o) => o.buyerId));

  // Desde I13 la oferta vive en el chat: cada fila linkea a su conversación
  // (listingId, buyerId). Traemos las conversaciones del vendedor en UNA query y
  // armamos un Map por par. (Si alguna oferta vieja no tiene chat, queda sin link.)
  const convos = await prisma.conversation.findMany({
    where: { sellerId: user.id },
    select: { id: true, listingId: true, buyerId: true },
  });
  const convoByPair = new Map(convos.map((c) => [`${c.listingId}::${c.buyerId}`, c.id]));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">Ofertas recibidas</h1>

      {offers.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 p-12 text-center text-gray-500 dark:text-stone-400">
          <Tag className="h-10 w-10 text-gray-300 dark:text-stone-600" />
          <p>Todavía no recibiste ofertas.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map((o) => {
            const proposer = proposerRole(o); // BUYER (oferta) o SELLER (tu contraoferta)
            const br = buyerRatings.get(o.buyerId); // reputación del comprador
            const conversationId = convoByPair.get(`${o.listing.id}::${o.buyerId}`);

            // Resumen clickeable: la acción (aceptar/rechazar/contraofertar) se hace
            // en el card de la oferta DENTRO del chat, no acá.
            const inner = (
              <div className="flex items-center gap-3">
                <Avatar
                  firstName={o.buyer.firstName}
                  lastName={o.buyer.lastName}
                  src={o.buyer.avatarUrl}
                  size={36}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{o.listing.title}</p>
                  <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-gray-500 dark:text-stone-400">
                    <span>
                      {o.buyer.firstName} {o.buyer.lastName}
                    </span>
                    {br && br.count > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-gray-600 dark:text-stone-300">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {(br.rating ?? 0).toLocaleString("es-AR", {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })}
                        <span className="text-gray-400 dark:text-stone-500">({br.count})</span>
                      </span>
                    )}
                    <span>· {formatRelative(o.createdAt)}</span>
                    {proposer === "SELLER" ? <span>· tu contraoferta</span> : null}
                  </p>
                  {o.message && (
                    <p className="mt-1 truncate text-xs text-gray-600 dark:text-stone-300">“{o.message}”</p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-lg font-bold">{formatPrice(o.amount)}</p>
                  <span className="rounded bg-surface-sunken dark:bg-stone-800 px-1.5 py-0.5 text-[11px] font-semibold">
                    {OFFER_STATUS_LABELS[o.status]}
                  </span>
                </div>
              </div>
            );

            // Fila = Link a la conversación. Sin elementos interactivos adentro.
            return conversationId ? (
              <Link
                key={o.id}
                href={`/mensajes/${conversationId}`}
                className="card block p-4 transition hover:border-brand-200 hover:bg-surface-hover dark:hover:border-stone-700 dark:hover:bg-stone-800"
              >
                {inner}
              </Link>
            ) : (
              <div key={o.id} className="card p-4">
                {inner}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
