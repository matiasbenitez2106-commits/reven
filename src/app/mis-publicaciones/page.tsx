import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Package, ImageOff, ShieldAlert, Eye, Sparkles, Tag } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/auth";
import { activePlan } from "@/lib/subscriptions";
import { formatPrice, formatRelative } from "@/lib/utils";
import { STATUS_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/Badge";
import { ListingOwnerActions } from "@/components/listings/ListingOwnerActions";

export const metadata = { title: "Mis publicaciones" };

export default async function MyListingsPage() {
  const user = await getCurrentDbUser();
  if (!user) redirect("/ingresar");

  const listings = await prisma.listing.findMany({
    where: { sellerId: user.id, status: { not: "DELETED" } },
    include: { images: { orderBy: { position: "asc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  const plan = activePlan(user.proPlan, user.proUntil);
  const now = new Date();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mis publicaciones</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/ofertas"
            className="inline-flex items-center gap-1 rounded-lg border border-line dark:border-stone-700 bg-surface dark:bg-stone-900 px-3 py-2 text-sm font-medium hover:bg-surface-hover dark:hover:bg-stone-800"
          >
            <Tag className="h-4 w-4" /> Ofertas
          </Link>
          <Link
            href="/publicar"
            className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" /> Publicar
          </Link>
        </div>
      </div>

      {user.verification !== "VERIFIED" && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/40 p-3 text-sm text-yellow-800 dark:text-yellow-300">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>
            Verificá tu identidad para poder publicar.{" "}
            <Link href="/verificacion" className="font-medium underline">Verificar</Link>
          </span>
        </div>
      )}

      {listings.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-12 text-center">
          <Package className="h-12 w-12 text-gray-300 dark:text-stone-600" />
          <p className="font-medium">Todavía no publicaste nada</p>
          <p className="text-sm text-gray-500 dark:text-stone-400">Cuando publiques, vas a verlo acá.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((l) => (
            <div key={l.id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <Link href={`/articulos/${l.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-sunken dark:bg-stone-800">
                  {l.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.images[0].url} alt={l.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-300 dark:text-stone-600">
                      <ImageOff className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">{l.title}</p>
                  <p className="text-lg font-bold">{formatPrice(Number(l.price))}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-400 dark:text-stone-500">
                    <Badge color={l.status === "ACTIVE" ? "green" : l.status === "SOLD" ? "gray" : "yellow"}>
                      {STATUS_LABELS[l.status]}
                    </Badge>
                    {l.featuredUntil && l.featuredUntil > now && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-semibold text-amber-950">
                        <Sparkles className="h-3 w-3" /> Destacado
                      </span>
                    )}
                    <span>· {formatRelative(l.createdAt)}</span>
                    {plan === "PRO_PLUS" && (
                      <span className="inline-flex items-center gap-1">
                        · <Eye className="h-3.5 w-3.5" /> {l.viewCount}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
              <ListingOwnerActions listingId={l.id} status={l.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
