// Inicialización de Sentry en el navegador. El build plugin (withSentryConfig)
// inyecta este archivo en el bundle del cliente. El DSN no es secreto.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://21d961349e85ca16ba5f815e050a1247@o4511638870097920.ingest.us.sentry.io/4511638882811904",
  // Solo monitoreo de errores. SIN Session Replay a propósito: por peso
  // (mobile-first) y por PRIVACIDAD — Replay graba la sesión y la app maneja
  // DNI/selfies (Ley 25.326). No agregar replayIntegration acá.
  tracesSampleRate: 0.1,
  debug: false,
});
