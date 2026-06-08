# Trato 🇦🇷

Plataforma de **compraventa de artículos usados entre particulares verificados** en Argentina.
Publicá gratis, sin comisiones. La diferencia: **todos los usuarios verifican su identidad**.

MVP construido con **Next.js 14 (App Router) + TypeScript + Tailwind + Prisma + PostgreSQL + NextAuth**.

---

## ✨ Funcionalidades (Fase 1)

- **Registro + verificación de identidad obligatoria** para publicar/contactar.
  - Captura de frente y dorso del DNI + **selfie en vivo** (prueba de vida).
  - Estados: `UNVERIFIED → PENDING → VERIFIED / REJECTED`.
  - Datos sensibles **encriptados** (AES-256-GCM); accesibles solo por admin.
  - Proveedor de verificación **pluggable** (mock para el MVP, endpoint listo para Onfido).
- **Publicación de artículos** (gratis, sin comisión):
  - Hasta 8 fotos con **drag & drop**, portada, preview.
  - Categorías: Ropa y calzado, Electrónica, Muebles y hogar, Juguetes, Libros, Deportes, Otros.
  - CRUD completo + marcar como **Vendido**.
- **Búsqueda y exploración**: texto, categoría, precio mín/máx, condición, **proximidad** (km),
  orden por reciente / menor precio / mayor precio / más cercano.
- **Página de detalle**: galería con **zoom** (lightbox), **mapa de ubicación aproximada (~500 m,
  sin dirección exacta)**, perfil del vendedor (verificado, miembro desde, publicaciones activas).
- **Favoritos**: guardar artículos y verlos en el perfil.
- **Chat** comprador ↔ vendedor (solo verificados), con **badge de no leídos**.
- **Perfil**: público (del vendedor) y propio (editar perfil, foto, cambiar contraseña,
  activas/vendidas, favoritos).
- **Publicaciones destacadas** (monetización) con **MercadoPago**: Boost 3 días ($1.000),
  Destacado 7 días ($2.000), Destacado 14 días ($5.000). Aparecen primero y con badge.
- **UX mobile-first**: header fijo + navbar inferior; onboarding de 3 pasos.
- Solo los usuarios verificados pueden **publicar** y **contactar**; cualquiera puede explorar.

---

## 🧱 Stack

| Capa | Tecnología |
|------|------------|
| Frontend / Backend | Next.js 14 (App Router) + API Routes |
| Estilos | Tailwind CSS |
| Base de datos | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js (Credentials + JWT) |
| Imágenes | Cloudinary (con fallback local en dev) |
| Geo | Mapbox geocoding (con fallback de ciudades AR) |
| Identidad | Mock (endpoint listo para Onfido / AWS Rekognition) |
| Pagos (destacados) | MercadoPago Checkout Pro (modo mock sin credenciales) |
| Chat | Polling (recomendado migrar a Supabase Realtime / Pusher / Ably) |

---

## 🚀 Puesta en marcha

