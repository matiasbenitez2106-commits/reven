import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

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

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          verification: user.verification,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.verification = user.verification;
      } else if (trigger === "update" && token.id) {
        // Refresca verificación y nombre cuando se llama a session.update()
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, verification: true, firstName: true, lastName: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.verification = dbUser.verification;
          token.name = `${dbUser.firstName} ${dbUser.lastName}`;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role;
        session.user.verification = token.verification;
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
