import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createAuthToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/ratelimit";
import { appBaseUrl } from "@/lib/urls";

// Reenvía el email de verificación al usuario logueado
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const limited = await enforceRateLimit(req, "resend", RATE_LIMITS.emailResend, user.id);
  if (limited) return limited;

  const db = await prisma.user.findUnique({
    where: { id: user.id },
    select: { email: true, emailVerified: true },
  });
  if (!db) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  if (db.emailVerified) return NextResponse.json({ ok: true, already: true });

  const token = await createAuthToken(user.id, "EMAIL_VERIFY");
  const baseUrl = appBaseUrl(req);
  await sendVerificationEmail(db.email, `${baseUrl}/verificar-email?token=${token}`);

  return NextResponse.json({ ok: true });
}
