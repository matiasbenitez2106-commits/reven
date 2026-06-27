import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // no exponer "X-Powered-By: Next.js"
  experimental: {
    // Next 14: necesario para que src/instrumentation.ts (register) se ejecute.
    instrumentationHook: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "api.mapbox.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Anti-clickjacking
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          // No adivinar el MIME type
          { key: "X-Content-Type-Options", value: "nosniff" },
          // No filtrar la URL completa al navegar a otros sitios
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Forzar HTTPS por 2 años (incluye subdominios)
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // Cortar acceso a APIs sensibles del navegador por defecto
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=(self), payment=()",
          },
        ],
      },
      // Pantallas/respuestas que muestran datos de identidad (DNI/selfie): el
      // navegador NO debe cachearlas, para que no queden en el equipo del admin.
      {
        source: "/admin/identidad/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
      {
        source: "/api/admin/verification/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // Organización y proyecto en Sentry (para releases y source maps).
  org: "trato-hk",
  project: "javascript-nextjs",
  // El token se lee de SENTRY_AUTH_TOKEN (.env.sentry-build-plugin, gitignored).
  // No se hardcodea acá. Sin token, el build no falla: no sube source maps.
  silent: !process.env.CI,
  // Sube también source maps de archivos del cliente fuera de /static.
  widenClientFileUpload: true,
  // Saca los logs del SDK de Sentry del bundle del cliente (menos peso).
  disableLogger: true,
});
