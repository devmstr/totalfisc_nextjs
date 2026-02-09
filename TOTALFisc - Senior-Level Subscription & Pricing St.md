<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# TOTALFisc - Senior-Level Subscription \& Pricing Strategy

## Multi-Tenant SaaS Pricing Architecture


***

## Executive Summary

TOTALFisc serves two distinct customer segments:

1. **Accounting Firms/Offices** (Cabinets d'Expertise Comptable) - Managing 5-100+ client companies
2. **Direct Companies** (SMEs/Startups) - Managing their own accounting

This requires a sophisticated **usage-based + seat-based hybrid pricing model** with clear feature gates and scalability limits.

***

## Market Analysis - Algerian Context

### Customer Segmentation

| Segment | Size | Needs | Price Sensitivity | LTV |
| :-- | :-- | :-- | :-- | :-- |
| **Solo Accountants** | ~40% | 1-5 companies | High | Medium |
| **Small Accounting Firms** | ~30% | 5-20 companies | Medium | High |
| **Large Accounting Firms** | ~10% | 20-100+ companies | Low | Very High |
| **Direct Companies (SME)** | ~15% | Single company | High | Low |
| **Startups** | ~5% | Single company, modern needs | Medium | Medium |

### Competitive Pricing (Algeria 2026)

- **PCCOMPTA Desktop**: 45,000-80,000 DA one-time + annual maintenance
- **Sage Algeria**: 120,000-200,000 DA/year
- **Manual Spreadsheets**: Free (but time-consuming)
- **International SaaS** (Pennylane, etc.): Limited Algerian support


### Recommended Price Points (DZD/month)

- **Starter**: 4,990 DA/month (~€30)
- **Professional**: 9,990 DA/month (~€60)
- **Cabinet (Enterprise)**: 24,990 DA/month (~€150) + volume pricing

***

## Three-Tier Pricing Strategy

### Tier 1: STARTER 🌱

**Target:** Solo accountants, micro-businesses, startups
**Price:** **4,990 DA/month** (paid monthly) or **49,900 DA/year** (2 months free)

#### Core Limits

```typescript
{
  // Tenant Limits
  maxTenants: 1,                    // Single company only
  maxUsers: 2,                      // Owner + 1 collaborator
  
  // Transaction Volume
  maxTransactionsPerMonth: 200,     // ~10 transactions/day
  maxInvoicesPerMonth: 50,
  maxAuxiliaries: 100,              // Clients/Suppliers
  
  // Storage
  maxStorageGB: 2,                  // Documents/attachments
  
  // Features
  features: {
    coreAccounting: true,
    invoiceManagement: true,
    basicReports: true,
    g50Declaration: true,
    balanceGeneral: true,
    grandLivre: true,
    
    // Limitations
    multiUser: false,               // Single user only (upgrade for 2nd)
    customBranding: false,
    apiAccess: false,
    prioritySupport: false,
    advancedReports: false,
    liasseFiscale: false,           // Only Pro+
    budgetForecasting: false,
    multiEntity: false,
  },
  
  // Support
  supportLevel: 'EMAIL',            // Email only, 48h response
  onboarding: 'SELF_SERVICE',
}
```


#### Ideal Customer

- Startup with 1-2 employees
- Micro-business (auto-entrepreneur)
- Freelance accountant managing 1 client
- Testing/evaluation users

***

### Tier 2: PROFESSIONAL 💼

**Target:** Small businesses, solo accountants with 2-5 clients
**Price:** **9,990 DA/month** or **99,900 DA/year** (2 months free)

#### Core Limits

```typescript
{
  // Tenant Limits
  maxTenants: 5,                    // Up to 5 companies
  maxUsers: 5,                      // 5 users total (across all tenants)
  maxUsersPerTenant: 3,             // Max 3 users per company
  
  // Transaction Volume
  maxTransactionsPerMonth: 1000,    // ~50 transactions/day
  maxInvoicesPerMonth: 250,
  maxAuxiliaries: 500,
  
  // Storage
  maxStorageGB: 10,
  
  // Features
  features: {
    // All Starter features +
    coreAccounting: true,
    invoiceManagement: true,
    basicReports: true,
    advancedReports: true,
    g50Declaration: true,
    liasseFiscale: true,            // ✅ Tax return generation
    
    multiUser: true,
    roleBasedAccess: true,          // Admin, Accountant, Viewer
    activityLog: true,
    customBranding: false,          // Still locked
    apiAccess: false,
    recurringInvoices: true,
    bankReconciliation: 'MANUAL',   // Manual import only
    budgetForecasting: true,
    customReports: true,
    dataExport: 'EXCEL',            // Excel export
    
    // Advanced
    costCenters: true,
    depreciation: 'AUTOMATIC',
    multiCurrency: false,
  },
  
  // Support
  supportLevel: 'EMAIL_PRIORITY',   // 24h response
  onboarding: 'GUIDED',             // Setup assistance
  monthlyReview: false,
}
```


#### Ideal Customer

- Small accounting office (2-3 accountants)
- SME with dedicated bookkeeper
- Growing business needing multi-user
- Solo accountant managing 3-5 clients

***

### Tier 3: CABINET (Enterprise) 🏢

**Target:** Accounting firms, large companies, multi-entity groups
**Price:** **24,990 DA/month base** + volume pricing

#### Pricing Structure

```typescript
{
  basePlan: {
    price: 24990,                   // Base price
    includedTenants: 15,
    includedUsers: 15,
  },
  
  additionalPricing: {
    perTenant: 1490,                // +1,490 DA per company (16+)
    perUser: 990,                   // +990 DA per user (16+)
    bulkDiscounts: [
      { from: 30, to: 50, discount: 0.15 },   // 15% off
      { from: 51, to: 100, discount: 0.25 },  // 25% off
      { from: 101, to: 999, discount: 0.35 }, // 35% off
    ],
  },
}
```


#### Core Limits

```typescript
{
  // Tenant Limits
  maxTenants: 999,                  // Virtually unlimited
  maxUsers: 999,
  maxUsersPerTenant: 10,
  
  // Transaction Volume
  maxTransactionsPerMonth: 999999,  // Unlimited
  maxInvoicesPerMonth: 999999,
  maxAuxiliaries: 999999,
  
  // Storage
  maxStorageGB: 100,                // +10 GB = 2,990 DA/month
  
  // Features - ALL UNLOCKED
  features: {
    // All Professional features +
    customBranding: true,           // White-label invoices/reports
    apiAccess: true,                // REST API access
    webhooks: true,
    ssoIntegration: true,           // SAML/OAuth SSO
    
    advancedSecurity: {
      ipWhitelist: true,
      twoFactorAuth: true,
      auditLog: 'DETAILED',
      dataEncryption: true,
    },
    
    multiEntity: {
      consolidation: true,          // Multi-company consolidation
      intercompanyTransactions: true,
      groupReporting: true,
    },
    
    bankReconciliation: 'AUTOMATIC', // Auto bank sync (when available)
    multiCurrency: true,
    
    customization: {
      customFields: true,
      customWorkflows: true,
      customReports: 'UNLIMITED',
    },
    
    integration: {
      zapier: true,
      customIntegrations: true,
      dataImportExport: 'UNLIMITED',
    },
  },
  
  // Premium Support
  supportLevel: 'PRIORITY_PHONE',   // Phone + email, 4h response
  onboarding: 'DEDICATED',          // Dedicated onboarding specialist
  accountManager: true,             // Dedicated account manager
  monthlyReview: true,              // Monthly business review
  trainingCredits: 5,               // 5 free training sessions/year
}
```


#### Ideal Customer

- Accounting firms with 10-50 clients
- Large companies with subsidiaries
- Enterprise groups needing consolidation
- High-volume businesses

***

## Technical Implementation

### Database Schema

```prisma
// schema.prisma - Add subscription models

// ============================================================================
// SUBSCRIPTION & BILLING
// ============================================================================

enum PricingPlan {
  STARTER
  PROFESSIONAL
  CABINET
  CUSTOM
}

enum BillingCycle {
  MONTHLY
  YEARLY
}

enum SubscriptionStatus {
  TRIAL           // 14-day free trial
  ACTIVE          // Paying and active
  PAST_DUE        // Payment failed
  SUSPENDED       // Temporarily suspended
  CANCELLED       // User cancelled
  EXPIRED         // Trial/subscription ended
}

model Organization {
  id              String       @id @default(cuid())
  name            String
  ownerEmail      String       @unique
  
  // Subscription
  subscription    Subscription?
  
  // Tenants (companies) owned by this organization
  tenants         Tenant[]
  
  // Users (accountants/employees)
  users           User[]
  
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  
  @@index([ownerEmail])
}

model Subscription {
  id              String              @id @default(cuid())
  
  organizationId  String              @unique
  organization    Organization        @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  // Plan details
  plan            PricingPlan
  billingCycle    BillingCycle
  status          SubscriptionStatus
  
  // Pricing
  basePrice       Decimal             @db.Decimal(10, 2)
  additionalCosts Decimal             @default(0) @db.Decimal(10, 2)
  totalPrice      Decimal             @db.Decimal(10, 2)
  currency        String              @default("DZD")
  
  // Limits
  limits          SubscriptionLimits?
  
  // Usage tracking
  currentUsage    UsageMetrics?
  
  // Billing dates
  trialEndsAt     DateTime?
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime
  cancelAt        DateTime?
  cancelledAt     DateTime?
  
  // Payment
  paymentMethod   String?             // CCP, Bank transfer, etc.
  lastPaymentAt   DateTime?
  nextPaymentAt   DateTime?
  
  // History
  invoices        Invoice[]
  usageHistory    UsageSnapshot[]
  
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
  
  @@index([organizationId, status])
  @@index([status, nextPaymentAt])
}

model SubscriptionLimits {
  id              String       @id @default(cuid())
  
  subscriptionId  String       @unique
  subscription    Subscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  
  // Tenant limits
  maxTenants      Int          // 1, 5, 999
  maxUsers        Int          // 2, 5, 999
  maxUsersPerTenant Int        // 1, 3, 10
  
  // Volume limits
  maxTransactionsPerMonth Int
  maxInvoicesPerMonth     Int
  maxAuxiliaries          Int
  
  // Storage
  maxStorageGB    Int
  
  // Feature flags (JSON for flexibility)
  features        Json         // Detailed feature permissions
  
  updatedAt       DateTime     @updatedAt
}

model UsageMetrics {
  id              String       @id @default(cuid())
  
  subscriptionId  String       @unique
  subscription    Subscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  
  // Current period usage
  currentTenants  Int          @default(0)
  currentUsers    Int          @default(0)
  
  // Monthly counters (reset each billing cycle)
  transactionsThisMonth Int    @default(0)
  invoicesThisMonth     Int    @default(0)
  
  // Cumulative
  totalAuxiliaries      Int    @default(0)
  storageUsedGB         Decimal @default(0) @db.Decimal(10, 2)
  
  // API usage (for Cabinet plan)
  apiCallsThisMonth     Int    @default(0)
  
  lastResetAt     DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
}

// Historical snapshots for analytics
model UsageSnapshot {
  id              String       @id @default(cuid())
  
  subscriptionId  String
  subscription    Subscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  
  snapshotDate    DateTime
  
  // Snapshot data (JSON)
  metrics         Json
  
  createdAt       DateTime     @default(now())
  
  @@index([subscriptionId, snapshotDate])
}

// Update User model to link to Organization
model User {
  id              String       @id @default(cuid())
  email           String       @unique
  name            String
  password        String
  
  role            UserRole     @default(USER)
  
  // Organization membership (for multi-tenant accounting offices)
  organizationId  String?
  organization    Organization? @relation(fields: [organizationId], references: [id])
  
  // Tenant access (which companies this user can access)
  tenantId        String?
  tenant          Tenant?      @relation(fields: [tenantId], references: [id])
  
  // ... rest of fields
  
  @@index([organizationId])
  @@index([tenantId])
}

// Update Tenant to link to Organization
model Tenant {
  id              String       @id @default(cuid())
  companyName     String
  
  // Owner organization (accounting office)
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  // ... rest of fields
  
  @@index([organizationId])
}
```


***

### Limit Enforcement Service

```typescript
// lib/services/subscription.service.ts

import { prisma } from '@/lib/prisma';
import { PricingPlan, SubscriptionStatus } from '@prisma/client';

export interface SubscriptionFeatures {
  coreAccounting: boolean;
  invoiceManagement: boolean;
  multiUser: boolean;
  advancedReports: boolean;
  liasseFiscale: boolean;
  customBranding: boolean;
  apiAccess: boolean;
  multiEntity: boolean;
  budgetForecasting: boolean;
  prioritySupport: boolean;
}

export class SubscriptionService {
  /**
   * Get plan configuration
   */
  static getPlanConfig(plan: PricingPlan) {
    const configs = {
      STARTER: {
        maxTenants: 1,
        maxUsers: 2,
        maxUsersPerTenant: 1,
        maxTransactionsPerMonth: 200,
        maxInvoicesPerMonth: 50,
        maxAuxiliaries: 100,
        maxStorageGB: 2,
        features: {
          coreAccounting: true,
          invoiceManagement: true,
          multiUser: false,
          advancedReports: false,
          liasseFiscale: false,
          customBranding: false,
          apiAccess: false,
          multiEntity: false,
          budgetForecasting: false,
          prioritySupport: false,
        },
      },
      PROFESSIONAL: {
        maxTenants: 5,
        maxUsers: 5,
        maxUsersPerTenant: 3,
        maxTransactionsPerMonth: 1000,
        maxInvoicesPerMonth: 250,
        maxAuxiliaries: 500,
        maxStorageGB: 10,
        features: {
          coreAccounting: true,
          invoiceManagement: true,
          multiUser: true,
          advancedReports: true,
          liasseFiscale: true,
          customBranding: false,
          apiAccess: false,
          multiEntity: false,
          budgetForecasting: true,
          prioritySupport: true,
        },
      },
      CABINET: {
        maxTenants: 999,
        maxUsers: 999,
        maxUsersPerTenant: 10,
        maxTransactionsPerMonth: 999999,
        maxInvoicesPerMonth: 999999,
        maxAuxiliaries: 999999,
        maxStorageGB: 100,
        features: {
          coreAccounting: true,
          invoiceManagement: true,
          multiUser: true,
          advancedReports: true,
          liasseFiscale: true,
          customBranding: true,
          apiAccess: true,
          multiEntity: true,
          budgetForecasting: true,
          prioritySupport: true,
        },
      },
      CUSTOM: {
        // Negotiated limits
        maxTenants: 999,
        maxUsers: 999,
        maxUsersPerTenant: 999,
        maxTransactionsPerMonth: 999999,
        maxInvoicesPerMonth: 999999,
        maxAuxiliaries: 999999,
        maxStorageGB: 500,
        features: {
          coreAccounting: true,
          invoiceManagement: true,
          multiUser: true,
          advancedReports: true,
          liasseFiscale: true,
          customBranding: true,
          apiAccess: true,
          multiEntity: true,
          budgetForecasting: true,
          prioritySupport: true,
        },
      },
    };

    return configs[plan];
  }

  /**
   * Check if action is allowed based on subscription limits
   */
  static async canPerformAction(
    organizationId: string,
    action: 'CREATE_TENANT' | 'ADD_USER' | 'CREATE_TRANSACTION' | 'CREATE_INVOICE',
    additionalData?: any
  ): Promise<{ allowed: boolean; reason?: string; upgradeRequired?: boolean }> {
    // Get subscription
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId },
      include: {
        limits: true,
        currentUsage: true,
      },
    });

    if (!subscription) {
      return { allowed: false, reason: 'No active subscription' };
    }

    // Check subscription status
    if (subscription.status !== SubscriptionStatus.ACTIVE && 
        subscription.status !== SubscriptionStatus.TRIAL) {
      return {
        allowed: false,
        reason: 'Subscription is not active. Please update your payment method.',
      };
    }

    const limits = subscription.limits;
    const usage = subscription.currentUsage;

    if (!limits || !usage) {
      return { allowed: false, reason: 'Subscription limits not configured' };
    }

    // Check specific action
    switch (action) {
      case 'CREATE_TENANT':
        if (usage.currentTenants >= limits.maxTenants) {
          return {
            allowed: false,
            reason: `You have reached the limit of ${limits.maxTenants} ${limits.maxTenants === 1 ? 'company' : 'companies'} for your plan.`,
            upgradeRequired: true,
          };
        }
        break;

      case 'ADD_USER':
        if (usage.currentUsers >= limits.maxUsers) {
          return {
            allowed: false,
            reason: `You have reached the limit of ${limits.maxUsers} users for your plan.`,
            upgradeRequired: true,
          };
        }
        
        // Check per-tenant user limit
        if (additionalData?.tenantId) {
          const tenantUsers = await prisma.user.count({
            where: { tenantId: additionalData.tenantId },
          });
          
          if (tenantUsers >= limits.maxUsersPerTenant) {
            return {
              allowed: false,
              reason: `This company has reached the limit of ${limits.maxUsersPerTenant} users.`,
              upgradeRequired: true,
            };
          }
        }
        break;

      case 'CREATE_TRANSACTION':
        if (usage.transactionsThisMonth >= limits.maxTransactionsPerMonth) {
          return {
            allowed: false,
            reason: `You have reached the limit of ${limits.maxTransactionsPerMonth} transactions this month.`,
            upgradeRequired: true,
          };
        }
        break;

      case 'CREATE_INVOICE':
        if (usage.invoicesThisMonth >= limits.maxInvoicesPerMonth) {
          return {
            allowed: false,
            reason: `You have reached the limit of ${limits.maxInvoicesPerMonth} invoices this month.`,
            upgradeRequired: true,
          };
        }
        break;
    }

    return { allowed: true };
  }

  /**
   * Check if feature is available for organization
   */
  static async hasFeature(
    organizationId: string,
    feature: keyof SubscriptionFeatures
  ): Promise<boolean> {
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId },
      include: { limits: true },
    });

    if (!subscription || !subscription.limits) {
      return false;
    }

    const features = subscription.limits.features as SubscriptionFeatures;
    return features[feature] === true;
  }

  /**
   * Increment usage counter
   */
  static async incrementUsage(
    organizationId: string,
    metric: 'TRANSACTION' | 'INVOICE' | 'API_CALL'
  ): Promise<void> {
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId },
      select: { id: true },
    });

    if (!subscription) return;

    const updateData: any = {};

    switch (metric) {
      case 'TRANSACTION':
        updateData.transactionsThisMonth = { increment: 1 };
        break;
      case 'INVOICE':
        updateData.invoicesThisMonth = { increment: 1 };
        break;
      case 'API_CALL':
        updateData.apiCallsThisMonth = { increment: 1 };
        break;
    }

    await prisma.usageMetrics.update({
      where: { subscriptionId: subscription.id },
      data: updateData,
    });
  }

  /**
   * Reset monthly counters (run on billing cycle)
   */
  static async resetMonthlyUsage(subscriptionId: string): Promise<void> {
    await prisma.usageMetrics.update({
      where: { subscriptionId },
      data: {
        transactionsThisMonth: 0,
        invoicesThisMonth: 0,
        apiCallsThisMonth: 0,
        lastResetAt: new Date(),
      },
    });
  }

  /**
   * Calculate additional costs (over-limit usage)
   */
  static async calculateAdditionalCosts(
    subscriptionId: string
  ): Promise<number> {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        limits: true,
        currentUsage: true,
      },
    });

    if (!subscription || !subscription.limits || !subscription.currentUsage) {
      return 0;
    }

    const { limits, currentUsage, plan } = subscription;

    if (plan !== 'CABINET') {
      return 0; // Only Cabinet plan has overage pricing
    }

    let additionalCost = 0;

    // Additional tenants
    if (currentUsage.currentTenants > 15) {
      additionalCost += (currentUsage.currentTenants - 15) * 1490;
    }

    // Additional users
    if (currentUsage.currentUsers > 15) {
      additionalCost += (currentUsage.currentUsers - 15) * 990;
    }

    // Additional storage
    const storageGB = currentUsage.storageUsedGB.toNumber();
    if (storageGB > limits.maxStorageGB) {
      const extraGB = Math.ceil(storageGB - limits.maxStorageGB);
      additionalCost += extraGB * 299; // 299 DA per GB
    }

    return additionalCost;
  }
}
```


***

### Middleware for Route Protection

```typescript
// lib/middleware/subscription-guard.ts

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { SubscriptionService } from '@/lib/services/subscription.service';

export async function requireFeature(feature: string) {
  return async (req: Request) => {
    const session = await auth();
    
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const hasFeature = await SubscriptionService.hasFeature(
      session.user.organizationId,
      feature as any
    );

    if (!hasFeature) {
      return NextResponse.json(
        {
          error: 'Feature not available',
          message: `This feature requires an upgrade. Please contact support.`,
          upgradeUrl: '/settings/subscription',
        },
        { status: 403 }
      );
    }

    return null; // Allow
  };
}

export async function checkLimit(action: string, additionalData?: any) {
  return async (req: Request) => {
    const session = await auth();
    
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const check = await SubscriptionService.canPerformAction(
      session.user.organizationId,
      action as any,
      additionalData
    );

    if (!check.allowed) {
      return NextResponse.json(
        {
          error: 'Limit reached',
          message: check.reason,
          upgradeRequired: check.upgradeRequired,
          upgradeUrl: '/settings/subscription',
        },
        { status: 403 }
      );
    }

    return null; // Allow
  };
}
```


***

### Server Action with Limit Check

```typescript
// app/(dashboard)/journals/[id]/pieces/actions.ts

'use server';

import { SubscriptionService } from '@/lib/services/subscription.service';

export async function createPiece(data: CreatePieceInput) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return { success: false, error: 'Unauthorized' };
  }

  // Check if action is allowed
  const limitCheck = await SubscriptionService.canPerformAction(
    session.user.organizationId,
    'CREATE_TRANSACTION'
  );

  if (!limitCheck.allowed) {
    return {
      success: false,
      error: limitCheck.reason,
      upgradeRequired: limitCheck.upgradeRequired,
    };
  }

  // Proceed with creation
  const result = await prisma.$transaction(async (tx) => {
    // ... create piece logic ...

    // Increment usage counter
    await SubscriptionService.incrementUsage(
      session.user.organizationId,
      'TRANSACTION'
    );

    return piece;
  });

  return { success: true, data: result };
}
```


***

### UI Components

#### Upgrade Banner

```tsx
// components/subscription/upgrade-banner.tsx

'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ArrowUpIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UpgradeBannerProps {
  message: string;
  feature?: string;
}

export function UpgradeBanner({ message, feature }: UpgradeBannerProps) {
  const router = useRouter();

  return (
    <Alert className="border-orange-500 bg-orange-50">
      <ArrowUpIcon className="h-4 w-4" />
      <AlertTitle>Mise à niveau requise</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        <Button
          size="sm"
          onClick={() => router.push('/settings/subscription')}
          className="ml-4"
        >
          Voir les plans
        </Button>
      </AlertDescription>
    </Alert>
  );
}
```


#### Usage Progress Bar

```tsx
// components/subscription/usage-meter.tsx

'use client';

import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface UsageMeterProps {
  label: string;
  current: number;
  max: number;
  unit?: string;
}

export function UsageMeter({ label, current, max, unit = '' }: UsageMeterProps) {
  const percentage = (current / max) * 100;
  const isNearLimit = percentage > 80;
  const isAtLimit = percentage >= 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className={isAtLimit ? 'text-red-600 font-semibold' : ''}>
              {current} / {max} {unit}
            </span>
            <span className={isNearLimit ? 'text-orange-600' : 'text-gray-500'}>
              {percentage.toFixed(0)}%
            </span>
          </div>
          <Progress
            value={Math.min(percentage, 100)}
            className={isAtLimit ? 'bg-red-100' : isNearLimit ? 'bg-orange-100' : ''}
          />
          {isAtLimit && (
            <p className="text-xs text-red-600">
              Limite atteinte. Veuillez mettre à niveau votre plan.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```


#### Subscription Settings Page

```tsx
// app/(dashboard)/settings/subscription/page.tsx

'use client';

import { useQuery } from '@tanstack/react-query';
import { UsageMeter } from '@/components/subscription/usage-meter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SubscriptionPage() {
  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => fetchSubscription(),
  });

  if (!subscription) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Abonnement</h1>
          <p className="text-gray-600">
            Gérez votre plan et votre utilisation
          </p>
        </div>
        <Badge variant={subscription.status === 'ACTIVE' ? 'default' : 'secondary'}>
          {subscription.status}
        </Badge>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Plan actuel: {subscription.plan}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>Prix mensuel</span>
              <span className="font-semibold">
                {subscription.totalPrice.toFixed(2)} DA/mois
              </span>
            </div>
            <div className="flex justify-between">
              <span>Prochaine facturation</span>
              <span>{new Date(subscription.nextPaymentAt).toLocaleDateString('fr-DZ')}</span>
            </div>
            <Button className="w-full">
              Modifier le plan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage Metrics */}
      <div className="grid grid-cols-2 gap-6">
        <UsageMeter
          label="Sociétés"
          current={subscription.currentUsage.currentTenants}
          max={subscription.limits.maxTenants}
        />
        <UsageMeter
          label="Utilisateurs"
          current={subscription.currentUsage.currentUsers}
          max={subscription.limits.maxUsers}
        />
        <UsageMeter
          label="Transactions ce mois"
          current={subscription.currentUsage.transactionsThisMonth}
          max={subscription.limits.maxTransactionsPerMonth}
        />
        <UsageMeter
          label="Factures ce mois"
          current={subscription.currentUsage.invoicesThisMonth}
          max={subscription.limits.maxInvoicesPerMonth}
        />
      </div>

      {/* Feature List */}
      <Card>
        <CardHeader>
          <CardTitle>Fonctionnalités incluses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(subscription.limits.features).map(([feature, enabled]) => (
              <div key={feature} className="flex items-center gap-2">
                <span className={enabled ? 'text-green-600' : 'text-gray-400'}>
                  {enabled ? '✓' : '✗'}
                </span>
                <span className={!enabled ? 'text-gray-400' : ''}>
                  {formatFeatureName(feature)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```


***

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

- [ ] Database schema setup
- [ ] Organization \& Subscription models
- [ ] Basic limit enforcement service
- [ ] Admin panel for subscription management


### Phase 2: Core Limits (Week 3-4)

- [ ] Tenant creation limits
- [ ] User addition limits
- [ ] Transaction/invoice volume limits
- [ ] Usage tracking \& metrics


### Phase 3: Feature Gates (Week 5-6)

- [ ] Feature flag system
- [ ] Route protection middleware
- [ ] API endpoint guards
- [ ] UI conditional rendering


### Phase 4: Billing (Week 7-8)

- [ ] Pricing calculator
- [ ] Invoice generation
- [ ] Payment tracking (manual for Algeria)
- [ ] Renewal automation


### Phase 5: User Experience (Week 9-10)

- [ ] Upgrade prompts \& CTAs
- [ ] Usage dashboards
- [ ] Onboarding flows per plan
- [ ] Self-service plan changes

***

## Algerian Market Considerations

### Payment Methods (2026)

1. **CCP (Compte Courant Postal)** - Most common
2. **Bank Transfer** (Virement bancaire)
3. **Cash on Delivery** (for annual plans)
4. **Chargily/PayGate** (local payment gateways - if integrated)

### Legal Requirements

- Must issue **factures conformes** (compliant invoices) with TVA
- Electronic billing allowed since 2024
- Keep 10-year archive of customer invoices


### Marketing Strategy

- Free 14-day trial (no credit card required)
- Annual plans with 15-20% discount
- Referral program: 10% commission for accounting firms
- Educational content (webinars on SCF compliance)

***

## Summary

This multi-tier system balances:

- ✅ **Flexibility** for different customer segments
- ✅ **Scalability** from 1 to 100+ companies
- ✅ **Fair pricing** based on usage
- ✅ **Clear upgrade path** with value at each tier
- ✅ **Technical enforcement** to prevent abuse

**Recommended MVP Launch:** Start with STARTER + PROFESSIONAL only, add CABINET after 500 users.

Good luck building TOTALFisc! 🚀

