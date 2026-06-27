import { OfferStatus } from "@prisma/client";
import { OFFER_STATUS_LABELS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import { OfferActionButtons } from "@/components/offers/OfferActionButtons";

export interface BuyerOffer {
  id: string;
  amount: number;
  status: OfferStatus;
  proposedById: string;
  sellerId: string;
  buyerId: string;
}

// Bloque que ve el COMPRADOR en el detalle con el estado de su oferta. Si el
// vendedor le contraofertó, puede aceptar/rechazar/contra; si su oferta sigue
// pendiente, puede cancelarla.
export function BuyerOfferStatus({ offer }: { offer: BuyerOffer }) {
  const isSellerCounter = offer.status === "PENDING" && offer.proposedById === offer.sellerId;
  const isMyPending = offer.status === "PENDING" && offer.proposedById === offer.buyerId;

  return (
    <div className="rounded-lg border border-line dark:border-stone-700 bg-surface dark:bg-stone-900 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-gray-500 dark:text-stone-400">Tu oferta</span>
        <span className="rounded bg-surface-sunken dark:bg-stone-800 px-1.5 py-0.5 text-[11px] font-semibold">
          {OFFER_STATUS_LABELS[offer.status]}
        </span>
      </div>
      <p className="mt-1 text-lg font-bold">{formatPrice(offer.amount)}</p>

      {isSellerCounter && (
        <p className="mt-1 text-sm text-gray-600 dark:text-stone-300">
          El vendedor te contraofertó. Podés aceptar, rechazar o volver a ofertar.
        </p>
      )}
      {offer.status === "ACCEPTED" && (
        <p className="mt-1 text-sm text-green-700 dark:text-green-400">
          ¡Aceptada! La publicación quedó reservada para vos. Coordiná con el vendedor.
        </p>
      )}

      {(isSellerCounter || isMyPending) && (
        <div className="mt-2">
          <OfferActionButtons
            offerId={offer.id}
            canAccept={isSellerCounter}
            canReject={isSellerCounter}
            canCounter={isSellerCounter}
            canCancel={isMyPending}
          />
        </div>
      )}
    </div>
  );
}
