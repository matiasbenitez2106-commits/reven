import { prisma } from "./prisma";

/**
 * Eventos del embudo propio, anónimos (solo type + timestamp, sin userId ni PII).
 * Lista ordenada según el funnel; es la FUENTE ÚNICA: de acá sale el tipo válido
 * para logEvent() y las filas del dashboard /admin/metricas.
 */
export const ANALYTICS_EVENTS = [
  { type: "registro", label: "Registros" },
  { type: "publicacion_creada", label: "Publicaciones creadas" },
  { type: "verificacion_completada", label: "Verificaciones completadas" },
  { type: "oferta_hecha", label: "Ofertas hechas" },
  { type: "venta_concretada", label: "Ventas concretadas" },
] as const;

/** Unión de los 5 tipos válidos: un typo lo caza tsc (no rompe una métrica en silencio). */
export type AnalyticsEventType = (typeof ANALYTICS_EVENTS)[number]["type"];

/**
 * Registra un evento anónimo del embudo. Best-effort: si falla, NO rompe la acción
 * que lo dispara (mismo patrón que notify()/email). Se await-ea con el try/catch
 * adentro para que el insert no se pierda cuando la función serverless termina.
 */
export async function logEvent(type: AnalyticsEventType): Promise<void> {
  try {
    await prisma.analyticsEvent.create({ data: { type } });
  } catch (e) {
    console.error("analytics logEvent:", type, e);
  }
}
