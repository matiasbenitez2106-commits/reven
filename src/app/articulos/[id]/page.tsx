import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Tag, CalendarDays, Eye, Heart, MessageCircle, Crown } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Gallery } from "@/components/listings/Gallery";
import { ListingOwnerActions } from "@/components/listings/ListingOwnerActions";
import { ContactSellerButton } from "@/components/chat/ContactSellerButton";
import { SaveButton } from "@/components/listings/SaveButton";
import { LocationMap } from "@/components/listings/LocationMap";
import { ViewTracker } from "@/components/listings/ViewTracker";
import { ReportButton } from "@/components/listings/ReportButton";
import { Avatar } from "@/components/ui/Avatar";
import { VerificationBadge } from "@/components/VerificationBadge";
import { ProBadge } from "@/components/ProBadge";
import { activePlan } from "@/lib/subscriptions";
import { geocode } from "@/lib/geo";
import { formatPrice, formatRelative, hideContactInfo } from "@/lib/utils";
import { CONDITION_LABELS } from "@/lib/constants";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const l = await prisma.listing.findUnique({
    where: { id: params.id },
    select: {
      title: true,
      price: true,
      city: true,
      condition: true,
      status: true,
      images: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
    },
  });
  if (!l || l.status === "DELETED") return { title: "Artículo" };

  const desc = `${formatPrice(Number(l.price))} · ${CONDITION_LABELS[l.condition]} · ${l.city}`;
  const img = l.images[0]?.url;
  return {
    title: l.title,
    description: desc,
    openGraph: {
      type: "website",
      url: `/articulos/${params.id}`,
      title: l.title,
      description: desc,
      images: img ? [{ url: img }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: l.title,
      description: desc,
      images: img ? [img] : undefined,
    },
  };
}

