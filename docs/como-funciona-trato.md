# Como funciona trato: guia para el dueño

_Última actualización: 17 de junio de 2026_

Este documento explica cómo está organizado el proyecto trato, sin tecnicismos.
Es la primera lectura recomendada antes de cualquier otro documento de esta carpeta.

---

## 1. Qué es trato

trato es un marketplace (es decir, una feria digital) donde personas reales
compran y venden artículos usados entre sí. Lo que lo diferencia de otras ferias
es que todos los vendedores pasan por una verificación de identidad con DNI y
selfie antes de poder publicar.

---

## 2. Las carpetas del proyecto y qué hace cada una

El proyecto vive en la computadora (y en los servidores de Vercel y GitHub) como
una serie de carpetas. Cada carpeta tiene una responsabilidad distinta. Pensalas
como los distintos sectores de un negocio.

### `src/app/` — Las pantallas que ve el usuario

Cada subcarpeta dentro de `src/app/` es una pantalla de la app. Cuando alguien
abre una URL en el navegador, esta carpeta decide qué se muestra.

| Subcarpeta | Qué pantalla es |
|---|---|
| `page.tsx` (raíz) | Inicio / home de trato |
| `buscar/` | Buscador de publicaciones |
| `articulos/[id]/` | La página de un artículo específico |
| `publicar/` | Formulario para publicar un artículo |
| `mis-publicaciones/` | Las publicaciones del usuario logueado |
| `mensajes/` | Bandeja de entrada de chats |
| `cuenta/` | Perfil y configuración de la cuenta |
| `verificacion/` | Proceso de verificación de identidad con DNI |
| `suscripcion/` | Planes PRO y PRO+ (suscripción de vendedor) |
| `favoritos/` | Artículos guardados por el usuario |
| `usuarios/[id]/` | Perfil público de un vendedor |
| `ingresar/` | Login |
| `registrarse/` | Registro de cuenta nueva |
| `recuperar/` y `restablecer/` | Recuperar contraseña olvidada |
| `verificar-email/` | Confirmación del email al registrarse |
| `admin/` | Panel de administración (solo para el admin) |
| `terminos/` y `privacidad/` | Textos legales |
| `contacto/` | Formulario de contacto y soporte |

Dentro de `src/app/api/` viven los "puntos de conexión" internos: son funciones
del servidor que las pantallas llaman para guardar o leer datos. Por ejemplo,
cuando alguien publica un artículo, la pantalla le avisa al punto de conexión
`api/listings/` y ese es quien lo guarda en la base de datos.

### `src/components/` — Las piezas reutilizables de pantalla

Un componente es como un bloque de LEGO: se arma una vez y se usa en muchos
lugares. Por ejemplo, la tarjeta que muestra un artículo en el buscador y en la
página de favoritos es el mismo componente (`ListingCard`).

Las subcarpetas agrupan los componentes por tema:

- `auth/` — formularios de login, registro y recuperación de contraseña
- `listings/` — todo lo relacionado con publicaciones: tarjeta, formulario,
  galería de fotos, mapa, botón de guardar en favoritos, botón de denunciar
- `chat/` — la ventana de conversación entre comprador y vendedor
- `subscription/` — las tarjetas de planes PRO, botón para cancelar, etc.
- `verification/` — el flujo de verificación de identidad con DNI
- `admin/` — herramientas del panel de administración
- `search/` — barra de búsqueda, filtros y orden
- `ui/` — elementos visuales genéricos: botones, badges, avatares
- `Navbar.tsx` / `BottomNav.tsx` — la barra de navegación de arriba y la de abajo (en celular)
- `Footer.tsx` — el pie de página
- `Logo.tsx` — el logo de trato

### `src/lib/` — El motor: las reglas y la lógica del negocio

Si `src/app/` es lo que el usuario ve y toca, `src/lib/` es lo que pasa
"adentro", invisible pero esencial. Es donde viven las reglas de negocio y las
conexiones con servicios externos.

