'use server'

import { SubscriptionService } from '@/lib/services/subscription.service'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcrypt'

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  role: z.enum(['ADMIN', 'USER', 'VIEWER']),
  password: z.string().min(8)
})

export async function createUser(data: z.infer<typeof createUserSchema>) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !session.user.organizationId) {
      return { success: false, error: 'Unauthorized' }
    }

    const organizationId = session.user.organizationId

    // Check Users Limit
    const limitCheck = await SubscriptionService.canPerformAction(
      organizationId,
      'ADD_USER'
    )
    if (!limitCheck.allowed) {
      return {
        success: false,
        error: limitCheck.reason || 'User limit reached',
        upgradeRequired: limitCheck.upgradeRequired
      }
    }

    // Check Multi-User Feature
    const featureCheck = await SubscriptionService.hasFeature(
      organizationId,
      'multiUser'
    )
    if (!featureCheck) {
      return {
        success: false,
        error: 'Multi-user feature is not available in your plan',
        upgradeRequired: true
      }
    }

    const { email, name, role, password } = createUserSchema.parse(data)

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create User
    const user = await prisma.user.create({
      data: {
        email,
        name,
        role,
        password: hashedPassword,
        organizationId,
        tenantId: session.user.tenantId
      }
    })

    // Increment Usage
    await SubscriptionService.incrementUsage(organizationId, 'USER')

    revalidatePath('/users')
    return { success: true, data: user }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user'
    }
  }
}
