# Reporting

Balance report service and reconciliation (lettrage) service.

---

## Balance Report Service

```typescript
// lib/services/balance.service.ts

import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export interface BalanceRow {
  accountCode: string;
  accountLabel: string;
  openingDebit: Decimal;
  openingCredit: Decimal;
  movementDebit: Decimal;
  movementCredit: Decimal;
  totalDebit: Decimal;
  totalCredit: Decimal;
  balanceDebit: Decimal;
  balanceCredit: Decimal;
}

export interface BalanceFilters {
  tenantId: string;
  startDate: Date;
  endDate: Date;
  accountRange?: { from: string; to: string };
  journalIds?: string[];
  includeReconciled?: boolean;
  excludeZeroBalance?: boolean;
}

export class BalanceService {
  /**
   * Generate Balance Générale (6 columns)
   */
  static async generateBalance(filters: BalanceFilters): Promise<BalanceRow[]> {
    const { tenantId, startDate, endDate, accountRange, journalIds } = filters;

    // Build WHERE clause
    const whereClause: any = { tenantId };

    if (accountRange) {
      whereClause.account = {
        code: { gte: accountRange.from, lte: accountRange.to },
      };
    }

    if (filters.includeReconciled === false) {
      whereClause.isReconciled = false;
    }

    // Fetch all lines up to end date
    const lines = await prisma.transactionLine.findMany({
      where: {
        ...whereClause,
        piece: {
          date: { lte: endDate },
          ...(journalIds && journalIds.length > 0
            ? { journalId: { in: journalIds } }
            : {}),
        },
      },
      include: {
        account: true,
        piece: { include: { journal: true } },
      },
      orderBy: { account: { code: 'asc' } },
    });

    // Group by account and calculate
    const accountMap = new Map<string, BalanceRow>();

    for (const line of lines) {
      const accountCode = line.account.code;

      if (!accountMap.has(accountCode)) {
        accountMap.set(accountCode, {
          accountCode,
          accountLabel: line.account.label,
          openingDebit: new Decimal(0),
          openingCredit: new Decimal(0),
          movementDebit: new Decimal(0),
          movementCredit: new Decimal(0),
          totalDebit: new Decimal(0),
          totalCredit: new Decimal(0),
          balanceDebit: new Decimal(0),
          balanceCredit: new Decimal(0),
        });
      }

      const row = accountMap.get(accountCode)!;
      const isOpening = line.piece.journal.nature === 'ANOUV';
      const isInPeriod = line.piece.date >= startDate;

      if (isOpening) {
        row.openingDebit = row.openingDebit.add(line.debit);
        row.openingCredit = row.openingCredit.add(line.credit);
      }

      if (isInPeriod && !isOpening) {
        row.movementDebit = row.movementDebit.add(line.debit);
        row.movementCredit = row.movementCredit.add(line.credit);
      }

      row.totalDebit = row.openingDebit.add(row.movementDebit);
      row.totalCredit = row.openingCredit.add(row.movementCredit);

      const balance = row.totalDebit.minus(row.totalCredit);
      if (balance.greaterThan(0)) {
        row.balanceDebit = balance;
        row.balanceCredit = new Decimal(0);
      } else {
        row.balanceDebit = new Decimal(0);
        row.balanceCredit = balance.abs();
      }
    }

    let result = Array.from(accountMap.values());

    if (filters.excludeZeroBalance) {
      result = result.filter(
        (row) => !row.balanceDebit.equals(0) || !row.balanceCredit.equals(0)
      );
    }

    return result;
  }

  /**
   * Generate hierarchical balance with subtotals
   */
  static generateHierarchicalBalance(
    balance: BalanceRow[],
    levels: number[] = [1, 2, 3]
  ): BalanceRow[] {
    const result: BalanceRow[] = [];
    const subtotals = new Map<string, BalanceRow>();

    for (const row of balance) {
      result.push(row);

      for (const level of levels) {
        if (row.accountCode.length < level) continue;

        const prefix = row.accountCode.substring(0, level);
        const subtotalKey = `${prefix}${'*'.repeat(4 - level)}`;

        if (!subtotals.has(subtotalKey)) {
          subtotals.set(subtotalKey, {
            accountCode: subtotalKey,
            accountLabel: `Sous-total ${prefix}`,
            openingDebit: new Decimal(0),
            openingCredit: new Decimal(0),
            movementDebit: new Decimal(0),
            movementCredit: new Decimal(0),
            totalDebit: new Decimal(0),
            totalCredit: new Decimal(0),
            balanceDebit: new Decimal(0),
            balanceCredit: new Decimal(0),
          });
        }

        const subtotal = subtotals.get(subtotalKey)!;
        subtotal.openingDebit = subtotal.openingDebit.add(row.openingDebit);
        subtotal.openingCredit = subtotal.openingCredit.add(row.openingCredit);
        subtotal.movementDebit = subtotal.movementDebit.add(row.movementDebit);
        subtotal.movementCredit = subtotal.movementCredit.add(row.movementCredit);
        subtotal.totalDebit = subtotal.totalDebit.add(row.totalDebit);
        subtotal.totalCredit = subtotal.totalCredit.add(row.totalCredit);
        subtotal.balanceDebit = subtotal.balanceDebit.add(row.balanceDebit);
        subtotal.balanceCredit = subtotal.balanceCredit.add(row.balanceCredit);
      }
    }

    result.push(...Array.from(subtotals.values()));
    result.sort((a, b) => a.accountCode.localeCompare(b.accountCode));

    return result;
  }
}
```

