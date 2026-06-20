import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Pantalla de aviso de baja (se construye en la Parte 5). A esta ruta se redirige
// a quien está en proceso de baja; ahí solo puede reactivar o cerrar sesión.
const AVISO_BAJA = "/cuenta/baja";

// Rutas que SIEMPRE puede tocar quien está en gracia. Si faltara alguna, quedaría
// ATRAPADO (sin poder ni reactivar ni salir). Los archivos estáticos (imágenes,
// .js, .css, _next, favicon) ya quedan afuera por el `matcher` de abajo.
function permitidaEnGracia(path: string): boolean {
  return (
    path === AVISO_BAJA ||                    // la propia pantalla de aviso
    path.startsWith("/api/me/reactivate") ||  // endpoint para reactivar
    path.startsWith("/api/auth") ||           // login y logout de NextAuth
    path === "/ingresar" ||                   // pantalla de login
    path.startsWith("/brand")                 // logo y assets de marca
  );
}

// Rutas que requieren sesión iniciada (el resto del sitio es público).
const REQUIERE_LOGIN = [
  "/publicar",
  "/mis-publicaciones",
  "/mensajes",
  "/verificacion",
  "/cuenta",
  "/favoritos",
  "/suscripcion",
];

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Portero de la baja: si la persona está en proceso de baja (tiene fecha de
    // borrado), solo la dejamos en las rutas permitidas; todo lo demás la manda
    // a la pantalla de aviso, donde puede reactivar o cerrar sesión.
    if (token?.deletionScheduledFor && !permitidaEnGracia(path)) {
      return NextResponse.redirect(new URL(AVISO_BAJA, req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      // /admin y /api/admin exigen rol ADMIN ya en el borde (red de seguridad
      // además del guard del layout y de cada endpoint).
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        if (path.startsWith("/admin") || path.startsWith("/api/admin")) {
          return token?.role === "ADMIN";
        }
        // Rutas privadas: requieren sesión. El resto del sitio es público.
        if (REQUIERE_LOGIN.some((p) => path === p || path.startsWith(p + "/"))) {
          return !!token;
        }
        return true;
      },
    },
    pages: {
      signIn: "/ingresar",
    },
  }
);

export const config = {
  matcher: [
    // Todo el sitio EXCEPTO: internos de Next, favicon, archivos con extensión
    // (imágenes, .js, .css, etc.) y la ruta del cron del robot de borrado.
    // Esa ruta se protege sola con CRON_SECRET y NO necesita la sesión de
    // NextAuth; withAuth reventaba ahí con "URI malformed" (lo dispara
    // vercel-cron/1.0). Excluirla en el matcher = el middleware ni se invoca.
    "/((?!api/cron/account-deletion|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