export default async function ListingDetailPage({ params }: { params: { id: string } }) {
  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: {
      images: { orderBy: { position: "asc" } },
      category: true,
      seller: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          verification: true,
          city: true,
          province: true,
          avatarUrl: true,
          createdAt: true,
          proPlan: true,
          proUntil: true,
        },
      },
    },
  });

  if (!listing || listing.status === "DELETED") notFound();

  const user = await getCurrentUser();
  const isOwner = user?.id === listing.sellerId;
  const price = Number(listing.price);

  let favorited = false;
  if (user && !isOwner) {
    const f = await prisma.favorite.findUnique({
      where: { userId_listingId: { userId: user.id, listingId: listing.id } },
      select: { id: true },
    });
    favorited = !!f;
  }

  const sellerActiveCount = await prisma.listing.count({
    where: { sellerId: listing.sellerId, status: "ACTIVE" },
  });
  const memberSince = new Date(listing.seller.createdAt).getFullYear();
  const sellerPlan = activePlan(listing.seller.proPlan, listing.seller.proUntil);

  // Si la publicación no tiene coordenadas (geocoding falló al crearla), las
  // calculamos al vuelo para que el mapa de la zona aproximada se muestre igual.
  let mapLat = listing.latitude;
  let mapLng = listing.longitude;
  if (mapLat == null || mapLng == null) {
    try {
      const g = await geocode(
        `${listing.neighborhood ? listing.neighborhood + ", " : ""}${listing.city}, ${listing.province}`
      );
      if (g) {
        mapLat = g.lat;
        mapLng = g.lng;
      }
    } catch {
      /* sin coordenadas: LocationMap muestra el cartel de zona */
    }
  }

  // Estadísticas: solo para el dueño con plan PRO+
  let stats: { views: number; favs: number; contacts: number } | null = null;
  if (isOwner && sellerPlan === "PRO_PLUS") {
    const [favs, contacts] = await Promise.all([
      prisma.favorite.count({ where: { listingId: listing.id } }),
      prisma.conversation.count({ where: { listingId: listing.id } }),
    ]);
    stats = { views: listing.viewCount, favs, contacts };
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <ViewTracker listingId={listing.id} />
      <Link href="/buscar" className="mb-4 inline-block text-sm text-gray-500 dark:text-stone-400 hover:text-brand-600 dark:hover:text-brand-300">
        ← Volver a explorar
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Galería */}
        <div>
          {listing.status === "SOLD" && (
            <div className="mb-3 rounded-lg bg-gray-900 px-3 py-2 text-center text-sm font-semibold text-white">
              VENDIDO
            </div>
          )}
          <Gallery images={listing.images} title={listing.title} />
        </div>

        {/* Detalle */}
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-brand-600 dark:text-brand-300">
            {listing.category.name}
          </span>
          <h1 className="mt-1 text-2xl font-bold">{listing.title}</h1>
          <p className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-stone-100">{formatPrice(price)}</p>

          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-sunken dark:bg-stone-800 px-3 py-1">
              <Tag className="h-4 w-4 text-gray-500 dark:text-stone-400" /> {CONDITION_LABELS[listing.condition]}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-sunken dark:bg-stone-800 px-3 py-1">
              <MapPin className="h-4 w-4 text-gray-500 dark:text-stone-400" />
              {listing.neighborhood ? `${listing.neighborhood}, ` : ""}
              {listing.city}
            </span>
          </div>

          <p className="mt-3 flex items-center gap-1 text-xs text-gray-400 dark:text-stone-500">
            <CalendarDays className="h-3.5 w-3.5" /> Publicado {formatRelative(listing.createdAt)}
          </p>

          {/* Acciones */}
          <div className="mt-6 space-y-3">
            {isOwner ? (
              <ListingOwnerActions listingId={listing.id} status={listing.status} />
            ) : (
              <>
                {listing.status === "ACTIVE" ? (
                  <ContactSellerButton listingId={listing.id} sellerId={listing.sellerId} />
                ) : (
                  <p className="rounded-lg bg-surface-sunken dark:bg-stone-800 p-3 text-sm text-gray-500 dark:text-stone-400">
                    Esta publicación no está disponible para contacto.
                  </p>
                )}
                <SaveButton listingId={listing.id} initialFavorited={favorited} />
              </>
            )}
          </div>

          {/* Estadísticas (PRO+) */}
          {stats && (
            <div className="card mt-4 p-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-stone-500">
                Estadísticas · PRO+
              </p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <Eye className="mx-auto h-5 w-5 text-gray-400 dark:text-stone-500" />
                  <p className="mt-1 text-lg font-bold">{stats.views}</p>
                  <p className="text-xs text-gray-500 dark:text-stone-400">Visitas</p>
                </div>
                <div>
                  <Heart className="mx-auto h-5 w-5 text-gray-400 dark:text-stone-500" />
                  <p className="mt-1 text-lg font-bold">{stats.favs}</p>
                  <p className="text-xs text-gray-500 dark:text-stone-400">Guardados</p>
                </div>
                <div>
                  <MessageCircle className="mx-auto h-5 w-5 text-gray-400 dark:text-stone-500" />
                  <p className="mt-1 text-lg font-bold">{stats.contacts}</p>
                  <p className="text-xs text-gray-500 dark:text-stone-400">Contactos</p>
                </div>
              </div>
            </div>
          )}
          {isOwner && sellerPlan !== "PRO_PLUS" && (
            <Link
              href="/suscripcion"
              className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/40 p-3 text-sm font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40"
            >
              <Crown className="h-4 w-4" /> Ver estadísticas de esta publicación con PRO+
            </Link>
          )}

          {/* Vendedor */}
          <Link
            href={`/usuarios/${listing.seller.id}`}
            className="card mt-6 block p-4 transition hover:bg-surface-hover dark:hover:bg-stone-800"
          >
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-stone-500">
              Vendedor
            </p>
            <div className="flex items-center gap-3">
              <Avatar
                firstName={listing.seller.firstName}
                lastName={listing.seller.lastName}
                src={listing.seller.avatarUrl}
                size={44}
              />
              <div className="min-w-0">
                <p className="font-medium">
                  {listing.seller.firstName} {listing.seller.lastName}
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-stone-400">
                  <VerificationBadge status={listing.seller.verification} />
                  {sellerPlan && <ProBadge plan={sellerPlan} />}
                  <span>· {listing.seller.city}</span>
                </div>
                <p className="mt-1 text-xs text-gray-400 dark:text-stone-500">
                  Miembro desde {memberSince} · {sellerActiveCount}{" "}
                  {sellerActiveCount === 1 ? "publicación activa" : "publicaciones activas"}
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Descripción — visible para todos, pero con los datos de contacto ocultos
          (links, teléfonos, @usuarios, emails) para que el trato quede dentro de la app. */}
      <div className="mt-8 card p-6">
        <h2 className="mb-2 font-semibold">Descripción</h2>
        <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700 dark:text-stone-200">
          {hideContactInfo(listing.description)}
        </p>
      </div>

      {/* Ubicación aproximada */}
      <div className="card mt-6 p-6">
        <h2 className="mb-3 font-semibold">Ubicación aproximada</h2>
        <LocationMap
          lat={mapLat}
          lng={mapLng}
          label={`${listing.neighborhood ? listing.neighborhood + ", " : ""}${listing.city}`}
        />
        <p className="mt-2 text-xs text-gray-400 dark:text-stone-500">
          Por seguridad, solo mostramos la zona aproximada, nunca la dirección exacta.
        </p>
      </div>

      {!isOwner && (
        <div className="mt-6 text-center">
          <ReportButton listingId={listing.id} />
        </div>
      )}
    </div>
  );
}
