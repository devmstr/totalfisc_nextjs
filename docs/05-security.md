# TOTALFisc - Authentication & Authorization Design

**Version:** 1.0  
**Last Updated:** February 8, 2026  
**Status:** Design Document

---

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Password Security](#password-security)
4. [Role-Based Access Control](#role-based-access-control)
5. [Authentication Implementation](#authentication-implementation)
6. [Authorization Middleware](#authorization-middleware)
7. [Password Reset Flow](#password-reset-flow)
8. [Session Management](#session-management)
9. [TypeScript Types](#typescript-types)
10. [Implementation Priority](#implementation-priority)

---

## Overview

### Goals

- **Multi-tenant isolation**: Users can only access their tenant's data
- **Role-based permissions**: Granular control over feature access
- **Security hardening**: Brute-force protection, password policies
- **Audit compliance**: Track all authentication events
- **Extensibility**: Support for future 2FA/SSO

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        Login Request                             │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Rate Limit Check                              │
│            (5 attempts per 15 min per IP/email)                 │
└─────────────────────────────────────────────────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              │ Blocked        │ OK             │
              ▼                ▼                │
     ┌────────────────┐ ┌────────────────┐     │
     │ Return Error   │ │ Check Account  │     │
     │ (Too Many      │ │ Lockout Status │     │
     │  Attempts)     │ └────────────────┘     │
     └────────────────┘        │               │
                   ┌───────────┼───────────┐   │
                   │ Locked    │ Active    │   │
                   ▼           ▼           │   │
          ┌────────────┐ ┌────────────────┐│   │
          │ Return     │ │ Validate       ││   │
          │ Locked     │ │ Credentials    ││   │
          │ Error      │ └────────────────┘│   │
          └────────────┘        │          │   │
                    ┌───────────┼──────────┘   │
                    │ Invalid   │ Valid        │
                    ▼           ▼              │
           ┌────────────┐ ┌────────────────┐   │
           │ Increment  │ │ Reset Failed   │   │
           │ Failed     │ │ Attempts       │   │
           │ Attempts   │ │ Create Session │   │
           └────────────┘ └────────────────┘   │
                               │               │
                               ▼               │
                    ┌────────────────┐         │
                    │ Return JWT     │         │
                    │ + Activity Log │         │
                    └────────────────┘         │
```

---

## Database Schema

### Enhanced Prisma Schema

```prisma
// ============================================================================
// AUTHENTICATION & AUTHORIZATION
// ============================================================================

// Permission enum - defines all granular permissions in the system
enum Permission {
  // Dashboard
  DASHBOARD_VIEW

  // Accounting - Pieces/Transactions
  PIECE_VIEW
  PIECE_CREATE
  PIECE_EDIT
  PIECE_DELETE
  PIECE_VALIDATE

  // Accounts
  ACCOUNT_VIEW
  ACCOUNT_CREATE
  ACCOUNT_EDIT

  // Auxiliaries
  AUXILIARY_VIEW
  AUXILIARY_CREATE
  AUXILIARY_EDIT
  AUXILIARY_DELETE

  // Invoices
  INVOICE_VIEW
  INVOICE_CREATE
  INVOICE_EDIT
  INVOICE_DELETE
  INVOICE_FINALIZE
  INVOICE_SEND

  // Products
  PRODUCT_VIEW
  PRODUCT_CREATE
  PRODUCT_EDIT
  PRODUCT_DELETE

  // Investments
  INVESTMENT_VIEW
  INVESTMENT_CREATE
  INVESTMENT_EDIT
  DEPRECIATION_RUN

  // Reports
  REPORT_VIEW
  REPORT_EXPORT
  REPORT_FISCAL

  // Reconciliation
  RECONCILIATION_VIEW
  RECONCILIATION_PERFORM

  // Administration
  USER_VIEW
  USER_CREATE
  USER_EDIT
  USER_DELETE
  ROLE_MANAGE
  SETTINGS_VIEW
  SETTINGS_EDIT
  FISCAL_YEAR_MANAGE
  MONTH_CLOSE
  ACTIVITY_LOG_VIEW
}

model Role {
  id           String       @id @default(cuid())
  name         String       // "Admin", "Comptable", "Assistant", "Auditeur"
  description  String?
  permissions  Permission[]
  
  // System roles cannot be modified
  isSystem     Boolean      @default(false)
  
  tenantId     String
  tenant       Tenant       @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  users        User[]
  
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
  
  @@unique([tenantId, name])
  @@index([tenantId])
}

model User {
  id                   String    @id @default(cuid())
  email                String    @unique
  name                 String
  password             String    // Hashed with bcrypt (cost 12)
  
  // Role assignment
  roleId               String
  role                 Role      @relation(fields: [roleId], references: [id])
  
  // Tenant access
  tenantId             String
  tenant               Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  // Account status
  isActive             Boolean   @default(true)
  emailVerified        Boolean   @default(false)
  emailVerifiedAt      DateTime?
  
  // Security - Brute force protection
  failedLoginAttempts  Int       @default(0)
  lockedUntil          DateTime?
  lastFailedLoginAt    DateTime?
  
  // Password management
  passwordChangedAt    DateTime  @default(now())
  mustChangePassword   Boolean   @default(false)
  
  // Activity tracking
  lastLoginAt          DateTime?
  lastLoginIp          String?
  lastActiveAt         DateTime?
  
  // Relationships
  sessions             Session[]
  activityLogs         ActivityLog[]
  passwordResetTokens  PasswordResetToken[]
  
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
  
  @@index([tenantId])
  @@index([email])
  @@index([roleId])
}

model Session {
  id            String    @id @default(cuid())
  sessionToken  String    @unique
  
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Device info
  ipAddress     String?
  userAgent     String?
  deviceType    String?   // "desktop", "mobile", "tablet"
  browser       String?
  os            String?
  
  // Status
  lastActiveAt  DateTime  @default(now())
  expiresAt     DateTime
  isRevoked     Boolean   @default(false)
  revokedAt     DateTime?
  revokedReason String?   // "logout", "password_change", "admin_revoke", "expired"
  
  createdAt     DateTime  @default(now())
  
  @@index([userId])
  @@index([sessionToken])
  @@index([expiresAt])
}

model PasswordResetToken {
  id         String    @id @default(cuid())
  token      String    @unique
  
  userId     String
  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  expiresAt  DateTime
  usedAt     DateTime?
  
  // Security tracking
  requestIp  String?
  usedIp     String?
  
  createdAt  DateTime  @default(now())
  
  @@index([userId])
  @@index([token])
}
```

### Default System Roles

```typescript
// prisma/seed-roles.ts

export const SYSTEM_ROLES = {
  ADMIN: {
    name: 'Administrateur',
    description: 'Accès complet au système',
    permissions: Object.values(Permission), // All permissions
  },
  
  COMPTABLE: {
    name: 'Comptable',
    description: 'Gestion complète de la comptabilité',
    permissions: [
      'DASHBOARD_VIEW',
      'PIECE_VIEW', 'PIECE_CREATE', 'PIECE_EDIT', 'PIECE_DELETE', 'PIECE_VALIDATE',
      'ACCOUNT_VIEW', 'ACCOUNT_CREATE', 'ACCOUNT_EDIT',
      'AUXILIARY_VIEW', 'AUXILIARY_CREATE', 'AUXILIARY_EDIT', 'AUXILIARY_DELETE',
      'INVOICE_VIEW', 'INVOICE_CREATE', 'INVOICE_EDIT', 'INVOICE_DELETE', 
      'INVOICE_FINALIZE', 'INVOICE_SEND',
      'PRODUCT_VIEW', 'PRODUCT_CREATE', 'PRODUCT_EDIT', 'PRODUCT_DELETE',
      'INVESTMENT_VIEW', 'INVESTMENT_CREATE', 'INVESTMENT_EDIT', 'DEPRECIATION_RUN',
      'REPORT_VIEW', 'REPORT_EXPORT', 'REPORT_FISCAL',
      'RECONCILIATION_VIEW', 'RECONCILIATION_PERFORM',
      'MONTH_CLOSE',
    ],
  },
  
  ASSISTANT: {
    name: 'Assistant Comptable',
    description: 'Saisie et consultation sans validation',
    permissions: [
      'DASHBOARD_VIEW',
      'PIECE_VIEW', 'PIECE_CREATE', 'PIECE_EDIT',
      'ACCOUNT_VIEW',
      'AUXILIARY_VIEW', 'AUXILIARY_CREATE', 'AUXILIARY_EDIT',
      'INVOICE_VIEW', 'INVOICE_CREATE', 'INVOICE_EDIT',
      'PRODUCT_VIEW',
      'INVESTMENT_VIEW',
      'REPORT_VIEW',
      'RECONCILIATION_VIEW',
    ],
  },
  
  AUDITEUR: {
    name: 'Auditeur',
    description: 'Consultation et export uniquement',
    permissions: [
      'DASHBOARD_VIEW',
      'PIECE_VIEW',
      'ACCOUNT_VIEW',
      'AUXILIARY_VIEW',
      'INVOICE_VIEW',
      'PRODUCT_VIEW',
      'INVESTMENT_VIEW',
      'REPORT_VIEW', 'REPORT_EXPORT', 'REPORT_FISCAL',
      'RECONCILIATION_VIEW',
      'ACTIVITY_LOG_VIEW',
    ],
  },
};
```

---

## Password Security

### Password Policy Configuration

```typescript
// lib/auth/password-policy.ts

export const PASSWORD_POLICY = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: false,
  preventCommonPasswords: true,
  preventUserInfoInPassword: true,
  preventPasswordReuse: 3,
  expirationDays: null,
} as const;

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  strength: 'weak' | 'fair' | 'strong' | 'very_strong';
}

export function validatePassword(
  password: string,
  userInfo?: { email?: string; name?: string }
): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;
  
  if (password.length < PASSWORD_POLICY.minLength) {
    errors.push(`Le mot de passe doit contenir au moins ${PASSWORD_POLICY.minLength} caractères`);
  } else {
    score += Math.min(2, Math.floor(password.length / 4));
  }
  
  if (password.length > PASSWORD_POLICY.maxLength) {
    errors.push(`Le mot de passe ne peut pas dépasser ${PASSWORD_POLICY.maxLength} caractères`);
  }
  
  if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Le mot de passe doit contenir une lettre majuscule');
  } else if (/[A-Z]/.test(password)) {
    score += 1;
  }
  
  if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Le mot de passe doit contenir une lettre minuscule');
  } else if (/[a-z]/.test(password)) {
    score += 1;
  }
  
  if (PASSWORD_POLICY.requireNumber && !/\d/.test(password)) {
    errors.push('Le mot de passe doit contenir un chiffre');
  } else if (/\d/.test(password)) {
    score += 1;
  }
  
  if (PASSWORD_POLICY.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Le mot de passe doit contenir un caractère spécial');
  } else if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 2;
  }
  
  // Prevent user info in password
  if (PASSWORD_POLICY.preventUserInfoInPassword && userInfo) {
    const lowerPassword = password.toLowerCase();
    
    if (userInfo.email) {
      const emailParts = userInfo.email.toLowerCase().split('@')[0].split(/[._-]/);
      for (const part of emailParts) {
        if (part.length >= 3 && lowerPassword.includes(part)) {
          errors.push('Le mot de passe ne doit pas contenir votre email');
          break;
        }
      }
    }
    
    if (userInfo.name) {
      const nameParts = userInfo.name.toLowerCase().split(/\s+/);
      for (const part of nameParts) {
        if (part.length >= 3 && lowerPassword.includes(part)) {
          errors.push('Le mot de passe ne doit pas contenir votre nom');
          break;
        }
      }
    }
  }
  
  let strength: PasswordValidationResult['strength'];
  if (score <= 2) strength = 'weak';
  else if (score <= 4) strength = 'fair';
  else if (score <= 6) strength = 'strong';
  else strength = 'very_strong';
  
  return { valid: errors.length === 0, errors, strength };
}
```

### Password Hashing

```typescript
// lib/auth/password.ts

import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

export function generateResetToken(): { token: string; hashedToken: string; expiresAt: Date } {
  const token = generateSecureToken(32);
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  return { token, hashedToken, expiresAt };
}
```

### Account Lockout

```typescript
// lib/auth/lockout.ts

import { prisma } from '@/lib/prisma';

const LOCKOUT_CONFIG = {
  maxAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  attemptWindow: 15 * 60 * 1000,
};

export async function checkAccountLockout(userId: string): Promise<{ locked: boolean; remainingMinutes?: number }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lockedUntil: true },
  });
  
  if (!user?.lockedUntil) return { locked: false };
  
  if (new Date() > user.lockedUntil) {
    await prisma.user.update({
      where: { id: userId },
      data: { lockedUntil: null, failedLoginAttempts: 0 },
    });
    return { locked: false };
  }
  
  const remainingMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
  return { locked: true, remainingMinutes };
}

