import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ListingCard } from "@/components/listings/ListingCard";

export const metadata = { title: "Favoritos" };

export default async function FavoritesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar");

  const favs = await prisma.favorite.findMany({
    where: { userId: user.id },
    include: {
      listing: {
        include: {
          images: { orderBy: { position: "asc" }, take: 1 },
          seller: { select: { verification: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const items = favs
    .filter((f) => f.listing.status !== "DELETED")
    .map((f) => ({
      id: f.listing.id,
      title: f.listing.title,
      price: Number(f.listing.price),
      image: f.listing.images[0]?.url ?? null,
      city: f.listing.city,
      neighborhood: f.listing.neighborhood,
      condition: f.listing.condition,
      sellerVerified: f.listing.seller.verification === "VERIFIED",
      distanceKm: null,
      featured: f.listing.featuredUntil ? new Date(f.listing.featuredUntil) > now : false,
    }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold">
        <Heart className="h-6 w-6 text-red-500" /> Favoritos
      </h1>

      {items.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-12 text-center">
          <Heart className="h-12 w-12 text-gray-300" />
          <p className="font-medium">Todavía no guardaste nada</p>
          <p className="text-sm text-gray-500">
            Tocá el corazón en una publicación para guardarla acá.
          </p>
          <Link
            href="/buscar"
            className="mt-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Explorar
          </Link>
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
