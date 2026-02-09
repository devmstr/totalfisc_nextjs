// src/lib/auth/lockout.ts

import prisma from '@/lib/prisma';

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
