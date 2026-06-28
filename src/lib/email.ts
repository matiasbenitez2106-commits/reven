import { prisma } from "./prisma";

// Envío de emails — PLUGGABLE.
// Sin RESEND_API_KEY, loguea en consola (dev). Con la key, usa Resend (HTTP).
// Resend funciona muy bien en Vercel (sin SMTP). https://resend.com

interface EmailArgs {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailArgs): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "trato <onboarding@resend.dev>";

  if (!key) {
    console.log(`[email:dev] Para: ${to} · Asunto: ${subject}`);
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) console.error("Resend error:", res.status, await res.text());
  } catch (e) {
    console.error("Email error:", e);
  }
}

/** Email del admin: ADMIN_EMAIL o el primer usuario con rol ADMIN. */
export async function getAdminEmail(): Promise<string | null> {
  if (process.env.ADMIN_EMAIL) return process.env.ADMIN_EMAIL;
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
    select: { email: true },
  });
  return admin?.email ?? null;
}

/** Notifica al admin (no lanza: nunca debe romper la request que la dispara). */
export async function notifyAdmin(subject: string, html: string): Promise<void> {
  try {
    const to = await getAdminEmail();
    if (!to) return;
    await sendEmail({ to, subject, html });
  } catch (e) {
    console.error("notifyAdmin error:", e);
  }
}

/** Escapa HTML para insertar texto del usuario en un email de forma segura. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const wrap = (inner: string) =>
  `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto">
    <h2 style="color:#66785B">trato</h2>${inner}
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
    <p style="color:#999;font-size:12px">trato · compraventa de usados entre personas verificadas.</p>
  </div>`;

export async function sendVerificationEmail(to: string, link: string): Promise<void> {
  await sendEmail({
    to,
    subject: "Verificá tu email · trato",
    html: wrap(
      `<p>¡Bienvenido/a a trato! Confirmá tu email para activar tu cuenta:</p>
       <p><a href="${link}" style="display:inline-block;background:#66785B;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Verificar mi email</a></p>
       <p style="color:#666;font-size:13px">O pegá este link: ${link}</p>
       <p style="color:#666;font-size:13px">Si no creaste la cuenta, ignorá este mensaje.</p>`
    ),
  });
}

export async function sendPasswordResetEmail(to: string, link: string): Promise<void> {
  await sendEmail({
    to,
    subject: "Recuperá tu contraseña · trato",
    html: wrap(
      `<p>Recibimos un pedido para restablecer tu contraseña.</p>
       <p><a href="${link}" style="display:inline-block;background:#66785B;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Crear nueva contraseña</a></p>
       <p style="color:#666;font-size:13px">O pegá este link: ${link}</p>
       <p style="color:#666;font-size:13px">El link vence en 1 hora. Si no fuiste vos, ignorá este mensaje.</p>`
    ),
  });
}

const fmtFecha = (d: Date) => d.toLocaleDateString("es-AR");
const appUrl = () => process.env.NEXTAUTH_URL || "";

/** Aviso al activarse (o renovarse) la suscripción PRO. */
export async function sendSubscriptionActivatedEmail(
  to: string,
  planLabel: string,
  periodEnd: Date
): Promise<void> {
  const link = `${appUrl()}/suscripcion`;
  await sendEmail({
    to,
    subject: `Tu plan ${planLabel} está activo · trato`,
    html: wrap(
      `<p>¡Listo! Tu suscripción <strong>${escapeHtml(planLabel)}</strong> quedó activa. 🎉</p>
       <p>Tenés los beneficios PRO disponibles hasta el <strong>${fmtFecha(periodEnd)}</strong>. Se renueva automáticamente salvo que la canceles.</p>
       <p><a href="${link}" style="display:inline-block;background:#66785B;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Ver mi suscripción</a></p>`
    ),
  });
}