export async function recordFailedLogin(userId: string, ipAddress?: string): Promise<{ locked: boolean; attemptsRemaining: number }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { failedLoginAttempts: true, lastFailedLoginAt: true, tenantId: true },
  });
  
  if (!user) return { locked: false, attemptsRemaining: 0 };
  
  let newAttempts = user.failedLoginAttempts + 1;
  if (user.lastFailedLoginAt && Date.now() - user.lastFailedLoginAt.getTime() > LOCKOUT_CONFIG.attemptWindow) {
    newAttempts = 1;
  }
  
  const shouldLock = newAttempts >= LOCKOUT_CONFIG.maxAttempts;
  const lockedUntil = shouldLock ? new Date(Date.now() + LOCKOUT_CONFIG.lockoutDuration) : null;
  
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: newAttempts, lastFailedLoginAt: new Date(), lockedUntil },
    }),
    prisma.activityLog.create({
      data: {
        type: shouldLock ? 'USER_LOCKED' : 'USER_LOGIN_FAILED',
        description: shouldLock ? `Account locked after ${newAttempts} failed attempts` : `Failed login attempt`,
        userId,
        ipAddress,
        tenantId: user.tenantId,
      },
    }),
  ]);
  
  return { locked: shouldLock, attemptsRemaining: Math.max(0, LOCKOUT_CONFIG.maxAttempts - newAttempts) };
}

