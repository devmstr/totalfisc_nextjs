import { DefaultSession } from "next-auth";
import { UserRole } from "../../prisma/generated/prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      tenantId: string;
      mustChangePassword: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    tenantId: string;
    mustChangePassword: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    tenantId: string;
    mustChangePassword: boolean;
  }
}
