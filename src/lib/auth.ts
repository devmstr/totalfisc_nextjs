import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from '@/lib/prisma';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';
import { checkAccountLockout, recordFailedLogin, clearFailedAttempts } from '@/lib/auth/lockout';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user) return null;

        // Check if account is active
        if (!user.isActive) {
          throw new Error('ACCOUNT_DISABLED');
        }

        // Check for account lockout
        const lockout = await checkAccountLockout(user.id);
        if (lockout.locked) {
          throw new Error(`ACCOUNT_LOCKED:${lockout.remainingMinutes}`);
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          await recordFailedLogin(user.id);
          return null;
        }

        // Clear failed attempts on successful login
        await clearFailedAttempts(user.id);

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            lastLoginAt: new Date(),
            // lastLoginIp would be nice here but we need req object which isn't directly available in authorize in this version of next-auth easily
          }
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
          mustChangePassword: user.mustChangePassword,
        };
      }
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.tenantId = (user as any).tenantId;
        token.mustChangePassword = (user as any).mustChangePassword;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role;
        (session.user as any).tenantId = token.tenantId;
        (session.user as any).mustChangePassword = token.mustChangePassword;
      }
      return session;
    },
  },
};