export async function clearFailedAttempts(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: 0, lastFailedLoginAt: null, lockedUntil: null },
  });
}
```

---

## Role-Based Access Control

### Permission Checker

```typescript
// lib/auth/permissions.ts

import { Permission } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export interface AuthContext {
  userId: string;
  tenantId: string;
  permissions: Permission[];
}

export async function getAuthContext(): Promise<AuthContext | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      tenantId: true,
      isActive: true,
      role: { select: { permissions: true } },
    },
  });
  
  if (!user || !user.isActive) return null;
  
  return {
    userId: user.id,
    tenantId: user.tenantId,
    permissions: user.role.permissions,
  };
}

export function hasPermission(userPermissions: Permission[], required: Permission | Permission[]): boolean {
  if (Array.isArray(required)) {
    return required.some((p) => userPermissions.includes(p));
  }
  return userPermissions.includes(required);
}
```

### Server Action Authorization

```typescript
// lib/auth/authorize.ts

import { Permission } from '@prisma/client';
import { getAuthContext, hasPermission, AuthContext } from './permissions';
import { prisma } from '@/lib/prisma';

export class AuthorizationError extends Error {
  constructor(message: string, public code: 'UNAUTHORIZED' | 'FORBIDDEN') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export async function requireAuth(): Promise<AuthContext> {
  const context = await getAuthContext();
  if (!context) throw new AuthorizationError('Authentication required', 'UNAUTHORIZED');
  return context;
}

export async function requirePermission(permission: Permission | Permission[]): Promise<AuthContext> {
  const context = await requireAuth();
  
  if (!hasPermission(context.permissions, permission)) {
    await prisma.activityLog.create({
      data: {
        type: 'PERMISSION_DENIED',
        description: `Permission denied: ${Array.isArray(permission) ? permission.join(', ') : permission}`,
        userId: context.userId,
        tenantId: context.tenantId,
      },
    });
    throw new AuthorizationError('Permission denied', 'FORBIDDEN');
  }
  
  return context;
}
```

---

## Authorization Middleware

```typescript
// middleware.ts

import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { Permission } from '@prisma/client';

const ROUTE_PERMISSIONS: Record<string, Permission[]> = {
  '/settings/users': ['USER_VIEW'],
  '/settings/roles': ['ROLE_MANAGE'],
  '/settings/fiscal-year': ['FISCAL_YEAR_MANAGE'],
  '/journals': ['PIECE_VIEW'],
  '/invoices': ['INVOICE_VIEW'],
  '/reports': ['REPORT_VIEW'],
  '/reports/fiscal': ['REPORT_FISCAL'],
};

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password'];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;
  
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    if (isAuthenticated && ['/login', '/register'].some((r) => pathname.startsWith(r))) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  }
  
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(pathname)}`, req.url));
  }
  
  if (req.auth?.user?.mustChangePassword && !pathname.startsWith('/change-password')) {
    return NextResponse.redirect(new URL('/change-password', req.url));
  }
  
  for (const [route, perms] of Object.entries(ROUTE_PERMISSIONS)) {
    if (pathname.startsWith(route)) {
      const userPerms = req.auth?.user?.permissions || [];
      if (!perms.some((p) => userPerms.includes(p))) {
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }
    }
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
};
```

