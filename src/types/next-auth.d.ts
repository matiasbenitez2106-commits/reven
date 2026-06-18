import { Role, VerificationStatus } from "@prisma/client";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      verification: VerificationStatus;
      emailVerified: boolean;
      // Fecha de borrado programada (período de gracia). Si tiene valor → la
      // persona está "en proceso de baja". Vacío (null) → cuenta normal.
      deletionScheduledFor: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    verification: VerificationStatus;
    emailVerified: boolean;
    deletionScheduledFor: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    verification: VerificationStatus;
    emailVerified: boolean;
    deletionScheduledFor: string | null;
  }
}
