import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ListingForm } from "@/components/listings/ListingForm";

export const metadata = { title: "Editar publicación" };

export default async function EditListingPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar");

  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: { images: { orderBy: { position: "asc" } } },
  });
  if (!listing || listing.status === "DELETED") notFound();
  if (listing.sellerId !== user.id) redirect(`/articulos/${listing.id}`);

  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    select: { id: true, name: true },
  });

  const initial = {
    title: listing.title,
    description: listing.description,
    price: Number(listing.price),
    categoryId: listing.categoryId,
    condition: listing.condition,
    province: listing.province,
    city: listing.city,
    neighborhood: listing.neighborhood ?? "",
    latitude: listing.latitude,
    longitude: listing.longitude,
    images: listing.images.map((i) => ({ url: i.url, publicId: i.publicId })),
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Editar publicación</h1>
      <div className="mt-6">
        <ListingForm categories={categories} listingId={listing.id} initial={initial} />
      </div>
    </div>
  );
}