| Archivo | Qué hace |
|---|---|
| `auth.ts` | Reglas de login y sesiones (NextAuth) |
| `prisma.ts` | Conexión a la base de datos |
| `listings.ts` | Lógica para crear, editar y buscar publicaciones |
| `payments.ts` | Lógica de pagos con MercadoPago |
| `mercadopago.ts` | Conexión directa con la API de MercadoPago |
| `mp-webhooks.ts` | Procesa los avisos que manda MercadoPago cuando se cobra algo |
| `subscriptions.ts` | Reglas de los planes PRO y PRO+ |
| `identity.ts` | Lógica de verificación de identidad (DNI + selfie) |
| `face-client.ts` | Comparación de cara: selfie vs. foto del DNI |
| `dni-client.ts` | Lectura del código de barras del DNI |
| `storage.ts` | Guarda y borra imágenes en Cloudinary |
| `email.ts` | Envía emails (verificación, recuperación de contraseña, etc.) |
| `crypto.ts` | Encripta y desencripta datos sensibles (como el número de DNI) |
| `notifications.ts` | Crea notificaciones dentro de la app (la campanita) |
| `validations.ts` | Revisa que los datos que ingresa el usuario sean correctos |
| `ratelimit.ts` | Evita que alguien haga demasiadas acciones seguidas (anti-abuso) |
| `geo.ts` | Todo lo relacionado con ubicación geográfica |
| `tokens.ts` | Genera y verifica los tokens de email y recuperación de contraseña |
| `account.ts` | Operaciones de cuenta: cambiar contraseña, eliminar cuenta |
| `constants.ts` | Valores fijos que se usan en todo el proyecto (límites, precios, etc.) |

### `prisma/` — El plano de la base de datos

La base de datos es donde se guarda toda la información: usuarios, publicaciones,
mensajes, pagos, etc. La carpeta `prisma/` tiene dos archivos:

- `schema.prisma` — el plano de la base de datos. Define qué tablas existen y qué
  guarda cada una. Es como el formulario en blanco: define los campos.
- `seed.ts` — datos de prueba para cuando se trabaja en modo de desarrollo local.

Las tablas principales de la base son:

| Tabla | Qué guarda |
|---|---|
| `User` | Todos los usuarios registrados |
| `Verification` | Los datos de verificación de identidad de cada usuario (encriptados) |
| `Listing` | Las publicaciones de artículos |
| `ListingImage` | Las fotos de cada publicación |
| `Conversation` | Los chats entre comprador y vendedor |
| `Message` | Los mensajes dentro de cada chat |
| `Favorite` | Los artículos guardados por cada usuario |
| `Payment` | Los pagos de publicaciones destacadas |
| `Subscription` | Las suscripciones PRO y PRO+ |
| `Report` | Las denuncias de publicaciones |
| `Notification` | Las notificaciones dentro de la app |
| `SupportMessage` | Los mensajes del formulario de contacto/soporte |
| `AuthToken` | Tokens temporales para verificar email o restablecer contraseña |

### `public/` — Archivos que se muestran tal cual

Esta carpeta tiene archivos que la app sirve directamente al navegador sin
procesarlos. Acá viven:

- `brand/` — los archivos del logo de trato en formato SVG (dos versiones: texto
  vivo y en curvas)
- `uploads/` — imágenes subidas durante el proceso de verificación de identidad y
  de publicaciones, guardadas localmente en desarrollo
- `sw.js` — el service worker (un archivo que permite que la app funcione un poco
  como una app instalada en el celular, con íconos en la pantalla de inicio)

### `src/content/` — Los textos legales

Un solo archivo, `legal.ts`, que contiene los textos de los Términos y
Condiciones y la Política de Privacidad. Cuando alguien abre `/terminos` o
`/privacidad`, la app lee este archivo y lo muestra formateado.

### `src/middleware.ts` — El portero

Este archivo es el portero del sitio. Antes de mostrar cualquier pantalla
protegida, verifica si el usuario tiene sesión iniciada. Si alguien intenta
entrar a `/publicar` o `/mensajes` sin estar logueado, el portero lo redirige al
login. Para las pantallas de `/admin`, además verifica que el usuario sea
administrador. Si no lo es, tampoco entra.

---

## 3. Como se conectan entre sí: la comparacion del restaurante

Imaginate que trato es un restaurante:

- **El salon (`src/app/`)** es donde está el cliente. Ve el menú, hace el pedido,
  recibe el plato. Es todo lo que el usuario toca con el mouse o el dedo.

- **El mozo (`src/components/`)** lleva los pedidos y trae los platos. Son las
  piezas visuales que conectan al cliente con la cocina: botones, tarjetas,
  formularios.

- **La cocina (`src/lib/`)** recibe el pedido y lo prepara con las reglas del
  negocio. Sabe cuánto cobrar, a quién avisarle, cómo verificar una identidad,
  cómo mandarle un email a alguien. No lo ve el cliente, pero es donde pasan las
  cosas importantes.

