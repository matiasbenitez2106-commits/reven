import { redirect } from "next/navigation";
import Link from "next/link";
import { Tag } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/auth";
import { Avatar } from "@/components/ui/Avatar";
import { OfferActionButtons } from "@/components/offers/OfferActionButtons";
import { OFFER_STATUS_LABELS } from "@/lib/constants";
import { formatPrice, formatRelative } from "@/lib/utils";
import { proposerRole } from "@/lib/offers";

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
            const sellerIsRecipient = o.status === "PENDING" && proposer === "BUYER";
            const sellerIsProposer = o.status === "PENDING" && proposer === "SELLER";
            return (
              <div key={o.id} className="card p-4">
                <div className="flex items-center gap-3">
                  <Avatar
                    firstName={o.buyer.firstName}
                    lastName={o.buyer.lastName}
                    src={o.buyer.avatarUrl}
                    size={36}
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/articulos/${o.listing.id}`}
                      className="block truncate text-sm font-medium hover:text-brand-600 dark:hover:text-brand-300"
                    >
                      {o.listing.title}
                    </Link>
                    <p className="text-xs text-gray-500 dark:text-stone-400">
                      {o.buyer.firstName} {o.buyer.lastName} · {formatRelative(o.createdAt)}
                      {proposer === "SELLER" ? " · tu contraoferta" : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-bold">{formatPrice(o.amount)}</p>
                    <span className="rounded bg-surface-sunken dark:bg-stone-800 px-1.5 py-0.5 text-[11px] font-semibold">
                      {OFFER_STATUS_LABELS[o.status]}
                    </span>
                  </div>
                </div>
                {o.message && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-stone-300">“{o.message}”</p>
                )}
                {(sellerIsRecipient || sellerIsProposer) && (
                  <div className="mt-3">
                    <OfferActionButtons
                      offerId={o.id}
                      canAccept={sellerIsRecipient}
                      canReject={sellerIsRecipient}
                      canCounter={sellerIsRecipient}
                      canCancel={sellerIsProposer}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
