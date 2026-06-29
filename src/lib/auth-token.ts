import { encode, decode } from "next-auth/jwt";
import type { Session } from "next-auth";
import { getCurrentUser, type AppUser } from "./auth";

type SessionUser = Session["user"];

const SECRET = process.env.NEXTAUTH_SECRET ?? "";
const APP_TOKEN_MAX_AGE = 60 * 60 * 24 * 30; // 30 días

/**
 * Firma un token de app: mismo JWE y MISMO secreto (NEXTAUTH_SECRET) que la sesión
 * web de NextAuth, así getAuthedUser() lo puede verificar. Sin dependencia nueva.
 */
export async function signAppToken(user: AppUser): Promise<string> {
  return encode({
    secret: SECRET,
    maxAge: APP_TOKEN_MAX_AGE,
    token: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      verification: user.verification,
      emailVerified: user.emailVerified,
      deletionScheduledFor: user.deletionScheduledFor,
    },
  });
}

/** Extrae el token de "Authorization: Bearer <token>" (puro, testeable). */
export function parseBearer(header: string | null | undefined): string | null {
  if (!header) return null;
  const m = /^Bearer\s+(.+)$/i.exec(header.trim());
  return m ? m[1].trim() : null;
}

/**
 * Usuario autenticado por BEARER (app) o, si no hay, por COOKIE (web). Drop-in de
 * getCurrentUser() para las API routes que sirven a ambos mundos. El token de app
 * se verifica con NEXTAUTH_SECRET; si es inválido/vencido, cae a la sesión web.
 */
export async function getAuthedUser(req: Request): Promise<SessionUser | null> {
  const token = parseBearer(req.headers.get("authorization"));
  if (token) {
    try {
      const claims = await decode({ token, secret: SECRET });
      if (claims?.id) {
        return {
          id: claims.id,
          name: claims.name ?? null,
          email: claims.email ?? null,
          image: null,
          role: claims.role,
          verification: claims.verification,
          emailVerified: claims.emailVerified,
          deletionScheduledFor: claims.deletionScheduledFor,
        };
      }
    } catch {
      // Token inválido o vencido → caemos a la sesión por cookie (si la hay).
    }
  }
  return getCurrentUser();
}
