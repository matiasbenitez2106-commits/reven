import {
  Condition,
  ListingStatus,
  VerificationStatus,
  PaymentType,
  SubscriptionPlan,
  ReportReason,
} from "@prisma/client";

export const AR_PROVINCES = [
  "Buenos Aires",
  "CABA",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
] as const;

export const CONDITION_LABELS: Record<Condition, string> = {
  GOOD: "Bueno",
  VERY_GOOD: "Muy bueno",
  LIKE_NEW: "Como nuevo",
};

export const STATUS_LABELS: Record<ListingStatus, string> = {
  ACTIVE: "Activo",
  SOLD: "Vendido",
  PAUSED: "Pausado",
  DELETED: "Eliminado",
};

export const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  UNVERIFIED: "Sin verificar",
  PENDING: "En revisión",
  VERIFIED: "Verificado",
  REJECTED: "Rechazado",
};

export const SORT_OPTIONS = [
  { value: "recent", label: "Más recientes" },
  { value: "price_asc", label: "Menor precio" },
  { value: "price_desc", label: "Mayor precio" },
  { value: "nearest", label: "Más cercanos" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];

export const MAX_LISTING_IMAGES = 8;

// Planes de publicación destacada (monetización). Precios en ARS.
export const BOOST_PLANS: Record<
  PaymentType,
  { days: number; price: number; label: string; description: string }
> = {
  BOOST_3: {
    days: 3,
    price: 1000,
    label: "Boost 3 días",
    description: "Tu artículo aparece primero por 3 días.",
  },
  FEATURED_7: {
    days: 7,
    price: 2000,
    label: "Destacado 7 días",
    description: "Mayor visibilidad en búsquedas y home por 7 días.",
  },
  FEATURED_14: {
    days: 14,
    price: 5000,
    label: "Destacado 14 días",
    description: "Máxima exposición durante 14 días.",
  },
};

// Días que dura cada destacado incluido en la suscripción
export const INCLUDED_BOOST_DAYS = 7;

// Planes de suscripción del vendedor. Precios en ARS/mes.
// priority: mayor = aparece más arriba en búsquedas (debajo de los destacados pagos).
export const SUBSCRIPTION_PLANS: Record<
  SubscriptionPlan,
  { label: string; price: number; boosts: number; priority: number; perks: string[] }
> = {
  PRO: {
    label: "PRO",
    price: 4000,
    boosts: 2,
    priority: 1,
    perks: [
      "Badge “Vendedor PRO”",
      "Prioridad en los resultados de búsqueda",
      "2 destacados incluidos por mes",
    ],
  },
  PRO_PLUS: {
    label: "PRO+",
    price: 9000,
    boosts: 6,
    priority: 2,
    perks: [
      "Badge “Vendedor PRO+”",
      "Máxima prioridad en búsquedas",
      "6 destacados incluidos por mes",
      "Estadísticas de tus publicaciones",
    ],
  },
};

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  FRAUD: "Estafa / fraude",
  FAKE: "Producto falso o inexistente",
  PROHIBITED: "Artículo prohibido",
  SPAM: "Spam / contenido irrelevante",
  OTHER: "Otro motivo",
};
