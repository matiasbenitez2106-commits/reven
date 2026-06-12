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
    <h2 style="color:#177853">trato</h2>${inner}
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
    <p style="color:#999;font-size:12px">trato · compraventa de usados entre personas verificadas.</p>
  </div>`;

export async function sendVerificationEmail(to: string, link: string): Promise<void> {
  await sendEmail({
    to,
    subject: "Verificá tu email · trato",
    html: wrap(
      `<p>¡Bienvenido/a a trato! Confirmá tu email para activar tu cuenta:</p>
       <p><a href="${link}" style="display:inline-block;background:#177853;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Verificar mi email</a></p>
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
       <p><a href="${link}" style="display:inline-block;background:#177853;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Crear nueva contraseña</a></p>
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
       <p><a href="${link}" style="display:inline-block;background:#177853;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Ver mi suscripción</a></p>`
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
       <p style="border-left:3px solid #177853;padding:8px 12px;color:#444;background:#f6f6f6;border-radius:4px">${escapeHtml(preview)}</p>
       <p><a href="${link}" style="display:inline-block;background:#177853;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Responder</a></p>
       <p style="color:#999;font-size:12px">Recibís este aviso porque tenés un mensaje sin leer en trato.</p>`
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
       <p><a href="${link}" style="display:inline-block;background:#177853;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Mi suscripción</a></p>`
    ),
  });
}