---

## Reconciliation Service (Lettrage)

```typescript
// lib/services/reconciliation.service.ts

import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export class ReconciliationService {
  /**
   * Generate next lettrage code (A, B, C, ..., AA, AB, ...)
   */
  static async getNextLettrageCode(tenantId: string): Promise<string> {
    const lastReconciled = await prisma.transactionLine.findFirst({
      where: { tenantId, isReconciled: true },
      orderBy: { reconciliationCode: 'desc' },
      select: { reconciliationCode: true },
    });

    if (!lastReconciled || !lastReconciled.reconciliationCode) {
      return 'A';
    }

    return this.incrementCode(lastReconciled.reconciliationCode);
  }

  private static incrementCode(code: string): string {
    const chars = code.split('');
    let carry = true;

    for (let i = chars.length - 1; i >= 0 && carry; i--) {
      if (chars[i] === 'Z') {
        chars[i] = 'A';
      } else {
        chars[i] = String.fromCharCode(chars[i].charCodeAt(0) + 1);
        carry = false;
      }
    }

    if (carry) {
      chars.unshift('A');
    }

    return chars.join('');
  }

  /**
   * Reconcile transaction lines (Lettrage)
   */
  static async reconcile(
    lineIds: string[],
    tenantId: string,
    userId: string
  ): Promise<{ success: boolean; code?: string; error?: string }> {
    try {
      // Verify balance
      const lines = await prisma.transactionLine.findMany({
        where: { id: { in: lineIds }, tenantId },
        select: { debit: true, credit: true },
      });

      const totalDebit = lines.reduce((sum, l) => sum.add(l.debit), new Decimal(0));
      const totalCredit = lines.reduce((sum, l) => sum.add(l.credit), new Decimal(0));

      if (!totalDebit.equals(totalCredit)) {
        return {
          success: false,
          error: `Lines must balance. Debit: ${totalDebit.toFixed(2)}, Credit: ${totalCredit.toFixed(2)}`,
        };
      }

      // Generate code and update
      const code = await this.getNextLettrageCode(tenantId);
      const now = new Date();

      await prisma.$transaction(async (tx) => {
        await tx.transactionLine.updateMany({
          where: { id: { in: lineIds } },
          data: {
            reconciliationCode: code,
            isReconciled: true,
            reconciledAt: now,
          },
        });

        await tx.activityLog.create({
          data: {
            type: 'PIECE_UPDATED',
            description: `Reconciled ${lineIds.length} lines with code ${code}`,
            userId,
            tenantId,
            metadata: { lineIds, code },
          },
        });
      });

      return { success: true, code };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Remove reconciliation from lines
   */
  static async unreconcile(
    code: string,
    tenantId: string
  ): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
      const result = await prisma.transactionLine.updateMany({
        where: { tenantId, reconciliationCode: code },
        data: {
          reconciliationCode: null,
          isReconciled: false,
          reconciledAt: null,
        },
      });

      return { success: true, count: result.count };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
```

---

## Next Steps

- [Frontend Components](./08-frontend-components.md) - UI components
- [Deployment](./09-deployment.md) - Environment and deployment guide
