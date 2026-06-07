import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

/** Combina clases de Tailwind resolviendo conflictos. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formatea un precio en pesos argentinos sin decimales. */
export function formatPrice(value: number | string): string {
  const num = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(num);
}

/** "hace 3 horas", "hace 2 días", etc. */
export function formatRelative(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: es });
}

/** Fecha absoluta legible: "7 de junio de 2026, 14:30". */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(d);
}

/** Iniciales para avatares. */
export function getInitials(firstName: string, lastName?: string): string {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
}

/** Distancia "a 2,5 km" o "a 800 m". */
export function formatDistance(km: number): string {
  if (km < 1) return `a ${Math.round(km * 1000)} m`;
  return `a ${km.toLocaleString("es-AR", { maximumFractionDigits: 1 })} km`;
}
