'use server'

import prisma from '@/lib/prisma'
import { SubscriptionService } from '@/lib/services/subscription.service'
import { AccountingValidator } from '@/lib/validations/accounting'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { Decimal } from 'decimal.js'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// Schema definition (moved to top for clarity if needed, but keeping original structure is better if I can)
const transactionLineSchema = z.object({
  lineNumber: z.number().int().positive(),
  accountCode: z.string().min(1).max(14),
  auxiliaryId: z.string().optional().nullable(),
  costCenterId: z.string().optional().nullable(),
  label: z.string().min(1),
  debit: z.number().nonnegative(),
  credit: z.number().nonnegative(),
  fiscalTags: z
    .object({
      isExportProduct: z.boolean().default(false),
      isDeductibleCharge: z.boolean().default(false),
      isNonDeductibleCharge: z.boolean().default(false),
      isFiscalDepreciation: z.boolean().default(false),
      isAccountingDepreciation: z.boolean().default(false),
      isInvestment: z.boolean().default(false)
    })
    .optional()
})

const createPieceSchema = z.object({
  journalId: z.string(),
  date: z.coerce.date(),
  reference: z.string().optional().nullable(),
  lines: z.array(transactionLineSchema).min(2)
})

export async function createPiece(data: z.infer<typeof createPieceSchema>) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const tenantId = session.user.tenantId

    // Subscription Limit Check
    if (session.user.organizationId) {
      const limitCheck = await SubscriptionService.canPerformAction(
        session.user.organizationId,
        'CREATE_TRANSACTION'
      )

      if (!limitCheck.allowed) {
        return {
          success: false,
          error: limitCheck.reason || 'Transaction limit reached',
          upgradeRequired: limitCheck.upgradeRequired
        }
      }
    }

    // 2. Validate input
    const validated = createPieceSchema.parse(data)

    // 3. Validate balance
    const balanceCheck = AccountingValidator.validateBalance(
      validated.lines.map((l) => ({
        debit: new Decimal(l.debit),
        credit: new Decimal(l.credit)
      }))
    )

    if (!balanceCheck.isValid) {
      return {
        success: false,
        error: `Transaction is not balanced. Difference: ${balanceCheck.difference.toFixed(2)}`
      }
    }

    // 4. Validate chronological order
    const chronoCheck = await AccountingValidator.validateChronologicalOrder(
      validated.journalId,
      validated.date
    )

    if (!chronoCheck.isValid) {
      return { success: false, error: chronoCheck.message }
    }

    // 5. Line-by-line validation
    for (const line of validated.lines) {
      const amountCheck = AccountingValidator.validateLineAmounts(
        new Decimal(line.debit),
        new Decimal(line.credit)
      )
      if (!amountCheck.isValid) {
        return { success: false, error: amountCheck.message }
      }
    }

    // 6. Get next piece number
    const lastPiece = await prisma.piece.findFirst({
      where: { journalId: validated.journalId },
      orderBy: { pieceNumber: 'desc' },
      select: { pieceNumber: true }
    })

    const nextNumber = lastPiece
      ? String(parseInt(lastPiece.pieceNumber) + 1).padStart(5, '0')
      : '00001'

    // 7. Atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      const piece = await tx.piece.create({
        data: {
          pieceNumber: nextNumber,
          date: validated.date,
          reference: validated.reference || undefined,
          journalId: validated.journalId,
          tenantId: tenantId
        }
      })

      for (const line of validated.lines) {
        const account = await tx.account.findUnique({
          where: { tenantId_code: { tenantId, code: line.accountCode } },
          select: { id: true, isAuxiliaryRequired: true }
        })

        if (!account) {
          throw new Error(`Account ${line.accountCode} not found`)
        }

        if (account.isAuxiliaryRequired && !line.auxiliaryId) {
          throw new Error(`Account ${line.accountCode} requires auxiliary`)
        }

        await tx.transactionLine.create({
          data: {
            lineNumber: line.lineNumber,
            pieceId: piece.id,
            accountId: account.id,
            auxiliaryId: line.auxiliaryId || undefined,
            costCenterId: line.costCenterId || undefined,
            label: line.label,
            debit: line.debit,
            credit: line.credit,
            tenantId,
            ...(line.fiscalTags || {})
          }
        })
      }

      await tx.activityLog.create({
        data: {
          type: 'PIECE_CREATED',
          description: `Created piece ${nextNumber}`,
          userId: session.user.id,
          entityType: 'PIECE',
          entityId: piece.id,
          tenantId
        }
      })

      // Increment Usage
      if (session.user.organizationId) {
        await SubscriptionService.incrementUsage(
          session.user.organizationId,
          'TRANSACTION'
        )
      }

      return piece
    })

    revalidatePath(`/journals/${validated.journalId}`)
    return { success: true, data: result }
  } catch (error) {
    console.error('Failed to create piece:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function updatePiece(
  pieceId: string,
  data: z.infer<typeof createPieceSchema>
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' }

    const tenantId = session.user.tenantId
    const validated = createPieceSchema.parse(data)

    // Validate balance
    const balanceCheck = AccountingValidator.validateBalance(
      validated.lines.map((l) => ({
        debit: new Decimal(l.debit),
        credit: new Decimal(l.credit)
      }))
    )

    if (!balanceCheck.isValid) {
      return {
        success: false,
        error: `Unbalanced: ${balanceCheck.difference.toFixed(2)}`
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Security check: ensure piece belongs to tenant
      const existingPiece = await tx.piece.findUnique({
        where: { id: pieceId, tenantId }
      })
      if (!existingPiece) throw new Error('Piece not found or unauthorized')

      // Delete existing lines
      await tx.transactionLine.deleteMany({ where: { pieceId } })

      // Update piece
      const piece = await tx.piece.update({
        where: { id: pieceId },
        data: {
          date: validated.date,
          reference: validated.reference
        }
      })

      // Create new lines
      for (const line of validated.lines) {
        const account = await tx.account.findUnique({
          where: { tenantId_code: { tenantId, code: line.accountCode } },
          select: { id: true, isAuxiliaryRequired: true }
        })

        if (!account) throw new Error(`Account ${line.accountCode} missing`)
        if (account.isAuxiliaryRequired && !line.auxiliaryId)
          throw new Error(`Auxiliary required for ${line.accountCode}`)

        await tx.transactionLine.create({
          data: {
            lineNumber: line.lineNumber,
            pieceId: piece.id,
            accountId: account.id,
            auxiliaryId: line.auxiliaryId || undefined,
            costCenterId: line.costCenterId || undefined,
            label: line.label,
            debit: line.debit,
            credit: line.credit,
            tenantId,
            ...(line.fiscalTags || {})
          }
        })
      }

      await tx.activityLog.create({
        data: {
          type: 'PIECE_UPDATED',
          description: `Updated piece ${piece.pieceNumber}`,
          userId: session.user.id,
          entityType: 'PIECE',
          entityId: piece.id,
          tenantId
        }
      })

      return piece
    })

    revalidatePath(`/journals/${validated.journalId}`)
    return { success: true, data: result }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Update failed'
    }
  }
}

export async function deletePiece(pieceId: string, journalId: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' }

    await prisma.$transaction(async (tx) => {
      const piece = await tx.piece.findUnique({
        where: { id: pieceId, tenantId: session.user.tenantId },
        select: { pieceNumber: true, tenantId: true }
      })

      if (!piece) throw new Error('Piece not found')

      await tx.piece.delete({ where: { id: pieceId } })

      await tx.activityLog.create({
        data: {
          type: 'PIECE_DELETED',
          description: `Deleted piece ${piece.pieceNumber}`,
          userId: session.user.id,
          entityType: 'PIECE',
          entityId: pieceId,
          tenantId: session.user.tenantId
        }
      })
    })

    revalidatePath(`/journals/${journalId}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to delete piece' }
  }
}
