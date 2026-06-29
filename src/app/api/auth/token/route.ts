import { NextResponse } from "next/server";
import { verifyCredentials } from "@/lib/auth";
import { signAppToken } from "@/lib/auth-token";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/ratelimit";

// Login por TOKEN para la app nativa (iOS). La web sigue con NextAuth/cookie.
// Valida con la MISMA lógica que el login web (verifyCredentials) y devuelve un
// JWT firmado con NEXTAUTH_SECRET. El cliente lo guarda en el Keychain y lo manda
// como "Authorization: Bearer ...".
export async function POST(req: Request) {
  // Defensa por IP, además del rate-limit por cuenta dentro de verifyCredentials.
  const limited = await enforceRateLimit(req, "login", RATE_LIMITS.login);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password) {
    return NextResponse.json({ error: "Email y contraseña requeridos" }, { status: 400 });
  }

  const user = await verifyCredentials(email, password);
  if (!user) {
    // Mensaje genérico (no revela si el email existe).
    return NextResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 });
  }

  const token = await signAppToken(user);
  return NextResponse.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      verification: user.verification,
      emailVerified: user.emailVerified,
    },
  });
}
