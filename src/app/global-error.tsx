"use client";

// Captura en Sentry los errores de renderizado que llegan al límite raíz.
import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es">
      <body>
        {/* `NextError` es la página de error genérica de Next. */}
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
