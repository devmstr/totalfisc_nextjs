import prisma from '@/lib/prisma'
import {
  PricingPlan,
  SubscriptionStatus
} from '../../../prisma/generated/prisma/client'

export interface SubscriptionFeatures {
  coreAccounting: boolean
  invoiceManagement: boolean
  multiUser: boolean
  advancedReports: boolean
  liasseFiscale: boolean
  customBranding: boolean
  apiAccess: boolean
  multiEntity: boolean
  budgetForecasting: boolean
  prioritySupport: boolean
}

export const PLAN_CONFIGS = {
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
      prioritySupport: false
    }
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
      prioritySupport: true
    }
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
      prioritySupport: true
    }
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
      prioritySupport: true
    }
  }
}

export class SubscriptionService {
  /**
   * Get plan configuration
   */
  static getPlanConfig(plan: PricingPlan) {
    return PLAN_CONFIGS[plan as keyof typeof PLAN_CONFIGS]
  }

  /**
   * Check if action is allowed based on subscription limits
   */
  static async canPerformAction(
    organizationId: string,
    action:
      | 'CREATE_TENANT'
      | 'ADD_USER'
      | 'CREATE_TRANSACTION'
      | 'CREATE_INVOICE',
    additionalData?: any
  ): Promise<{ allowed: boolean; reason?: string; upgradeRequired?: boolean }> {
    // Get subscription
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId },
      include: {
        limits: true,
        currentUsage: true
      }
    })

    if (!subscription) {
      return { allowed: false, reason: 'No active subscription' }
    }

    // Check subscription status
    if (
      subscription.status !== SubscriptionStatus.ACTIVE &&
      subscription.status !== SubscriptionStatus.TRIAL
    ) {
      return {
        allowed: false,
        reason: 'Subscription is not active. Please update your payment method.'
      }
    }

    const limits = subscription.limits
    const usage = subscription.currentUsage

    if (!limits || !usage) {
      return { allowed: false, reason: 'Subscription limits not configured' }
    }

    // Check specific action
    switch (action) {
      case 'CREATE_TENANT':
        if (usage.currentTenants >= limits.maxTenants) {
          return {
            allowed: false,
            reason: `You have reached the limit of ${limits.maxTenants} ${limits.maxTenants === 1 ? 'company' : 'companies'} for your plan.`,
            upgradeRequired: true
          }
        }
        break

      case 'ADD_USER':
        if (usage.currentUsers >= limits.maxUsers) {
          return {
            allowed: false,
            reason: `You have reached the limit of ${limits.maxUsers} users for your plan.`,
            upgradeRequired: true
          }
        }

        // Check per-tenant user limit
        if (additionalData?.tenantId) {
          const tenantUsers = await prisma.user.count({
            where: { tenantId: additionalData.tenantId }
          })

          if (tenantUsers >= limits.maxUsersPerTenant) {
            return {
              allowed: false,
              reason: `This company has reached the limit of ${limits.maxUsersPerTenant} users.`,
              upgradeRequired: true
            }
          }
        }
        break

      case 'CREATE_TRANSACTION':
        if (usage.transactionsThisMonth >= limits.maxTransactionsPerMonth) {
          return {
            allowed: false,
            reason: `You have reached the limit of ${limits.maxTransactionsPerMonth} transactions this month.`,
            upgradeRequired: true
          }
        }
        break

      case 'CREATE_INVOICE':
        if (usage.invoicesThisMonth >= limits.maxInvoicesPerMonth) {
          return {
            allowed: false,
            reason: `You have reached the limit of ${limits.maxInvoicesPerMonth} invoices this month.`,
            upgradeRequired: true
          }
        }
        break
    }

    return { allowed: true }
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
      include: { limits: true }
    })

    if (!subscription || !subscription.limits) {
      return false
    }

    const features = subscription.limits
      .features as unknown as SubscriptionFeatures
    return features[feature] === true
  }

  /**
   * Increment usage counter
   */
  static async incrementUsage(
    organizationId: string,
    metric: 'TRANSACTION' | 'INVOICE' | 'API_CALL' | 'USER' | 'TENANT'
  ): Promise<void> {
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId },
      select: { id: true }
    })

    if (!subscription) return

    const updateData: any = {}

    switch (metric) {
      case 'TRANSACTION':
        updateData.transactionsThisMonth = { increment: 1 }
        break
      case 'INVOICE':
        updateData.invoicesThisMonth = { increment: 1 }
        break
      case 'API_CALL':
        updateData.apiCallsThisMonth = { increment: 1 }
        break
      case 'USER':
        updateData.currentUsers = { increment: 1 }
        break
      case 'TENANT':
        updateData.currentTenants = { increment: 1 }
        break
    }

    await prisma.usageMetrics.update({
      where: { subscriptionId: subscription.id },
      data: updateData
    })
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
        lastResetAt: new Date()
      }
    })
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
        currentUsage: true
      }
    })

    if (!subscription || !subscription.limits || !subscription.currentUsage) {
      return 0
    }

    const { limits, currentUsage, plan } = subscription

    if (plan !== 'CABINET') {
      return 0 // Only Cabinet plan has overage pricing
    }

    let additionalCost = 0

    // Additional tenants
    if (currentUsage.currentTenants > 15) {
      additionalCost += (currentUsage.currentTenants - 15) * 1490
    }

    // Additional users
    if (currentUsage.currentUsers > 15) {
      additionalCost += (currentUsage.currentUsers - 15) * 990
    }

    // Additional storage
    const storageGB = currentUsage.storageUsedGB.toNumber()
    if (storageGB > limits.maxStorageGB) {
      const extraGB = Math.ceil(storageGB - limits.maxStorageGB)
      additionalCost += extraGB * 299 // 299 DA per GB
    }

    return additionalCost
  }

  /**
   * Create or update subscription limits based on plan
   */
  static async syncLimitsWithPlan(subscriptionId: string): Promise<void> {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId }
    })

    if (!subscription) return

    const config = this.getPlanConfig(subscription.plan)

    await prisma.subscriptionLimits.upsert({
      where: { subscriptionId },
      create: {
        subscriptionId,
        maxTenants: config.maxTenants,
        maxUsers: config.maxUsers,
        maxUsersPerTenant: config.maxUsersPerTenant,
        maxTransactionsPerMonth: config.maxTransactionsPerMonth,
        maxInvoicesPerMonth: config.maxInvoicesPerMonth,
        maxAuxiliaries: config.maxAuxiliaries,
        maxStorageGB: config.maxStorageGB,
        features: config.features as any
      },
      update: {
        maxTenants: config.maxTenants,
        maxUsers: config.maxUsers,
        maxUsersPerTenant: config.maxUsersPerTenant,
        maxTransactionsPerMonth: config.maxTransactionsPerMonth,
        maxInvoicesPerMonth: config.maxInvoicesPerMonth,
        maxAuxiliaries: config.maxAuxiliaries,
        maxStorageGB: config.maxStorageGB,
        features: config.features as any
      }
    })
  }
}
