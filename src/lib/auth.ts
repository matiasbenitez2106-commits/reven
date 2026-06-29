import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { Role, VerificationStatus } from "@prisma/client";
import { prisma } from "./prisma";
import { checkRateLimitByKey, RATE_LIMITS } from "./ratelimit";

/** Usuario autenticado (lo que devuelve el login y viaja en la sesión/token). */
export type AppUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  verification: VerificationStatus;
  emailVerified: boolean;
  deletionScheduledFor: string | null;
};

/**
 * Valida email+password (bcrypt, rate-limit por cuenta, no suspendido) y devuelve
 * el usuario o null. FUENTE ÚNICA del login: la usa NextAuth (web, cookie) y el
 * endpoint de token (app, bearer). No cambia el comportamiento del login web.
 */
export async function verifyCredentials(
  emailRaw: string,
  password: string
): Promise<AppUser | null> {
  const email = emailRaw.toLowerCase().trim();

  // Rate limit anti fuerza-bruta por cuenta. Al excederse, falla como credencial
  // inválida (el usuario ve el mensaje genérico).
  const rl = await checkRateLimitByKey("login", email, RATE_LIMITS.login);
  if (!rl.success) {
    console.warn(`Login rate-limited para ${email}`);
    return null;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  // Cuenta suspendida por un administrador: no puede ingresar.
  if (user.suspendedAt) return null;

  return {
    id: user.id,
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
    role: user.role,
    verification: user.verification,
    emailVerified: !!user.emailVerified,
    deletionScheduledFor: user.deletionScheduledFor
      ? user.deletionScheduledFor.toISOString()
      : null,
  };
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/ingresar",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        // Login web por la MISMA función que el endpoint de token (app).
        return verifyCredentials(credentials.email, credentials.password);
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.verification = user.verification;
        token.emailVerified = !!user.emailVerified;
        token.deletionScheduledFor = user.deletionScheduledFor;
      } else if (trigger === "update" && token.id) {
        // Refresca verificación, email y nombre cuando se llama a session.update()
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            role: true,
            verification: true,
            firstName: true,
            lastName: true,
            emailVerified: true,
            deletionScheduledFor: true,
          },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.verification = dbUser.verification;
          token.emailVerified = !!dbUser.emailVerified;
          token.name = `${dbUser.firstName} ${dbUser.lastName}`;
          token.deletionScheduledFor = dbUser.deletionScheduledFor
            ? dbUser.deletionScheduledFor.toISOString()
            : null;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role;
        session.user.verification = token.verification;
        session.user.emailVerified = token.emailVerified;
        session.user.deletionScheduledFor = token.deletionScheduledFor;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

/** Sesión del usuario en server components / route handlers. */
export function getSession() {
  return getServerSession(authOptions);
}

/** Usuario de la sesión (o null). */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

/** Trae el registro completo del usuario actual desde la base (o null). */
export async function getCurrentDbUser() {
  const session = await getSession();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}
