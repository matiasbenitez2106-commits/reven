import { withAuth } from "next-auth/middleware";

// Rutas que requieren sesión iniciada. La verificación de identidad (verified-only
// para publicar/contactar) se chequea a nivel de página/endpoint con mensajes claros.
export default withAuth({
  callbacks: {
    // /admin exige rol ADMIN ya en el borde (además del guard del layout server-side).
    authorized: ({ token, req }) => {
      if (req.nextUrl.pathname.startsWith("/admin")) return token?.role === "ADMIN";
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
  ],
};
