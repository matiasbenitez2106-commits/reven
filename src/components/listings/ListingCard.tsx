import Link from "next/link";
import { MapPin, ImageOff, Sparkles, BadgeCheck } from "lucide-react";
import { formatPrice, formatDistance } from "@/lib/utils";
import { CONDITION_LABELS } from "@/lib/constants";
import { Avatar } from "@/components/ui/Avatar";
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
  sellerFirstName?: string;
  sellerLastName?: string | null;
  sellerAvatar?: string | null;
}

// `showFeatured` solo lo activan las vistas del DUEÑO (p.ej. "Mis publicaciones").
// Para el resto de los usuarios, una publicación destacada se ordena con prioridad
// pero NO muestra el cartel "Destacado" (no se revela que se pagó por destacarla).
export function ListingCard({
  item,
  showFeatured = false,
}: {
  item: ListingCardItem;
  showFeatured?: boolean;
}) {
  return (
    <Link
      href={`/articulos/${item.id}`}
      className="group card overflow-hidden transition hover:shadow-md"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-surface-sunken dark:bg-stone-800">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image}
            alt={item.title}
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300 dark:text-stone-600">
            <ImageOff className="h-10 w-10" />
          </div>
        )}
        {showFeatured && item.featured && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-semibold text-amber-950 shadow">
            <Sparkles className="h-3.5 w-3.5" /> Destacado
          </span>
        )}
      </div>
      <div className="p-3">
        {/* Precio: el elemento más fuerte del bloque de info */}
        <p className="text-lg font-bold text-ink dark:text-stone-100">{formatPrice(item.price)}</p>

        {/* Título */}
        <h3 className="mt-0.5 line-clamp-2 text-sm text-gray-700 dark:text-stone-200">{item.title}</h3>

        {/* Vendedor: avatar + nombre corto + verificado (toque social) */}
        {item.sellerFirstName && (
          <div className="mt-2 flex items-center gap-1.5">
            <Avatar
              firstName={item.sellerFirstName}
              lastName={item.sellerLastName ?? undefined}
              src={item.sellerAvatar}
              size={20}
            />
            <span className="min-w-0 truncate text-xs text-gray-600 dark:text-stone-300">
              {item.sellerFirstName}
              {item.sellerLastName ? ` ${item.sellerLastName.charAt(0)}.` : ""}
            </span>
            {item.sellerVerified && (
              <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-brand-600 dark:text-brand-300" />
            )}
          </div>
        )}

        {/* Meta: ubicación + distancia + condición (jerarquía más tenue) */}
        <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-500 dark:text-stone-400">
          <span className="flex min-w-0 flex-1 items-center gap-1">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {item.neighborhood ? `${item.neighborhood}, ` : ""}
              {item.city}
            </span>
            {item.distanceKm != null && (
              <span className="shrink-0 text-gray-400 dark:text-stone-500">· {formatDistance(item.distanceKm)}</span>
            )}
          </span>
          <span className="shrink-0 rounded bg-surface-sunken dark:bg-stone-800 px-1.5 py-0.5">
            {CONDITION_LABELS[item.condition]}
          </span>
        </div>
      </div>
    </Link>
  );
}