/** Aviso de mensaje nuevo en el chat (con preview del texto). */
export async function sendNewMessageEmail(
  to: string,
  fromName: string,
  listingTitle: string,
  preview: string,
  conversationId: string
): Promise<void> {
  const link = `${appUrl()}/mensajes/${conversationId}`;
  await sendEmail({
    to,
    subject: `Nuevo mensaje de ${fromName} · trato`,
    html: wrap(
      `<p><strong>${escapeHtml(fromName)}</strong> te escribió por <strong>${escapeHtml(listingTitle)}</strong>:</p>
       <p style="border-left:3px solid #66785B;padding:8px 12px;color:#444;background:#f6f6f6;border-radius:4px">${escapeHtml(preview)}</p>
       <p><a href="${link}" style="display:inline-block;background:#66785B;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Responder</a></p>
       <p style="color:#999;font-size:12px">Recibís este aviso porque tenés un mensaje sin leer en trato.</p>`
    ),
  });
}

/** Aviso al comprador para que califique al vendedor tras la venta (evento clave → sí email). */
export async function sendReviewPromptEmail(
  to: string,
  listingTitle: string,
  sellerName: string,
  listingId: string
): Promise<void> {
  const link = `${appUrl()}/articulos/${listingId}`;
  await sendEmail({
    to,
    subject: "¡Felicitaciones por tu compra! Contanos cómo te fue · trato",
    html: wrap(
      `<p>¡Felicitaciones por tu compra de <strong>${escapeHtml(listingTitle)}</strong>! 🎉</p>
       <p>¿Cómo fue tratar con <strong>${escapeHtml(sellerName)}</strong>? Tu calificación ayuda a que la comunidad compre con más confianza.</p>
       <p><a href="${link}" style="display:inline-block;background:#66785B;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Calificar al vendedor</a></p>`
    ),
  });
}

const fmtARS = (n: number) => `$${n.toLocaleString("es-AR")}`;

/** Aviso al vendedor: recibió una oferta nueva (evento clave → sí email). */
export async function sendNewOfferEmail(
  to: string,
  fromName: string,
  listingTitle: string,
  amount: number
): Promise<void> {
  const link = `${appUrl()}/ofertas`;
  await sendEmail({
    to,
    subject: `Nueva oferta de ${fromName} · trato`,
    html: wrap(
      `<p><strong>${escapeHtml(fromName)}</strong> ofertó <strong>${fmtARS(amount)}</strong> por <strong>${escapeHtml(listingTitle)}</strong>.</p>
       <p>Tenés 48 hs para responder: aceptar, rechazar o contraofertar.</p>
       <p><a href="${link}" style="display:inline-block;background:#66785B;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Ver la oferta</a></p>`
    ),
  });
}

/**
 * Aviso a la otra parte de que se cerró el trato (oferta o contraoferta aceptada).
 * Neutro a propósito: sirve igual si aceptó el vendedor o el comprador.
 */
export async function sendOfferClosedEmail(
  to: string,
  listingTitle: string,
  amount: number,
  listingId: string
): Promise<void> {
  const link = `${appUrl()}/articulos/${listingId}`;
  await sendEmail({
    to,
    subject: `¡Trato cerrado! · trato`,
    html: wrap(
      `<p>Se cerró el trato por <strong>${fmtARS(amount)}</strong> en <strong>${escapeHtml(listingTitle)}</strong>. 🎉</p>
       <p>La publicación quedó <strong>reservada</strong>. Coordiná con la otra persona para concretar la entrega.</p>
       <p><a href="${link}" style="display:inline-block;background:#66785B;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Ver la publicación</a></p>`
    ),
  });
}

/** Aviso al cancelar la renovación (mantiene beneficios hasta fin del período). */
export async function sendSubscriptionCancelledEmail(
  to: string,
  planLabel: string,
  activeUntil: Date
): Promise<void> {
  const link = `${appUrl()}/suscripcion`;
  await sendEmail({
    to,
    subject: "Cancelaste la renovación de tu suscripción · trato",
    html: wrap(
      `<p>Cancelaste la renovación de tu plan <strong>${escapeHtml(planLabel)}</strong>.</p>
       <p>Mantenés los beneficios PRO hasta el <strong>${fmtFecha(activeUntil)}</strong>. Después tu cuenta vuelve al plan gratuito; no se hacen más cobros.</p>
       <p>Si cambiás de idea, podés reactivarla cuando quieras:</p>
       <p><a href="${link}" style="display:inline-block;background:#66785B;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Mi suscripción</a></p>`
    ),
  });
}