- **La despensa (`prisma/` + la base de datos en Neon)** es donde está todo
  guardado. La cocina va a buscar los ingredientes ahí (los datos de un usuario,
  las fotos de un artículo) y también deja lo nuevo (un mensaje enviado, un pago
  registrado).

- **El portero (`src/middleware.ts`)** está en la puerta antes de que el cliente
  llegue al salon. Si no tiene reserva (sesión activa), no entra.

El flujo completo de un pedido típico es:

> El usuario toca un botón en la pantalla (salon) → el componente (mozo) manda la
> solicitud → la lógica del motor (cocina) la procesa y aplica las reglas → se lee
> o escribe en la base de datos (despensa) → la respuesta vuelve por el mismo
> camino hasta mostrarse en pantalla.

---

## 4. Las partes mas importantes del proyecto

### Login y sesiones (NextAuth + `src/lib/auth.ts`)

NextAuth es el sistema que maneja los inicios de sesión. Cuando alguien ingresa
su email y contraseña, NextAuth verifica que sean correctos y crea una "sesión":
una credencial temporal que la app guarda en el navegador del usuario, como un
ticket de entrada que dura un tiempo. Mientras ese ticket es válido, el usuario no
tiene que volver a ingresar su contraseña. Si el ticket vence o el usuario cierra
sesión, el portero vuelve a pedir credenciales.

Tambien maneja el registro de cuentas nuevas, la verificación del email
(mandando un link de confirmación), y la recuperación de contraseña olvidada.

### Publicaciones: crear y buscar (`src/app/articulos/`, `src/app/buscar/`, `src/lib/listings.ts`)

Publicar un artículo requiere tener la identidad verificada. El vendedor
completa un formulario con título, descripción, precio, categoría, condición y
fotos. Las fotos se suben a Cloudinary (un servicio externo de almacenamiento de
imágenes). Todo lo demás se guarda en la tabla `Listing` de la base de datos.

El buscador permite filtrar por categoría, precio, condición, ubicación y orden
(más reciente, más barato, etc.). Las publicaciones "destacadas" (que el vendedor
pagó para aparecer primero) se muestran antes que las demás.

### Chat y mensajes (`src/app/mensajes/`, `src/components/chat/`)

Cuando un comprador quiere preguntar algo sobre un artículo, puede iniciar una
conversación con el vendedor. Cada conversación está ligada a un artículo
específico y tiene un solo comprador y un solo vendedor. Dentro de la
conversación se intercambian mensajes de texto. La campanita de notificaciones
avisa cuando llega un mensaje nuevo.

### Verificacion de identidad (`src/app/verificacion/`, `src/lib/identity.ts`)

Este es el diferencial de trato: antes de publicar, el usuario debe verificar
quién es. El proceso tiene tres pasos:

1. Foto del frente del DNI.
2. Foto del dorso del DNI (donde está el código de barras con los datos).
3. Selfie en tiempo real (para confirmar que la persona que está frente a la
   cámara es la misma del DNI).

El sistema lee el código de barras del DNI, extrae el número de documento y lo
compara con la selfie. Los datos sensibles (número de DNI, URLs de las fotos) se
guardan encriptados en la base de datos, en cumplimiento con la Ley 25.326 de
Protección de Datos Personales de Argentina. Un administrador revisa manualmente
cada solicitud de verificación antes de aprobarla o rechazarla.

Mientras una cuenta no esté verificada, puede navegar y buscar, pero no puede
publicar ni contactar a vendedores.

### Pagos con MercadoPago (`src/lib/payments.ts`, `src/lib/subscriptions.ts`, `src/lib/mercadopago.ts`)

trato tiene dos tipos de pagos, ambos procesados por MercadoPago:

**Suscripciones de vendedor (recurrentes):**
- Plan PRO: ofrece beneficios como mayor visibilidad y boosts incluidos.
- Plan PRO+: versión con mas beneficios que el PRO.
- Se cobran de forma automática y recurrente (como un servicio de streaming). El
  vendedor puede cancelar cuando quiera.

**Publicaciones destacadas (pago unico):**
- El vendedor puede pagar para que su publicación aparezca antes que las demas
  en los resultados de búsqueda durante 3, 7 o 14 días.

Cuando MercadoPago procesa un pago (o lo rechaza, o lo cancela), le manda un
aviso automático a trato a través de un webhook (es decir, un mensaje de servidor
a servidor). El archivo `src/lib/mp-webhooks.ts` recibe ese aviso y actualiza el
estado del pago en la base de datos.

---

*Documento generado para uso interno del equipo de trato. No contiene codigo ni datos sensibles.*
