// URL base canónica de la app.
//
// ⚠️ Seguridad: para links que viajan en EMAILS o hacia servicios externos
// (MercadoPago back_urls / notification_url) NUNCA hay que usar el origin del
// request: el header `Host` es manipulable por el atacante y permite el
// "password reset poisoning" (el link del email apunta al dominio del atacante,
// que roba el token → toma de cuenta). Siempre preferimos la env canónica.
export function appBaseUrl(req?: Request): string {
  const env = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (env) return env.replace(/\/$/, "");
  // Fallback solo para desarrollo local cuando no hay env configurada.
  if (req) {
    try {
      return new URL(req.url).origin;
    } catch {
      /* noop */
    }
  }
  return "";
}
