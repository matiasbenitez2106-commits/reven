import { Role, VerificationStatus } from "@prisma/client";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      verification: VerificationStatus;
      emailVerified: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    verification: VerificationStatus;
    emailVerified: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    verification: VerificationStatus;
    emailVerified: boolean;
  }
}
