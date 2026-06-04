import Link from "next/link";
import { MapPin, BadgeCheck, ImageOff, Sparkles } from "lucide-react";
import { formatPrice, formatDistance } from "@/lib/utils";
import { CONDITION_LABELS } from "@/lib/constants";
import { Condition, SubscriptionPlan } from "@prisma/client";

export interface ListingCardItem {
  id: string;
  title: string;
  price: number;
  image: string | null;
  city: string;
  neighborhood?: string | null;
  condition: Condition;
  distanceKm?: number | null;
  sellerVerified?: boolean;
  featured?: boolean;
  sellerPro?: SubscriptionPlan | null;
}

export function ListingCard({ item }: { item: ListingCardItem }) {
  return (
    <Link
      href={`/articulos/${item.id}`}
      className="group card overflow-hidden transition hover:shadow-md"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image}
            alt={item.title}
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            <ImageOff className="h-10 w-10" />
          </div>
        )}
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {item.sellerVerified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-brand-700 shadow">
              <BadgeCheck className="h-3.5 w-3.5" /> Verificado
            </span>
          )}
          {item.sellerPro && (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2 py-0.5 text-[11px] font-semibold text-white shadow">
              {item.sellerPro === "PRO_PLUS" ? "PRO+" : "PRO"}
            </span>
          )}
        </div>
        {item.featured && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-semibold text-amber-950 shadow">
            <Sparkles className="h-3.5 w-3.5" /> Destacado
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="text-lg font-bold text-gray-900">{formatPrice(item.price)}</p>
        <h3 className="mt-0.5 line-clamp-2 text-sm text-gray-700">{item.title}</h3>
        <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {item.neighborhood ? `${item.neighborhood}, ` : ""}
            {item.city}
          </span>
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-gray-400">
          <span className="rounded bg-gray-100 px-1.5 py-0.5">{CONDITION_LABELS[item.condition]}</span>
          {item.distanceKm != null && <span>{formatDistance(item.distanceKm)}</span>}
        </div>
      </div>
    </Link>
  );
}
