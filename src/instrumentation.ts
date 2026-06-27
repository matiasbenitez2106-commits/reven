// Hook de instrumentación de Next.js: carga la config de Sentry según el runtime.
// En Next 14 requiere `experimental.instrumentationHook: true` en next.config.
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

// Captura errores de las server actions / route handlers (Next 15+; no-op en 14).
export const onRequestError = Sentry.captureRequestError;
