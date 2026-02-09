import { Decimal } from 'decimal.js';
import prisma from '@/lib/prisma';

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
    const difference = totalDebit.minus(totalCredit).abs();

    return {
      isValid: difference.lessThan(0.001), // Handle floating point precision
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
   * Ensures no entry is made before the date of the last entry in the same journal.
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

    if (debit.lessThanOrEqualTo(0) && credit.lessThanOrEqualTo(0)) {
      return {
        isValid: false,
        message: 'A line must have either a positive debit or credit amount',
      };
    }

    return { isValid: true };
  }
}
