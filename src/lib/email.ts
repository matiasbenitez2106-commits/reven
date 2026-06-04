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
  const from = process.env.EMAIL_FROM || "Reven <onboarding@resend.dev>";

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
