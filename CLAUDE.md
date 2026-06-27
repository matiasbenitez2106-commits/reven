# CLAUDE.md — Manual del proyecto trato

> Este archivo lo leo al empezar cada conversación. Es la fuente de verdad para
> entender el proyecto y cómo trabajar en él.

## Qué es trato
trato es un **marketplace de compraventa entre particulares verificados** de
Argentina (publicar, buscar, chatear y comprar usados). Está en producción en
**https://www.apptrato.com**.

## Stack (tecnología)
- **Next.js 14 (App Router) + React + TypeScript** — páginas y APIs en un solo proyecto.
- **Tailwind CSS** — estilos y modo oscuro.
- **Prisma + PostgreSQL (Neon)** — base de datos.
- **NextAuth (Credentials, JWT)** — login y sesiones.
- **Servicios externos:** Cloudinary (imágenes), MercadoPago (pagos), Resend
  (emails), MapTiler/OpenStreetMap (mapas), face-api.js + zxing/PDF417 (verificación de DNI).
- **Hosting:** Vercel (app) · Neon (DB) · Cloudflare (dominio) · GitHub (código).

## Comandos reales
Requisitos: Node.js y un archivo `.env` con las claves (DATABASE_URL, NEXTAUTH_SECRET,
Cloudinary, MercadoPago, Resend, ENCRYPTION_KEY, etc.).

```bash
npm install            # instalar dependencias

npm run dev            # correr en local → http://localhost:3000

# Testear:
npm test               # pruebas automáticas (Vitest) de la lógica pura de lib/
npx tsc --noEmit       # chequeo de tipos (no debe tirar errores)
npm run build          # build de producción (debe compilar OK)
npm run lint           # linter

# Base de datos (Prisma):
npm run db:push        # aplicar el esquema a la base
npm run db:studio      # ver/editar datos en el navegador
npm run db:seed        # cargar datos de prueba
```

Deploy: un `git push` a la rama `main` dispara el deploy automático en Vercel
(no lo hago sin tu confirmación — ver reglas abajo).

## Organización de carpetas
- `prisma/` — esquema de la base de datos (tablas) y datos de prueba.
- `public/` — archivos estáticos (logo en `public/brand/`, service worker PWA).
- `src/app/` — **páginas** (cada subcarpeta es una pantalla: `articulos/`, `buscar/`,
  `publicar/`, `mensajes/`, `cuenta/`, `suscripcion/`, `verificacion/`, `admin/`…)
  y `src/app/api/` — la **lógica de servidor** (registro, login, pagos, uploads…).
- `src/components/` — piezas de UI reutilizables (`Navbar`, `Logo`, y subcarpetas
  `listings/`, `chat/`, `auth/`, `admin/`, `ui/`…).
- `src/lib/` — el "motor": `auth.ts`, `prisma.ts`, `mercadopago.ts`, `payments.ts`,
  `storage.ts`, `email.ts`, `crypto.ts`, `validations.ts`, `subscriptions.ts`…
- `src/content/` — textos legales (Términos, Privacidad).
- `src/middleware.ts` — protege rutas (ej. `/admin` solo para admin).
- Docs: `README.md`, `BRAND.md` (manual de marca), `SECURITY.md` (auditorías).

Flujo mental: **página** (`app/`) → usa **componentes** (`components/`) → que llaman
**funciones** (`lib/`) → que leen/escriben en la **base de datos** (`prisma/`).

## Cómo quiero que trabajes
- No sé programar: explicame los cambios en palabras simples, sin jerga.
- Antes de algo grande, primero contame el plan y esperá mi OK.
- No borres archivos ni subas nada a producción sin que yo lo confirme.
- Cuando termines algo, decime en una línea qué hiciste.

## Reglas de seguridad y datos (críticas)
- Nunca guardar contraseñas, tokens ni datos de DNI en texto plano ni en el repo.
- Los datos personales (DNI, selfies, emails) se tratan con cuidado extra y
  según la Ley 25.326 de Protección de Datos Personales (Argentina).
- Todo cambio que toque login, pagos, verificación de identidad o datos de
  usuarios se revisa con cuidado antes de darlo por listo.
