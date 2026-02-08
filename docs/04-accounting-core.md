# Accounting Core

Core accounting validation and transaction entry logic.

---

## 1. Accounting Validation Service

```typescript
// lib/validations/accounting.ts

import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '@/lib/prisma';

export class AccountingValidator {
  /**
   * Validates that a piece is balanced (Debit = Credit)
   */
  static validateBalance(lines: Array<{ debit: Decimal; credit: Decimal }>): {
    isValid: boolean;
    totalDebit: Decimal;
    totalCredit: Decimal;
    difference: Decimal;
  } {
    const totalDebit = lines.reduce(
      (sum, line) => sum.add(line.debit),
      new Decimal(0)
    );
    const totalCredit = lines.reduce(
      (sum, line) => sum.add(line.credit),
      new Decimal(0)
    );
    const difference = totalDebit.minus(totalCredit);

    return {
      isValid: difference.equals(0),
      totalDebit,
      totalCredit,
      difference,
    };
  }

  /**
   * Validates that auxiliary is provided when required by account
   */
  static async validateAuxiliaryRequirement(
    accountCode: string,
    auxiliaryId: string | null,
    tenantId: string
  ): Promise<{ isValid: boolean; message?: string }> {
    const account = await prisma.account.findUnique({
      where: { 
        tenantId_code: { tenantId, code: accountCode }
      },
      select: { isAuxiliaryRequired: true },
    });

    if (!account) {
      return { isValid: false, message: 'Account not found' };
    }

    if (account.isAuxiliaryRequired && !auxiliaryId) {
      return {
        isValid: false,
        message: `Account ${accountCode} requires an auxiliary`,
      };
    }

    return { isValid: true };
  }

  /**
   * Validates chronological order within journal
   */
  static async validateChronologicalOrder(
    journalId: string,
    newDate: Date
  ): Promise<{ isValid: boolean; message?: string }> {
    const lastPiece = await prisma.piece.findFirst({
      where: { journalId },
      orderBy: { date: 'desc' },
      select: { date: true, pieceNumber: true },
    });

    if (lastPiece && new Date(lastPiece.date) > newDate) {
      return {
        isValid: false,
        message: `Date cannot be before last entry (${lastPiece.pieceNumber})`,
      };
    }

    return { isValid: true };
  }

  /**
   * Validates that all lines in a piece have consistent metadata
   */
  static validatePieceConsistency(
    lines: Array<{ date: Date; reference: string | null }>
  ): { isValid: boolean; message?: string } {
    if (lines.length === 0) {
      return { isValid: false, message: 'Piece must have at least one line' };
    }

    if (lines.length === 1) {
      return { isValid: false, message: 'Piece must have at least two lines (double-entry)' };
    }

    const firstLine = lines[0];
    const inconsistent = lines.some(
      (line) =>
        line.date.getTime() !== firstLine.date.getTime() ||
        line.reference !== firstLine.reference
    );

    if (inconsistent) {
      return {
        isValid: false,
        message: 'All lines must have the same date and reference',
      };
    }

    return { isValid: true };
  }

  /**
   * Validates that debit and credit are not both set on same line
   */
  static validateLineAmounts(
    debit: Decimal,
    credit: Decimal
  ): { isValid: boolean; message?: string } {
    if (debit.greaterThan(0) && credit.greaterThan(0)) {
      return {
        isValid: false,
        message: 'A line cannot have both debit and credit amounts',
      };
    }

    if (debit.equals(0) && credit.equals(0)) {
      return {
        isValid: false,
        message: 'A line must have either debit or credit amount',
      };
    }

    return { isValid: true };
  }
}
```

---

## 2. Transaction Entry Server Actions

### Create Piece

