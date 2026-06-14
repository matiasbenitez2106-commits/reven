# Seguridad — trato

Registro de la auditoría de seguridad y el hardening aplicado. Fecha: 2026-06-13.

## Arreglado en esta ronda

| # | Riesgo | Severidad | Fix |
|---|--------|-----------|-----|
| 1 | **Password reset poisoning**: los links de email (reset, verificación) y las `back_urls`/`notification_url` de MercadoPago se construían con el `Host` del request (manipulable) → robo de token / toma de cuenta. | **Alta** | Nueva `appBaseUrl()` ([src/lib/urls.ts](src/lib/urls.ts)) que usa la URL canónica (`NEXTAUTH_URL`). Aplicada en register, forgot, resend-verification, reports, verification y los dos checkout. |
| 2 | **Upload público a carpeta de verificación**: `/api/upload` aceptaba `folder: "verification"` (subida pública arbitraria; los DNI van por flujo privado). | Media | Solo se permiten `listings` y `avatars`. Los datos sensibles siguen yendo por `uploadPrivateImage` (Cloudinary `authenticated`). |
| 3 | **Token de un solo uso no atómico**: `findUnique` + `update` permitía una carrera para reusar el token. | Media | Consumo atómico con `updateMany` + guard `usedAt: null` ([src/lib/tokens.ts](src/lib/tokens.ts)). |
| 4 | **Replay de webhook de suscripción** reseteaba `boostsUsed` → destacados infinitos. | Media/Alta | `activateSubscription` ahora es idempotente: si ya está activa el mismo período/plan, no re-otorga ([src/lib/subscriptions.ts](src/lib/subscriptions.ts)). |
| 5 | **URLs firmadas del DNI no expiraban**. | Media (privacidad) | `signedImageUrl` agrega `expires_at` (5 min) ([src/lib/storage.ts](src/lib/storage.ts)). |
| 6 | **Sin límite de tamaño de imagen** en `/api/upload`. | Baja/Media | Límite ~8MB (413 si se excede). |
| 7 | **Dossier de identidad (DNI)** dependía solo del layout para exigir ADMIN. | Baja (defensa en profundidad) | Guard explícito `role === ADMIN` en la propia página. |
| 8 | **Faltaban security headers**. | Media | `next.config.mjs`: CSP `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, HSTS (2 años), `Permissions-Policy`, y `poweredByHeader: false`. |

También: **suspensión de cuentas** por admin (bloquea login en `authorize` + pausa publicaciones).

## Verificado como NO explotable

- **Endpoints `mock-approve`** (pagos/suscripciones): devuelven 403 si MercadoPago
  está configurado (lo está en prod) y validan dueño/sesión. Seguros.
- **Monto del pago**: la preferencia de MP se arma en el servidor desde el plan,
  así que el usuario paga el precio correcto; el webhook re-consulta el estado a
  la API de MP (no confía en el body).

## Residual / aceptado (mejoras futuras)

- **Sesiones JWT no se invalidan al cambiar la contraseña**: una sesión robada
  previa sigue válida hasta que expira el JWT. Mitigable con `passwordChangedAt`
  chequeado en el callback de sesión.
- **Rate limit de login por email** (no por IP). Protege la cuenta; un atacante
  podría rotar emails. Upstash configurado en prod (sin fallback en memoria).
- **Enumeración de cuentas en registro** (409 explícito): decisión de UX,
  atenuada por rate limiting. El reset de contraseña sí responde uniforme.
- **Validación del monto en el webhook** (defensa en profundidad): comparar
  `transaction_amount` contra el precio del plan.

## Ronda 2 (panel admin, soporte, DNI, suscripción)

Arreglado:
- **Admin por defecto del seed eliminado** (`admin@reven.ar` / `admin1234`): era un
  acceso de administrador con credenciales públicas en producción. **Crítico.**
  El seed ya no crea admins con credenciales fijas.
- **DoS de verificación**: la unicidad por DNI ahora solo bloquea contra cuentas
  **VERIFICADAS** (antes también PENDING, lo que permitía "trabar" el DNI de otra
  persona con intentos pendientes). Los duplicados pendientes los resuelve un admin.
- **Fuga de ingresos en suscripción**: el cambio de plan "programado sin cobro"
  ahora solo aplica a **bajas** (PRO+→PRO). Las **subas** (PRO→PRO+) requieren pago.
- Endpoints admin nuevos (borrar usuario, soporte, sistema) validan rol ADMIN en
  el servidor; borrar usuario está protegido (no a otros admins ni a uno mismo).
- `/api/support` valida con zod, tiene rate limit y escapa el contenido del usuario
  en el email; en el panel se renderiza con React (escapado). Sin XSS.

Residual / aceptado:
- **Autenticidad del Nº de DNI**: la lectura del PDF417 es del lado del cliente, así
  que un cliente malicioso podría declarar un número que no es el de su documento
  (el control facial sí garantiza que la cara coincide con el documento subido).
  La unicidad evita duplicados entre cuentas VERIFICADAS y los desajustes van a
  revisión manual. KYC a prueba de todo requiere un proveedor server-side
  (Onfido/Didit) — stub `runOnfido` ya previsto en `src/lib/identity.ts`.

## Ronda 3 (equipo de testers: 4 auditores en paralelo)

Hallazgos confirmados y arreglados:
- **CRÍTICO — auto-verificación de identidad falsificable.** Los scores faciales
  (face-api) y el Nº de DNI se calculaban/leían en el NAVEGADOR y se usaban para
  auto-aprobar (`VERIFIED`). Un cliente malicioso podía mandar `matchScore:0.99` y
  un DNI ajeno → quedaba verificado y "tomaba" ese DNI (suplantación/squatting).
  **Fix:** toda verificación queda **PENDING** y la aprueba un **admin** (los scores
  quedan como ayuda visual). El nº de DNI lo confirma el admin contra la foto.
- **ALTO — monto de pago no validado.** El webhook aprobaba destacados/suscripciones
  mirando solo el `status`, sin comparar el importe pagado. **Fix:** `fetchMpPayment`
  /`fetchMpPreapproval` ahora traen `transaction_amount`; se exige que cubra el precio
  del plan/boost antes de aprobar.
- **MEDIO — webhook fail-open.** Si MP estaba configurado pero faltaba
  `MP_WEBHOOK_SECRET`, se aceptaban webhooks sin firma. **Fix:** fail-closed (rechaza).
- **MEDIO — sin límite de tamaño en `/api/verification`** (DoS/cuota). **Fix:** 8MB por imagen.
- **MEDIO — admin podía aprobar un DNI duplicado.** **Fix:** `verification/decision`
  re-valida unicidad contra cuentas VERIFICADAS antes de aprobar.
- **BAJO — carrera en destacados incluidos** (TOCTOU). **Fix:** consumo atómico con
  guard `boostsUsed < boostsIncluded` en el `updateMany`.
- **BAJO — URLs de imagen sin restringir** (tracking pixel / fuga de IP). **Fix:**
  `imageInput.url` y `avatarUrl` solo aceptan `res.cloudinary.com` o `/uploads/`.
- **Defensa en profundidad** — `/admin/*` ahora exige rol ADMIN también en el
  middleware (antes solo el layout server-side).

Verificado limpio por los testers: sin IDOR, sin escalada de privilegios, sin
inyección SQL, sin XSS (emails escapan, JSX autoescapa), headers de seguridad
completos, rate limiting en endpoints sensibles, tokens robustos, sin fuga de PII
en superficies públicas, descripción oculta a invitados, borrado de cuenta estricto.

## Cómo se hizo

Auditoría multi-agente (7 frentes: auth, IDOR, inyección, secretos, pagos,
uploads, infra) con verificación adversarial. Cada hallazgo se confirmó leyendo
el código real antes de arreglarlo.
