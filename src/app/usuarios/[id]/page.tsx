import { notFound } from "next/navigation";
import { Package, Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Avatar } from "@/components/ui/Avatar";
import { Stars } from "@/components/ui/Stars";
import { VerificationBadge } from "@/components/VerificationBadge";
import { ProBadge } from "@/components/ProBadge";
import { TrustMeta } from "@/components/TrustMeta";
import { ListingCard } from "@/components/listings/ListingCard";
import { activePlan } from "@/lib/subscriptions";
import { formatRelative } from "@/lib/utils";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const u = await prisma.user.findUnique({
    where: { id: params.id },
    select: { firstName: true, lastName: true },
  });
  return { title: u ? `${u.firstName} ${u.lastName}` : "Usuario" };
}

export default async function PublicProfilePage({ params }: { params: { id: string } }) {
  const u = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      verification: true,
      city: true,
      province: true,
      createdAt: true,
      proPlan: true,
      proUntil: true,
    },
  });
  if (!u) notFound();

  const plan = activePlan(u.proPlan, u.proUntil);

  // Reputación recibida, SEPARADA por rol: como vendedor (lo principal del perfil
  // y lo que alimenta el feed) y como comprador. No se mezclan.
  const [reviewStats, buyerStats, reviews, salesCount] = await Promise.all([
    prisma.review.aggregate({
      where: { targetId: u.id, targetRole: "SELLER" },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.review.aggregate({
      where: { targetId: u.id, targetRole: "BUYER" },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.review.findMany({
      where: { targetId: u.id, targetRole: "SELLER" },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        author: { select: { firstName: true, lastName: true, avatarUrl: true } },
      },
    }),
    // Ventas concretadas (señal de confianza): publicaciones del usuario en SOLD.
    prisma.listing.count({ where: { sellerId: u.id, status: "SOLD" } }),
  ]);
  const reviewCount = reviewStats._count;
  const avg = reviewStats._avg.rating ?? 0;
  const buyerCount = buyerStats._count;
  const buyerAvg = buyerStats._avg.rating ?? 0;

  const now = new Date();
  const listings = await prisma.listing.findMany({
    where: { sellerId: u.id, status: "ACTIVE" },
    include: {
      images: { orderBy: { position: "asc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
    take: 24,
  });

  const items = listings.map((l) => ({
    id: l.id,
    title: l.title,
    price: Number(l.price),
    image: l.images[0]?.url ?? null,
    city: l.city,
    neighborhood: l.neighborhood,
    condition: l.condition,
    sellerVerified: u.verification === "VERIFIED",
    distanceKm: null,
    featured: l.featuredUntil ? new Date(l.featuredUntil) > now : false,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="card flex items-center gap-4 p-6">
        <Avatar firstName={u.firstName} lastName={u.lastName} src={u.avatarUrl} size={64} />
        <div>
          <h1 className="text-xl font-bold">
            {u.firstName} {u.lastName}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500 dark:text-stone-400">
            <VerificationBadge status={u.verification} />
            {plan && <ProBadge plan={plan} />}
            <span>· {u.city}, {u.province}</span>
          </div>
          {reviewCount > 0 && (
            <div className="mt-1.5 flex items-center gap-1.5 text-sm">
              <Stars value={Math.round(avg)} size={15} />
              <span className="font-semibold">{avg.toFixed(1)}</span>
              <span className="text-gray-400 dark:text-stone-500">
                · {reviewCount} como vendedor
              </span>
            </div>
          )}
          {buyerCount > 0 && (
            <div className="mt-1 flex items-center gap-1.5 text-sm">
              <Stars value={Math.round(buyerAvg)} size={15} />
              <span className="font-semibold">{buyerAvg.toFixed(1)}</span>
              <span className="text-gray-400 dark:text-stone-500">
                · {buyerCount} como comprador
              </span>
            </div>
          )}
          <TrustMeta createdAt={u.createdAt} salesCount={salesCount} className="mt-1" />
        </div>
      </div>

      <h2 className="mb-4 mt-8 text-lg font-bold">
        Publicaciones activas ({items.length})
      </h2>

      {items.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 p-12 text-center text-gray-500 dark:text-stone-400">
          <Package className="h-10 w-10 text-gray-300 dark:text-stone-600" />
          <p>Este usuario no tiene publicaciones activas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <ListingCard key={item.id} item={item} />
          ))}
        </div>
      )}

      <h2 className="mb-4 mt-10 text-lg font-bold">Reseñas ({reviewCount})</h2>
      {reviewCount === 0 ? (
        <div className="card flex flex-col items-center gap-2 p-12 text-center text-gray-500 dark:text-stone-400">
          <Star className="h-10 w-10 text-gray-300 dark:text-stone-600" />
          <p>Todavía no tiene reseñas.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="card p-4">
              <div className="flex items-center gap-3">
                <Avatar
                  firstName={r.author.firstName}
                  lastName={r.author.lastName}
                  src={r.author.avatarUrl}
                  size={36}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {r.author.firstName} {r.author.lastName}
                  </p>
                  <Stars value={r.rating} size={14} />
                </div>
                <span className="shrink-0 text-xs text-gray-400 dark:text-stone-500">
                  {formatRelative(r.createdAt)}
                </span>
              </div>
              {r.comment && (
                <p className="mt-2 text-sm text-gray-600 dark:text-stone-300">{r.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