```typescript
// app/(dashboard)/journals/[id]/pieces/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { AccountingValidator } from '@/lib/validations/accounting';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';
import { auth } from '@/lib/auth';

const transactionLineSchema = z.object({
  lineNumber: z.number().int().positive(),
  accountCode: z.string().min(1).max(14),
  auxiliaryId: z.string().optional(),
  costCenterId: z.string().optional(),
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
      isInvestment: z.boolean().default(false),
    })
    .optional(),
});

const createPieceSchema = z.object({
  journalId: z.string().cuid(),
  date: z.coerce.date(),
  reference: z.string().optional(),
  lines: z.array(transactionLineSchema).min(2),
});

export async function createPiece(
  data: z.infer<typeof createPieceSchema>
) {
  try {
    // 1. Get authenticated user and tenant
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tenantId: true },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const tenantId = user.tenantId;

    // 2. Validate input
    const validated = createPieceSchema.parse(data);

    // 3. Validate balance
    const balanceCheck = AccountingValidator.validateBalance(
      validated.lines.map((l) => ({
        debit: new Decimal(l.debit),
        credit: new Decimal(l.credit),
      }))
    );

    if (!balanceCheck.isValid) {
      return {
        success: false,
        error: `Transaction is not balanced. Difference: ${balanceCheck.difference.toFixed(2)}`,
      };
    }

    // 4. Validate chronological order
    const chronoCheck = await AccountingValidator.validateChronologicalOrder(
      validated.journalId,
      validated.date
    );

    if (!chronoCheck.isValid) {
      return { success: false, error: chronoCheck.message };
    }

    // 5. Validate line amounts
    for (const line of validated.lines) {
      const amountCheck = AccountingValidator.validateLineAmounts(
        new Decimal(line.debit),
        new Decimal(line.credit)
      );
      if (!amountCheck.isValid) {
        return { success: false, error: amountCheck.message };
      }
    }

    // 6. Get next piece number
    const lastPiece = await prisma.piece.findFirst({
      where: { journalId: validated.journalId },
      orderBy: { pieceNumber: 'desc' },
      select: { pieceNumber: true },
    });

    const nextNumber = lastPiece
      ? String(parseInt(lastPiece.pieceNumber) + 1).padStart(5, '0')
      : '00001';

    // 7. Create piece with lines in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create piece
      const piece = await tx.piece.create({
        data: {
          pieceNumber: nextNumber,
          date: validated.date,
          reference: validated.reference,
          journalId: validated.journalId,
        },
      });

      // Create lines
      const linePromises = validated.lines.map(async (line) => {
        const account = await tx.account.findUnique({
          where: { tenantId_code: { tenantId, code: line.accountCode } },
          select: { id: true, isAuxiliaryRequired: true },
        });

        if (!account) {
          throw new Error(`Account ${line.accountCode} not found`);
        }

        if (account.isAuxiliaryRequired && !line.auxiliaryId) {
          throw new Error(`Account ${line.accountCode} requires auxiliary`);
        }

        return tx.transactionLine.create({
          data: {
            lineNumber: line.lineNumber,
            pieceId: piece.id,
            accountId: account.id,
            auxiliaryId: line.auxiliaryId,
            costCenterId: line.costCenterId,
            label: line.label,
            debit: line.debit,
            credit: line.credit,
            tenantId,
            ...line.fiscalTags,
          },
        });
      });

      await Promise.all(linePromises);

      // Log activity
      await tx.activityLog.create({
        data: {
          type: 'PIECE_CREATED',
          description: `Created piece ${nextNumber}`,
          userId: session.user.id,
          entityType: 'PIECE',
          entityId: piece.id,
          tenantId,
        },
      });

      return piece;
    });

    revalidatePath(`/journals/${validated.journalId}`);

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to create piece:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

### Update Piece

```typescript
export async function updatePiece(
  pieceId: string,
  data: z.infer<typeof createPieceSchema>
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tenantId: true },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const tenantId = user.tenantId;
    const validated = createPieceSchema.parse(data);

    // Validate balance
    const balanceCheck = AccountingValidator.validateBalance(
      validated.lines.map((l) => ({
        debit: new Decimal(l.debit),
        credit: new Decimal(l.credit),
      }))
    );

    if (!balanceCheck.isValid) {
      return {
        success: false,
        error: `Transaction is not balanced. Difference: ${balanceCheck.difference.toFixed(2)}`,
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      // Delete existing lines
      await tx.transactionLine.deleteMany({
        where: { pieceId },
      });

      // Update piece
      const piece = await tx.piece.update({
        where: { id: pieceId },
        data: {
          date: validated.date,
          reference: validated.reference,
        },
      });

      // Create new lines
      const linePromises = validated.lines.map(async (line) => {
        const account = await tx.account.findUnique({
          where: { tenantId_code: { tenantId, code: line.accountCode } },
          select: { id: true, isAuxiliaryRequired: true },
        });

        if (!account) {
          throw new Error(`Account ${line.accountCode} not found`);
        }

        if (account.isAuxiliaryRequired && !line.auxiliaryId) {
          throw new Error(`Account ${line.accountCode} requires auxiliary`);
        }

        return tx.transactionLine.create({
          data: {
            lineNumber: line.lineNumber,
            pieceId: piece.id,
            accountId: account.id,
            auxiliaryId: line.auxiliaryId,
            costCenterId: line.costCenterId,
            label: line.label,
            debit: line.debit,
            credit: line.credit,
            tenantId,
            ...line.fiscalTags,
          },
        });
      });

      await Promise.all(linePromises);

      // Log activity
      await tx.activityLog.create({
        data: {
          type: 'PIECE_UPDATED',
          description: `Updated piece ${piece.pieceNumber}`,
          userId: session.user.id,
          entityType: 'PIECE',
          entityId: piece.id,
          tenantId,
        },
      });

      return piece;
    });

    revalidatePath(`/journals/${validated.journalId}`);
    revalidatePath(`/journals/${validated.journalId}/pieces/${pieceId}`);

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update piece:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

### Delete Piece

```typescript
export async function deletePiece(pieceId: string, journalId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tenantId: true },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    await prisma.$transaction(async (tx) => {
      const piece = await tx.piece.delete({
        where: { id: pieceId },
      });

      await tx.activityLog.create({
        data: {
          type: 'PIECE_DELETED',
          description: `Deleted piece ${piece.pieceNumber}`,
          userId: session.user.id,
          entityType: 'PIECE',
          entityId: piece.id,
          tenantId: user.tenantId,
        },
      });
    });

    revalidatePath(`/journals/${journalId}`);

    return { success: true };
  } catch (error) {
    console.error('Failed to delete piece:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

---

## Next Steps

- [Security](./05-security.md) - Authentication & authorization
- [Invoicing](./06-invoicing.md) - Invoice service and PDF generation
- [Reporting](./07-reporting.md) - Balance and reconciliation services