// ── Baja de cuenta en dos fases (ver docs/plan-borrado-dos-fases.md) ──
// Email 1 (baja solicitada): se llama desde el handler DELETE de
//   src/app/api/me/route.ts cuando la persona pide la baja (cuenta en gracia).
// Emails 2 (recordatorio) y 3 (cuenta borrada): se llaman desde el robot diario
//   en src/app/api/cron/account-deletion/route.ts.

/** Email 1 — Aviso de baja solicitada (cuenta en pausa 90 días, reactivable). */
export async function sendBajaSolicitadaEmail(
  to: string,
  name: string,
  reactivateUrl: string,
  deletionDate: Date
): Promise<void> {
  await sendEmail({
    to,
    subject: "Todavía estás a tiempo de volver a trato",
    html: wrap(
      `<p>Hola ${escapeHtml(name)}:</p>
       <p>Recibimos tu pedido de dar de baja tu cuenta en trato. Lo primero, para que te quedes tranquilo/a: <strong>tu cuenta todavía no se borró</strong>.</p>
       <p>La dejamos <strong>en pausa durante 90 días</strong>. En ese tiempo no aparecés en la plataforma y tus publicaciones quedan ocultas, pero <strong>no perdiste nada</strong>. Si te arrepentís, podés reactivar tu cuenta con un clic y vuelve todo como estaba (tus publicaciones se reactivan solas).</p>
       <p><a href="${reactivateUrl}" style="display:inline-block;background:#66785B;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Reactivar mi cuenta</a></p>
       <p style="color:#666;font-size:13px">O pegá este link: ${reactivateUrl}</p>
       <p>Si no hacés nada, el <strong>${fmtFecha(deletionDate)}</strong> vamos a <strong>borrar de forma definitiva todos tus datos y tu información de verificación</strong>. Eso no se puede deshacer.</p>
       <p>Gracias por haber sido parte. Acá vamos a estar si querés volver. 💚<br/>— El equipo de trato</p>`
    ),
  });
}

/** Email 2 — Recordatorio unos días antes del borrado definitivo. */
export async function sendBajaRecordatorioEmail(
  to: string,
  name: string,
  reactivateUrl: string,
  deletionDate: Date
): Promise<void> {
  await sendEmail({
    to,
    subject: "Te quedan pocos días para recuperar tu cuenta de trato",
    html: wrap(
      `<p>Hola ${escapeHtml(name)}:</p>
       <p>Te escribimos para recordarte que pediste dar de baja tu cuenta en trato y que <strong>el plazo está por cumplirse</strong>: el <strong>${fmtFecha(deletionDate)}</strong> vamos a borrar definitivamente tus datos. Faltan pocos días.</p>
       <p>Si cambiaste de idea, <strong>todavía estás a tiempo</strong>: reactivá tu cuenta y sigue todo como estaba, sin perder nada.</p>
       <p><a href="${reactivateUrl}" style="display:inline-block;background:#66785B;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Reactivar mi cuenta</a></p>
       <p style="color:#666;font-size:13px">O pegá este link: ${reactivateUrl}</p>
       <p>Si preferís que se borre, no tenés que hacer nada: va a pasar solo en la fecha indicada.</p>
       <p>— El equipo de trato</p>`
    ),
  });
}

/** Email 3 — Confirmación final, una vez borrada la cuenta. */
export async function sendCuentaBorradaEmail(to: string, name: string): Promise<void> {
  await sendEmail({
    to,
    subject: "Listo: borramos tus datos de trato",
    html: wrap(
      `<p>Hola ${escapeHtml(name)}:</p>
       <p>Cumplimos con lo que nos pediste: <strong>borramos de forma definitiva tu cuenta y todos tus datos</strong>, incluida tu información de verificación. Ya no queda nada guardado, y este borrado <strong>es permanente</strong>.</p>
       <p>Si algún día querés volver, vas a poder crear una cuenta nueva desde cero cuando quieras. Te vamos a estar esperando.</p>
       <p>Gracias por haber sido parte de trato. 💚<br/>— El equipo de trato</p>`
    ),
  });
}
