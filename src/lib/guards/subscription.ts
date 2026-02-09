import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  SubscriptionService,
  SubscriptionFeatures
} from '@/lib/services/subscription.service'

export async function requireFeature(feature: keyof SubscriptionFeatures) {
  return async (req: Request) => {
    const session = await auth()

    // @ts-ignore - organizationId is added to session
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // @ts-ignore
    const hasFeature = await SubscriptionService.hasFeature(
      session.user.organizationId,
      feature
    )

    if (!hasFeature) {
      return NextResponse.json(
        {
          error: 'Feature not available',
          message: `This feature requires an upgrade. Please contact support.`,
          upgradeUrl: '/settings/subscription'
        },
        { status: 403 }
      )
    }

    return null // Allow
  }
}

export async function checkLimit(
  action:
    | 'CREATE_TENANT'
    | 'ADD_USER'
    | 'CREATE_TRANSACTION'
    | 'CREATE_INVOICE',
  additionalData?: any
) {
  return async (req: Request) => {
    const session = await auth()

    // @ts-ignore
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // @ts-ignore
    const check = await SubscriptionService.canPerformAction(
      session.user.organizationId,
      action,
      additionalData
    )

    if (!check.allowed) {
      return NextResponse.json(
        {
          error: 'Limit reached',
          message: check.reason,
          upgradeRequired: check.upgradeRequired,
          upgradeUrl: '/settings/subscription'
        },
        { status: 403 }
      )
    }

    return null // Allow
  }
}
