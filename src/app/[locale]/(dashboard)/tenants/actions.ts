'use server'

import { SubscriptionService } from '@/lib/services/subscription.service'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const createTenantSchema = z.object({
  name: z.string().min(2),
  fiscalId: z.string().optional()
})

export async function createTenant(data: z.infer<typeof createTenantSchema>) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !session.user.organizationId) {
      return { success: false, error: 'Unauthorized' }
    }

    const organizationId = session.user.organizationId

    // Check Tenants Limit
    const limitCheck = await SubscriptionService.canPerformAction(
      organizationId,
      'CREATE_TENANT'
    )
    if (!limitCheck.allowed) {
      return {
        success: false,
        error: limitCheck.reason || 'Tenant limit reached',
        upgradeRequired: limitCheck.upgradeRequired
      }
    }

    const { name, fiscalId } = createTenantSchema.parse(data)

    // Create Tenant
    const tenant = await prisma.tenant.create({
      data: {
        companyName: name,
        nif: fiscalId,
        organizationId,
        fiscalYear: new Date().getFullYear(),
        startDate: new Date(new Date().getFullYear(), 0, 1),
        endDate: new Date(new Date().getFullYear(), 11, 31)
      }
    })

    // Increment Usage
    await SubscriptionService.incrementUsage(organizationId, 'TENANT')

    revalidatePath('/tenants')
    return { success: true, data: tenant }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create tenant'
    }
  }
}
