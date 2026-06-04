import { notFound } from "next/navigation";
import { Package } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Avatar } from "@/components/ui/Avatar";
import { VerificationBadge } from "@/components/VerificationBadge";
import { ProBadge } from "@/components/ProBadge";
import { ListingCard } from "@/components/listings/ListingCard";
import { activePlan } from "@/lib/subscriptions";

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
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500">
            <VerificationBadge status={u.verification} />
            {plan && <ProBadge plan={plan} />}
            <span>· {u.city}, {u.province}</span>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Miembro desde {new Date(u.createdAt).getFullYear()}
          </p>
        </div>
      </div>

      <h2 className="mb-4 mt-8 text-lg font-bold">
        Publicaciones activas ({items.length})
      </h2>

      {items.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 p-12 text-center text-gray-500">
          <Package className="h-10 w-10 text-gray-300" />
          <p>Este usuario no tiene publicaciones activas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <ListingCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
