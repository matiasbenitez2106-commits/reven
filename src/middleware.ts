import { withAuth } from "next-auth/middleware";

// Rutas que requieren sesión iniciada. La verificación de identidad (verified-only
// para publicar/contactar) se chequea a nivel de página/endpoint con mensajes claros.
export default withAuth({
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
