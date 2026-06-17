import { withAuth } from "next-auth/middleware";

// Rutas que requieren sesión iniciada. La verificación de identidad (verified-only
// para publicar/contactar) se chequea a nivel de página/endpoint con mensajes claros.
export default withAuth({
  callbacks: {
    // /admin y /api/admin exigen rol ADMIN ya en el borde (red de seguridad
    // además del guard del layout y de cada endpoint).
    authorized: ({ token, req }) => {
      const path = req.nextUrl.pathname;
      if (path.startsWith("/admin") || path.startsWith("/api/admin")) {
        return token?.role === "ADMIN";
      }
      return !!token;
    },
  },
  pages: {
    signIn: "/ingresar",
  },
});

export const config = {
  matcher: [
    "/publicar/:path*",
    "/mis-publicaciones/:path*",
    "/mensajes/:path*",
    "/verificacion/:path*",
    "/cuenta/:path*",
    "/favoritos/:path*",
    "/suscripcion/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};
