import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { haversineKm, boundingBox } from "./geo";
import type { SearchParams } from "./validations";
import type { ListingCardItem } from "@/components/listings/ListingCard";
import { activePlan } from "./subscriptions";

export const PAGE_SIZE = 24;

const listInclude = {
  images: { orderBy: { position: "asc" as const }, take: 1 },
  category: { select: { name: true, slug: true } },
  seller: { select: { verification: true, proPlan: true, proUntil: true, firstName: true, lastName: true, avatarUrl: true } },
} satisfies Prisma.ListingInclude;

type ListingWithRel = Prisma.ListingGetPayload<{ include: typeof listInclude }>;

export interface SearchResult {
  items: ListingCardItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

function isFeatured(featuredUntil: Date | null, now: Date): boolean {
  return featuredUntil ? new Date(featuredUntil) > now : false;
}

function toCard(l: ListingWithRel, now: Date, distanceKm: number | null = null): ListingCardItem {
  return {
    id: l.id,
    title: l.title,
    price: Number(l.price),
    image: l.images[0]?.url ?? null,
    city: l.city,
    neighborhood: l.neighborhood,
    condition: l.condition,
    distanceKm,
    sellerVerified: l.seller.verification === "VERIFIED",
    featured: isFeatured(l.featuredUntil, now),
    sellerPro: activePlan(l.seller.proPlan, l.seller.proUntil),
    sellerFirstName: l.seller.firstName,
    sellerLastName: l.seller.lastName,
    sellerAvatar: l.seller.avatarUrl,
  };
}

/**
 * Búsqueda de publicaciones con filtros, orden y proximidad.
 * - Las publicaciones DESTACADAS vigentes aparecen primero (en ambos modos).
 * - Proximidad: bounding box (DB) + Haversine exacto (memoria).
 */
export async function searchListings(p: SearchParams): Promise<SearchResult> {
  const now = new Date();

  const where: Prisma.ListingWhereInput = { status: "ACTIVE" };
  if (p.q) {
    where.OR = [
      { title: { contains: p.q, mode: "insensitive" } },
      { description: { contains: p.q, mode: "insensitive" } },
    ];
  }
  if (p.category) where.category = { slug: p.category };
  if (p.condition) where.condition = p.condition;
  if (p.minPrice != null || p.maxPrice != null) {
    where.price = {
      ...(p.minPrice != null ? { gte: p.minPrice } : {}),
      ...(p.maxPrice != null ? { lte: p.maxPrice } : {}),
    };
  }

  const orderBy: Prisma.ListingOrderByWithRelationInput =
    p.sort === "price_asc"
      ? { price: "asc" }
      : p.sort === "price_desc"
      ? { price: "desc" }
      : { createdAt: "desc" };

  const proximity = p.lat != null && p.lng != null;

  // ── Proximidad: bounding box (DB) + Haversine exacto (memoria) ──
  if (proximity) {
    if (p.distance) {
      const bb = boundingBox({ lat: p.lat!, lng: p.lng! }, p.distance);
      where.latitude = { gte: bb.minLat, lte: bb.maxLat };
      where.longitude = { gte: bb.minLng, lte: bb.maxLng };
    }
    const candidates = await prisma.listing.findMany({ where, include: listInclude, take: 500 });

    let enriched = candidates.map((l) => ({
      listing: l,
      featured: isFeatured(l.featuredUntil, now),
      distanceKm:
        l.latitude != null && l.longitude != null
          ? Math.round(haversineKm(p.lat!, p.lng!, l.latitude, l.longitude) * 10) / 10
          : null,
    }));

    if (p.distance) {
      enriched = enriched.filter((e) => e.distanceKm != null && e.distanceKm <= p.distance!);
    }

    // Orden por criterio elegido...
    switch (p.sort) {
      case "nearest":
        enriched.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
        break;
      case "price_asc":
        enriched.sort((a, b) => Number(a.listing.price) - Number(b.listing.price));
        break;
      case "price_desc":
        enriched.sort((a, b) => Number(b.listing.price) - Number(a.listing.price));
        break;
      default:
        enriched.sort((a, b) => +new Date(b.listing.createdAt) - +new Date(a.listing.createdAt));
    }
    // ...y luego por prioridad: destacado > PRO+ > PRO > resto (sort estable)
    const rank = (e: (typeof enriched)[number]) => {
      if (e.featured) return 3;
      const plan = activePlan(e.listing.seller.proPlan, e.listing.seller.proUntil);
      return plan === "PRO_PLUS" ? 2 : plan === "PRO" ? 1 : 0;
    };
    enriched.sort((a, b) => rank(b) - rank(a));

    const total = enriched.length;
    const start = (p.page - 1) * PAGE_SIZE;
    return {
      items: enriched
        .slice(start, start + PAGE_SIZE)
        .map((e) => toCard(e.listing, now, e.distanceKm)),
      total,
      page: p.page,
      pageSize: PAGE_SIZE,
      hasMore: start + PAGE_SIZE < total,
    };
  }

  // ── Búsqueda normal: destacado > PRO+ > PRO > resto (paginado en DB por buckets) ──
  const notFeatured: Prisma.ListingWhereInput = {
    OR: [{ featuredUntil: null }, { featuredUntil: { lte: now } }],
  };
  const buckets: Prisma.ListingWhereInput[] = [
    { AND: [where, { featuredUntil: { gt: now } }] },
    {
      AND: [where, notFeatured, { seller: { is: { proPlan: "PRO_PLUS", proUntil: { gt: now } } } }],
    },
    {
      AND: [where, notFeatured, { seller: { is: { proPlan: "PRO", proUntil: { gt: now } } } }],
    },
    {
      AND: [
        where,
        notFeatured,
        { seller: { is: { OR: [{ proUntil: null }, { proUntil: { lte: now } }] } } },
      ],
    },
  ];

  const counts = await Promise.all(buckets.map((w) => prisma.listing.count({ where: w })));
  const total = counts.reduce((a, b) => a + b, 0);
  const start = (p.page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;

  // Pagina recorriendo los buckets en orden de prioridad
  const rows: ListingWithRel[] = [];
  let offset = 0;
  for (let i = 0; i < buckets.length && rows.length < PAGE_SIZE; i++) {
    const count = counts[i];
    const bucketStart = offset;
    const bucketEnd = offset + count;
    if (end > bucketStart && start < bucketEnd) {
      const skipInBucket = Math.max(0, start - bucketStart);
      const take = Math.min(PAGE_SIZE - rows.length, count - skipInBucket);
      if (take > 0) {
        const part = await prisma.listing.findMany({
          where: buckets[i],
          include: listInclude,
          orderBy,
          skip: skipInBucket,
          take,
        });
        rows.push(...part);
      }
    }
    offset = bucketEnd;
  }

  return {
    items: rows.map((l) => toCard(l, now)),
    total,
    page: p.page,
    pageSize: PAGE_SIZE,
    hasMore: end < total,
  };
}

// ── Detección de publicaciones duplicadas (mismo producto, mismo vendedor) ──
// Detecta no solo títulos idénticos sino variaciones (palabras de relleno,
// reordenamientos, acentos, plurales, "64 gb" vs "64gb", etc.).

const TITLE_STOPWORDS = new Set([
  "vendo", "venta", "oferta", "ofertas", "urgente", "remato", "remate", "permuto",
  "permuta", "usado", "usada", "liquido", "promo", "promocion", "nuevo", "nueva",
  "de", "del", "la", "el", "los", "las", "un", "una", "unos", "unas", "en", "con",
  "y", "o", "a", "al", "para", "por", "mi", "tu", "su", "lo", "muy", "super", "hermoso",
  "hermosa", "impecable", "excelente", "buen", "buena", "bueno", "gran", "lindo",
  "linda", "oportunidad", "casi", "x",
]);

export function normalizeTitle(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita acentos
    .replace(/[^a-z0-9]+/g, " ")
    // une número + unidad: "64 gb" -> "64gb" (solo unidades, no "12 de")
    .replace(/(\d)\s+(gb|tb|mb|kb|kg|mg|cm|mm|km|ml|lt|hz|ghz|mhz|kw|g|l|m|v|w|p|pulg|pulgadas)\b/g, "$1$2")
    .trim()
    .replace(/\s+/g, " ");
}

function significantTokens(norm: string): Set<string> {
  const out = new Set<string>();
  for (const t of norm.split(" ")) {
    if (t.length >= 2 && !TITLE_STOPWORDS.has(t)) out.add(t);
  }
  return out;
}

// Dos tokens "equivalen" si son iguales o uno es prefijo del otro (plural/sufijo):
// "sillon" ~ "sillones", "gato" ~ "gatos". Tokens cortos (modelos 12/13) exigen igualdad.
function tokensEquivalent(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length >= 4 && b.length >= 4) {
    const [short, long] = a.length <= b.length ? [a, b] : [b, a];
    if (long.startsWith(short) && long.length - short.length <= 2) return true;
  }
  return false;
}

/** True si dos títulos refieren "al mismo producto" (tolerante a variaciones). */
export function titlesAreSimilar(a: string, b: string): boolean {
  const na = normalizeTitle(a);
  const nb = normalizeTitle(b);
  if (!na || !nb) return false;
  if (na === nb) return true;

  const ta = Array.from(significantTokens(na));
  const tb = Array.from(significantTokens(nb));
  if (ta.length === 0 || tb.length === 0) return na === nb;

  const used = new Set<number>();
  let inter = 0;
  for (const x of ta) {
    for (let j = 0; j < tb.length; j++) {
      if (!used.has(j) && tokensEquivalent(x, tb[j])) {
        used.add(j);
        inter++;
        break;
      }
    }
  }
  const union = ta.length + tb.length - inter;
  const jaccard = inter / union;
  const containment = inter / Math.min(ta.length, tb.length);

  // Pide al menos 2 tokens en común para no bloquear productos realmente distintos
  return inter >= 2 && (jaccard >= 0.6 || containment >= 0.72);
}

// ── Compradores de una publicación (candidatos al marcar "vendido") ──

export interface ListingBuyer {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  // true si es el comprador de la oferta aceptada (para resaltarlo/preseleccionarlo).
  fromAcceptedOffer?: boolean;
}

/**
 * Candidatos a "comprador" al marcar una publicación como vendida:
 * - todos los que iniciaron una conversación, y
 * - el comprador de la oferta ACEPTADA (aunque nunca haya abierto el chat),
 *   marcado con fromAcceptedOffer y puesto primero.
 */
export async function getListingBuyers(listingId: string): Promise<ListingBuyer[]> {
  const [convos, accepted] = await Promise.all([
    prisma.conversation.findMany({
      where: { listingId },
      orderBy: { createdAt: "asc" },
      select: {
        buyer: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    }),
    prisma.offer.findFirst({
      where: { listingId, status: "ACCEPTED" },
      orderBy: { updatedAt: "desc" },
      select: {
        buyer: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    }),
  ]);

  const byId = new Map<string, ListingBuyer>();
  for (const c of convos) byId.set(c.buyer.id, { ...c.buyer });
  if (accepted) {
    byId.set(accepted.buyer.id, { ...accepted.buyer, fromAcceptedOffer: true });
  }
  // El de la oferta aceptada va primero.
  return Array.from(byId.values()).sort((a, b) =>
    a.fromAcceptedOffer === b.fromAcceptedOffer ? 0 : a.fromAcceptedOffer ? -1 : 1
  );
}

// ── Elegibilidad para reseñar al vendedor ──

export interface ReviewEligibility {
  /** true solo si está SOLD, el usuario fue el comprador y aún no reseñó. */
  canReview: boolean;
  /** Vendedor de la publicación (target de la reseña), o null si no existe. */
  sellerId: string | null;
  /** true si el usuario ya dejó una reseña para esta publicación. */
  alreadyReviewed: boolean;
}

/**
 * ¿Puede `userId` reseñar la publicación `listingId`? Solo si:
 *  - la publicación está SOLD,
 *  - su soldToId === userId (fue el comprador registrado), y
 *  - todavía no dejó una Review para esa publicación.
 * Devuelve además el sellerId, que es el target de la reseña.
 */
export async function canReviewListing(
  userId: string,
  listingId: string
): Promise<ReviewEligibility> {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { sellerId: true, status: true, soldToId: true },
  });
  if (!listing) return { canReview: false, sellerId: null, alreadyReviewed: false };

  const isBuyer = listing.status === "SOLD" && listing.soldToId === userId;
  if (!isBuyer) return { canReview: false, sellerId: listing.sellerId, alreadyReviewed: false };

  const existing = await prisma.review.findUnique({
    where: { listingId_authorId: { listingId, authorId: userId } },
    select: { id: true },
  });
  return { canReview: !existing, sellerId: listing.sellerId, alreadyReviewed: !!existing };
}

/** Devuelve el título de una publicación activa similar del mismo vendedor, o null. */
export async function findDuplicateActiveListing(
  sellerId: string,
  title: string,
  excludeId?: string
): Promise<string | null> {
  const existing = await prisma.listing.findMany({
    where: {
      sellerId,
      status: { in: ["ACTIVE", "PAUSED"] },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { title: true },
  });
  const match = existing.find((l) => titlesAreSimilar(l.title, title));
  return match ? match.title : null;
}
