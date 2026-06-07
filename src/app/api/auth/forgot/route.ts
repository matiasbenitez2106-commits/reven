import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuthToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/email";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/ratelimit";

// Pide el reset de contraseña. Siempre responde OK (no revela si el email existe).
export async function POST(req: Request) {
  const limited = await enforceRateLimit(req, "forgot", RATE_LIMITS.passwordReset);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const email = String(body?.email || "").toLowerCase().trim();

  if (email) {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (user) {
      try {
        const token = await createAuthToken(user.id, "PASSWORD_RESET");
        const baseUrl = new URL(req.url).origin;
        await sendPasswordResetEmail(email, `${baseUrl}/restablecer?token=${token}`);
      } catch (e) {
        console.error("No se pudo enviar el email de reset:", e);
      }
    }
  }

  // Respuesta uniforme (anti-enumeración de cuentas)
  return NextResponse.json({ ok: true });
}
