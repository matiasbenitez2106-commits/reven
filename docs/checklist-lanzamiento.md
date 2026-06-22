# Checklist de lanzamiento — baja de cuenta en dos fases

_Última actualización: 22 de junio de 2026_

> Todo el sistema de baja en dos fases está **programado, probado en local y ya desplegado en producción, pero DORMIDO** (los dos interruptores apagados). Esta lista es para **el día que decidas activarlo**. Hasta entonces, nada cambia para los usuarios.

## ⚠️ Reglas de oro (leer ANTES de empezar)
- [ ] **Los dos interruptores se prenden JUNTOS:** `ACCOUNT_DELETION_LIVE="true"` (borrado real) y `MOSTRAR_TEXTOS_BAJA="true"` (textos nuevos) van **casi al mismo tiempo**. Nunca uno sin el otro: si publicás los textos sin el robot, prometés un borrado que no ocurre; si prendés el robot sin los textos, borrás sin haberlo informado.
- [ ] **El robot va primero en ENSAYO unos días:** antes de prender el borrado real, dejá el robot corriendo en modo ensayo y revisá el log del cron, para confirmar que elige bien a quién borraría.
- [ ] **La fecha se actualiza ANTES de publicar los textos:** poné `UPDATED_NUEVO` (en `legal.nuevo.ts`) en la fecha real de publicación justo antes de prender `MOSTRAR_TEXTOS_BAJA`.

## 1) Pasos de activación en producción (en orden)
- [x] **1. Subir el código del sistema de baja** a `main` → deploy automático en Vercel. *(Hecho. El robot quedó en ensayo y se siguen mostrando los textos viejos: nada cambió para los usuarios.)*
- [x] **2. Configurar `CRON_SECRET`** en las variables de entorno de Vercel. *(Hecho — protege el endpoint del cron; sin la clave responde 401.)*
  - ℹ️ **Vercel Pro NO hace falta para activar.** El plan gratuito permite cron diario, y el cron de este proyecto **ya se disparó solo en dry-run** (verificado en los logs). Considerá Pro solo cuando el proyecto **opere comercialmente** (por las reglas de uso del plan gratuito), no por el cron.
- [ ] **3. Dejar el robot en modo ENSAYO varios días** (sin definir `ACCOUNT_DELETION_LIVE`) y **revisar el log del cron** cada día: confirmar que la lista de "cuentas que se borrarían" es correcta.
- [ ] **4. Activar todo junto** (cuando el ensayo dé bien varios días seguidos):
  - [ ] 4a. Actualizar **`UPDATED_NUEVO`** (la fecha) en `legal.nuevo.ts` a la fecha real de publicación.
  - [ ] 4b. Prender **`ACCOUNT_DELETION_LIVE="true"`** en Vercel.
  - [ ] 4c. Prender **`MOSTRAR_TEXTOS_BAJA="true"`** en Vercel.
  - [ ] 4d. **Redeploy** para que tomen efecto los cambios.
- [ ] **5. Verificar después del redeploy:** que `/privacidad` y `/terminos` muestran los textos nuevos, y que en la próxima corrida el robot loguea `modo=REAL`.

## 2) Pendientes legales
- [x] Completar la **razón social** y el **domicilio legal** del responsable en los textos legales (`legal.nuevo.ts`). *(Hecho: REVEN TECHNOLOGIES ARGENTINA S.A., CUIT 30-71294856-4, Alberti 1764, CABA, CP 1249.)*
- [x] **Correos de contacto operativos.** *(Hecho: recepción verificada en Cloudflare Email Routing — se probó desde otra cuenta y llegan; el destino quedó en apptratoadmin@gmail.com.)*
- [x] **Visto bueno final del abogado** sobre los textos ya con esos datos (razón social, domicilio, correos). *(Hecho.)*
- [x] **Retención de logs vs. Ley 25.326.** *(Hecho: aprobado por el abogado. Matiz: el robot loguea el ID del usuario, no el email.)*
- [ ] *(Pendiente menor, NO bloquea el lanzamiento)* **Responder como `@apptrato.com`** (no desde Gmail): hay que configurar "Enviar como" en Gmail o usar Resend con el dominio verificado. Cloudflare Email Routing **solo reenvía**.

## 3) Qué quedó probado en local (para llegar tranquilo)
- [x] **Robot probado 3 veces** en base aislada de Neon: en modo ensayo (solo detecta y loguea), en modo real (borró de verdad, bloqueó la de la denuncia, mandó los emails 2 y 3), y re-probado después de cerrar el TOCTOU.
- [x] **Panel de admin probado entero:** estados (en baja / bloqueada / activa), botón "Completar baja" apagado con denuncia y activo sin denuncia, borrado con confirmación por email, y re-chequeo del servidor (frenó el borrado al inyectar una denuncia).
- [x] **Interruptor de textos probado:** apagado → textos viejos, encendido → textos nuevos.
- [x] **Ventana TOCTOU cerrada** (re-verificación de denuncias dentro de `deleteUserAccount`) y re-probada sin regresiones.