---

## Password Reset Flow

```typescript
// lib/auth/password-reset.ts

import { prisma } from '@/lib/prisma';
import { generateResetToken, hashPassword } from './password';
import { validatePassword } from './password-policy';
import crypto from 'crypto';

export async function requestPasswordReset(email: string, ipAddress?: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, tenantId: true, isActive: true },
  });
  
  if (!user || !user.isActive) {
    return { success: true, message: 'If an account exists, a reset email has been sent.' };
  }
  
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
  
  const { token, hashedToken, expiresAt } = generateResetToken();
  
  await prisma.$transaction([
    prisma.passwordResetToken.create({
      data: { token: hashedToken, userId: user.id, expiresAt, requestIp: ipAddress },
    }),
    prisma.activityLog.create({
      data: {
        type: 'PASSWORD_RESET_REQUESTED',
        description: 'Password reset requested',
        userId: user.id,
        ipAddress,
        tenantId: user.tenantId,
      },
    }),
  ]);
  
  // TODO: Send email with token
  console.log(`Password reset token for ${email}: ${token}`);
  
  return { success: true, message: 'If an account exists, a reset email has been sent.' };
}

export async function resetPassword(token: string, newPassword: string, ipAddress?: string) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token: hashedToken },
    include: { user: { select: { id: true, tenantId: true, email: true, name: true } } },
  });
  
  if (!resetToken || resetToken.expiresAt < new Date() || resetToken.usedAt) {
    return { success: false, error: 'Invalid or expired reset link' };
  }
  
  const validation = validatePassword(newPassword, { email: resetToken.user.email, name: resetToken.user.name });
  if (!validation.valid) {
    return { success: false, error: validation.errors.join('. ') };
  }
  
  const hashedPassword = await hashPassword(newPassword);
  
  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword, passwordChangedAt: new Date(), mustChangePassword: false, failedLoginAttempts: 0, lockedUntil: null },
    }),
    prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date(), usedIp: ipAddress } }),
    prisma.session.updateMany({
      where: { userId: resetToken.userId, isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date(), revokedReason: 'password_change' },
    }),
    prisma.activityLog.create({
      data: { type: 'PASSWORD_RESET_COMPLETED', description: 'Password reset completed', userId: resetToken.userId, ipAddress, tenantId: resetToken.user.tenantId },
    }),
  ]);
  
  return { success: true };
}
```

