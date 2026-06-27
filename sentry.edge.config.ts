// Inicialización de Sentry para el runtime Edge (middleware y edge routes).
// Se carga desde src/instrumentation.ts (register). El DSN no es secreto.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://21d961349e85ca16ba5f815e050a1247@o4511638870097920.ingest.us.sentry.io/4511638882811904",
  // Muestreo de performance: 10% para no gastar la cuota gratis.
  tracesSampleRate: 0.1,
  debug: false,
});