### 1. Requisitos
- Node.js 18.17+ (o 20+)
- Una base PostgreSQL (local, o gratis en [Neon](https://neon.tech) / [Supabase](https://supabase.com) / [Railway](https://railway.app))

### 2. Instalar dependencias
```bash
npm install
```

### 3. Variables de entorno
```bash
cp .env.example .env
```
Completá al menos `DATABASE_URL`, `NEXTAUTH_SECRET` y `ENCRYPTION_KEY`:
```bash
# Secreto de NextAuth
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# Clave de encriptación (32 bytes hex)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
> Cloudinary y Mapbox son **opcionales** en desarrollo. Sin Cloudinary, las imágenes se
> guardan en `/public/uploads`. Sin Mapbox, se usa un diccionario de ciudades AR.

### 4. Base de datos
```bash
npm run db:push     # crea las tablas según prisma/schema.prisma
npm run db:seed     # categorías + usuarios de prueba
```
Usuarios sembrados:
- `demo@reven.ar` / `demo1234` — **verificado** (ya puede publicar/contactar)
- `admin@reven.ar` / `admin1234` — admin (puede revisar verificaciones)

### 5. Correr
```bash
npm run dev
```
Abrí http://localhost:3000

---

## 🔐 Verificación de identidad (MVP)

El proveedor está en [`src/lib/identity.ts`](src/lib/identity.ts) y es **pluggable**:

- `IDENTITY_PROVIDER=mock` (default) — simula liveness + match facial.
  - `IDENTITY_AUTO_DECISION=verified` (default) aprueba al instante.
  - `=manual` deja en `PENDING` para revisión por un admin.
  - `=rejected` fuerza rechazo (para probar ese estado).
- `IDENTITY_PROVIDER=onfido` — completar `runOnfido()` con la API real.

Revisión manual de un admin (estado `PENDING`):
```bash
POST /api/verification/decision   # body: { userId, decision: "VERIFIED"|"REJECTED", reason? }
```

Los datos sensibles (Nº de DNI y URLs de las imágenes) se guardan **encriptados**
(AES-256-GCM, [`src/lib/crypto.ts`](src/lib/crypto.ts)).

> ⚠️ El fallback de imágenes en `/public/uploads` **no es seguro** para documentos de
> identidad en producción. Usá Cloudinary (entrega privada) o S3 con buckets privados.

---

## 💳 Publicaciones destacadas (MercadoPago)

Planes en [`src/lib/constants.ts`](src/lib/constants.ts) (`BOOST_PLANS`). El flujo es
**pluggable** ([`src/lib/mercadopago.ts`](src/lib/mercadopago.ts)):

- **Sin `MP_ACCESS_TOKEN`** → modo demo: el pago se aprueba al instante para probar el flujo.
- **Con `MP_ACCESS_TOKEN`** → Checkout Pro real: se crea una preferencia y el webhook
  (`/api/payments/webhook`) confirma el pago y aplica el destacado.

Para destacar: entrá a tu publicación → **Destacar** → elegí un plan. El período se acumula si
ya estaba vigente. Las destacadas aparecen primero (búsqueda + home) con badge "Destacado".

---

## 📁 Estructura

```
src/
├─ app/
│  ├─ page.tsx                 # Home (hero + onboarding + categorías + recientes)
│  ├─ buscar/                  # Búsqueda con filtros + proximidad
│  ├─ articulos/[id]/          # Detalle, editar, destacar
│  ├─ publicar/                # Crear publicación (verified-only)
│  ├─ mis-publicaciones/       # CRUD del vendedor
│  ├─ favoritos/               # Artículos guardados
│  ├─ mensajes/                # Inbox + conversación (chat)
│  ├─ usuarios/[id]/           # Perfil público del vendedor
│  ├─ cuenta/ (+ editar)       # Perfil propio, editar, cambiar contraseña
│  ├─ verificacion/            # Flujo de verificación de identidad
│  ├─ ingresar / registrarse
│  └─ api/                     # auth, register, verification, listings, upload, favorites,
│                              # conversations, messages, payments, me
├─ components/                 # ui/, auth/, account/, listings/, search/, chat/, verification/
├─ lib/                        # prisma, auth, crypto, storage, geo, identity, listings,
│                              # mercadopago, payments, validations, constants, utils
└─ types/                      # augmentación de next-auth
prisma/
├─ schema.prisma
└─ seed.ts
```

---

## ☁️ Deploy a Vercel

### Antes de empezar (importante para producción)
- ⚠️ **Cloudinary es OBLIGATORIO en producción.** El fallback `/public/uploads` **no funciona**
  en Vercel (filesystem efímero/solo-lectura). Sin Cloudinary, subir fotos/DNI falla.
- **Base de datos (Neon):** usá la **connection string con pooler** (`...-pooler...`) para la app,
  y la **directa** para migraciones. Podés reusar la misma DB del dev o crear una nueva.

### Pasos
1. **Subí el repo a GitHub** (ya viene inicializado con un commit):
   ```bash
   git remote add origin https://github.com/TU_USUARIO/reven.git
   git push -u origin main
   ```
2. En **vercel.com** → *Add New → Project* → importá el repo. Framework: **Next.js** (autodetectado).
3. Cargá las **variables de entorno** (Project Settings → Environment Variables):
   - `DATABASE_URL` (Neon **pooled**), `NEXTAUTH_URL` (tu URL de Vercel), `NEXTAUTH_SECRET`, `ENCRYPTION_KEY`
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - Opcionales: `MAPBOX_TOKEN` + `NEXT_PUBLIC_MAPBOX_TOKEN`, `MP_ACCESS_TOKEN`, `RESEND_API_KEY` + `EMAIL_FROM` + `ADMIN_EMAIL`, `IDENTITY_PROVIDER`
4. **Deploy.** En el build se corre `prisma generate` automáticamente.
5. **Aplicá el schema a la DB de producción** (una vez, con la URL **directa**):
   ```bash
   DATABASE_URL="postgres://...(directa)..." npx prisma db push
   DATABASE_URL="postgres://...(directa)..." npx prisma db seed   # opcional: categorías + demo
   ```
6. Configurá los **webhooks** en MercadoPago apuntando a
   `https://TU-DOMINIO/api/payments/webhook` y `/api/subscriptions/webhook` (si usás cobros reales).

> El chat usa polling; en serverless (Vercel) **no** uses Socket.io: para tiempo real migrá a
> Supabase Realtime / Pusher / Ably.

---

## 🗺️ Próximos pasos sugeridos

- Reputación / calificaciones entre usuarios (fase siguiente — fuera del MVP).
- Notificaciones (email / push) de mensajes nuevos.
- Realtime en el chat (reemplazar polling por Supabase Realtime / Pusher / Ably).
- Integración real de Onfido + webhook para resolver `PENDING`.
- Reportes / moderación de publicaciones + panel admin de verificaciones.
- Tests (Vitest + Playwright).