---

## Session Management

```typescript
// lib/auth/sessions.ts

import { prisma } from '@/lib/prisma';

export async function getUserSessions(userId: string, currentSessionToken?: string) {
  const sessions = await prisma.session.findMany({
    where: { userId, isRevoked: false, expiresAt: { gt: new Date() } },
    select: { id: true, sessionToken: true, ipAddress: true, userAgent: true, lastActiveAt: true, createdAt: true },
    orderBy: { lastActiveAt: 'desc' },
  });
  
  return sessions.map((s) => ({ ...s, isCurrent: s.sessionToken === currentSessionToken }));
}

export async function revokeSession(sessionId: string, userId: string) {
  const session = await prisma.session.findFirst({ where: { id: sessionId, userId, isRevoked: false } });
  if (!session) return false;
  
  await prisma.session.update({
    where: { id: sessionId },
    data: { isRevoked: true, revokedAt: new Date(), revokedReason: 'user_revoke' },
  });
  return true;
}

export async function revokeAllSessions(userId: string, exceptToken?: string) {
  const result = await prisma.session.updateMany({
    where: { userId, isRevoked: false, ...(exceptToken && { sessionToken: { not: exceptToken } }) },
    data: { isRevoked: true, revokedAt: new Date(), revokedReason: 'logout_all' },
  });
  return result.count;
}
```

---

## Implementation Priority

| Phase | Tasks | Effort |
|-------|-------|--------|
| **MVP** | Password policy, Account lockout, TypeScript types | 2-3 days |
| **RBAC** | Role/Permission models, Authorization wrapper, Enhanced middleware | 4-5 days |
| **User Management** | Password reset, Session management, Settings UI | 4-5 days |

---

> **Note**: This design document requires approval before implementation.
