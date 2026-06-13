/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // no exponer "X-Powered-By: Next.js"
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
    ];
  },
};

export default nextConfig;
