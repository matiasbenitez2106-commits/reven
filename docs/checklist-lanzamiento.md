# Checklist de lanzamiento — baja de cuenta en dos fases

_Última actualización: 20 de junio de 2026_

> Todo el sistema de baja en dos fases está **programado, probado en local y dormido** (28 commits sin subir). Esta lista es para **el día que decidas activarlo en producción**. Hasta entonces, nada cambia para los usuarios.

## ⚠️ Reglas de oro (leer ANTES de empezar)
- [ ] **Los dos interruptores se prenden JUNTOS:** `ACCOUNT_DELETION_LIVE="true"` (borrado real) y `MOSTRAR_TEXTOS_BAJA="true"` (textos nuevos) van **casi al mismo tiempo**. Nunca uno sin el otro: si publicás los textos sin el robot, prometés un borrado que no ocurre; si prendés el robot sin los textos, borrás sin haberlo informado.
- [ ] **El robot va primero en ENSAYO unos días:** antes de prender el borrado real, dejá el robot corriendo en modo ensayo y revisá el log del cron, para confirmar que elige bien a quién borraría.
- [ ] **La fecha se actualiza ANTES de publicar los textos:** poné `UPDATED_NUEVO` (en `legal.nuevo.ts`) en la fecha real de publicación justo antes de prender `MOSTRAR_TEXTOS_BAJA`.

## 1) Pasos de activación en producción (en orden)
- [ ] **1. Subir los 28 commits** a `main` → deploy automático en Vercel. *(Nada cambia visible: el robot queda en ensayo y se siguen mostrando los textos viejos.)*
- [ ] **2. Pasar el proyecto a Vercel Pro** (el cron lo requiere) y **configurar `CRON_SECRET`** en las variables de entorno de Vercel.
- [ ] **3. Dejar el robot en modo ENSAYO varios días** (sin definir `ACCOUNT_DELETION_LIVE`) y **revisar el log del cron** cada día: confirmar que la lista de "cuentas que se borrarían" es correcta.
- [ ] **4. Activar todo junto** (cuando el ensayo dé bien varios días seguidos):
  - [ ] 4a. Actualizar **`UPDATED_NUEVO`** (la fecha) en `legal.nuevo.ts` a la fecha real de publicación.
  - [ ] 4b. Prender **`ACCOUNT_DELETION_LIVE="true"`** en Vercel.
  - [ ] 4c. Prender **`MOSTRAR_TEXTOS_BAJA="true"`** en Vercel.
  - [ ] 4d. **Redeploy** para que tomen efecto los cambios.
- [ ] **5. Verificar después del redeploy:** que `/privacidad` y `/terminos` muestran los textos nuevos, y que en la próxima corrida el robot loguea `modo=REAL`.

## 2) Pendientes legales (resolver ANTES de lanzar — dependen de tu viejo)
- [x] Completar la **razón social** y el **domicilio legal** del responsable en los textos legales (van en `legal.nuevo.ts`, la versión que se publica). *(Hecho: REVEN TECHNOLOGIES ARGENTINA S.A., CUIT 30-71294856-4, Alberti 1764, CABA, CP 1249.)*
- [ ] **Correos de contacto** (`privacidad@apptrato.com` / `soporte@apptrato.com`): confirmar que están **operativos** (que RECIBEN mail, no solo que la app envía) antes de publicar. Si finalmente vas a usar otras direcciones, reemplazalas en `legal.nuevo.ts`.

  **Diagnóstico hecho (jun-2026):** el dominio ya recibe vía **Cloudflare Email Routing** (tiene MX a `route1/2/3.mx.cloudflare.net` y SPF de Cloudflare). Falta confirmar en el panel que esas dos direcciones reenvían a una casilla tuya verificada. Cómo chequearlo:

  - [ ] **Entrar:** dash.cloudflare.com → sitio `apptrato.com` → menú **Email → Email Routing**.
  - [ ] **Routing activo:** arriba debe decir *Enabled/Activo*. (Si ofrece "Enable Email Routing", está apagado → activalo con el asistente; agrega solo los MX/SPF.)
  - [ ] **Casilla destino verificada:** pestaña **Destination addresses** → tu Gmail debe figurar como **Verified**. Si está *Pending*, abrí el mail de Cloudflare en tu Gmail y confirmá el link. Si no está, **Add destination address** → tu Gmail → confirmá.
  - [ ] **Reglas de las dos direcciones:** pestaña **Routing rules → Custom addresses** → deben existir `privacidad@` y `soporte@`, en estado **Active**, con *Send to* → tu Gmail verificado. (Un **Catch-all** activo hacia tu Gmail también las cubre.)
  - [ ] **Si falta alguna:** **Create address** → escribí `privacidad` + `@apptrato.com` → Action **Send to an email** → elegí tu Gmail → **Save**. Repetí con `soporte`. Verificá que queden **Active**.
  - [ ] **Prueba final (la que vale):** desde tu Gmail mandá un mail a `privacidad@apptrato.com` y otro a `soporte@apptrato.com`; esperá 1–5 min y confirmá que **llegan** (revisá también Spam). Si llegan → listo.
  - [ ] *(Para después, no bloquea el lanzamiento)* Si querés **responder como** `@apptrato.com` y no desde tu Gmail, hay que configurar "Enviar como" en Gmail o usar Resend con el dominio verificado: Email Routing **solo reenvía**.
- [x] **Visto bueno final del abogado** sobre los textos **ya con esos datos puestos** (razón social, domicilio, correos). *(Hecho: OK del abogado sobre la versión de `legal.nuevo.ts` con los datos de la S.A. cargados.)*
- [ ] Consultarle **cuánto tiempo retiene Vercel los logs** (contienen el email de usuarios borrados, por el rastro de auditoría del robot) y confirmar que ese plazo es compatible con la **Ley 25.326**.

## 3) Qué quedó probado en local (para llegar tranquilo)
- [x] **Robot probado 3 veces** en base aislada de Neon: en modo ensayo (solo detecta y loguea), en modo real (borró de verdad, bloqueó la de la denuncia, mandó los emails 2 y 3), y re-probado después de cerrar el TOCTOU.
- [x] **Panel de admin probado entero:** estados (en baja / bloqueada / activa), botón "Completar baja" apagado con denuncia y activo sin denuncia, borrado con confirmación por email, y re-chequeo del servidor (frenó el borrado al inyectar una denuncia).
- [x] **Interruptor de textos probado:** apagado → textos viejos, encendido → textos nuevos.
- [x] **Ventana TOCTOU cerrada** (re-verificación de denuncias dentro de `deleteUserAccount`) y re-probada sin regresiones.
