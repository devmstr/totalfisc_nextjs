<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Timbre Fiscal (Stamp Duty) - Complete Algerian Tax Calculation Guide

## Overview

**Timbre Fiscal** (stamp duty) is an indirect tax applied to commercial documents, invoices, and receipts in Algeria. It's calculated on the **total TTC (Toutes Taxes Comprises)** amount of the transaction.[^1][^2]

***

## Current Regulations (2025-2026)

### Legal Framework

**Source:** Law of Finance 2025 (Article 100) - Official Journal dated December 26, 2024[^3][^2]

**Key Changes:**

- **2023:** Maximum stamp increased from 2,500 DA to 10,000 DA[^4]
- **2025:** New threshold system implemented, exemption for electronic payments[^2]

***

## Calculation Rules

### Thresholds and Rates

| Amount Range (TTC) | Rate | Method |
| :-- | :-- | :-- |
| **≤ 300 DA** | **Exempt** | No stamp duty [^1][^5] |
| **301 - 30,000 DA** | **1%** | Per 100 DA tranche or fraction [^3][^2] |
| **30,001 - 100,000 DA** | **1.5%** | Per 100 DA tranche or fraction [^3][^2] |
| **> 100,000 DA** | **2%** | Per 100 DA tranche or fraction [^3][^5] |

### Important Limits

- ✅ **Minimum:** 5 DA[^3][^1][^2]
- ✅ **Maximum:** 10,000 DA[^6][^1][^4]
- ✅ **Exemption:** Electronic/bank payments[^2]

***

## Calculation Methods

### Official Method (Recommended)

**Formula:** Calculate per 100 DA tranche or fraction of tranche[^5][^3]

```typescript
// Step 1: Calculate number of tranches
tranches = Math.ceil(amountTTC / 100)

// Step 2: Apply rate based on amount
if (amountTTC <= 300) {
  stamp = 0  // Exempt
} else if (amountTTC <= 30000) {
  stamp = tranches * 1.00  // 1 DA per tranche
} else if (amountTTC <= 100000) {
  stamp = tranches * 1.50  // 1.5 DA per tranche
} else {
  stamp = tranches * 2.00  // 2 DA per tranche
}

// Step 3: Apply minimum/maximum
if (stamp > 0 && stamp < 5) {
  stamp = 5
}
if (stamp > 10000) {
  stamp = 10000
}
```


### Simplified Percentage Method (Alternative)

Some interpretations use direct percentage calculation:[^1]

```typescript
if (amountTTC <= 300) {
  stamp = 0
} else if (amountTTC <= 30000) {
  stamp = Math.ceil(amountTTC * 0.01)  // 1%
} else if (amountTTC <= 100000) {
  stamp = Math.ceil(amountTTC * 0.015)  // 1.5%
} else {
  stamp = Math.ceil(amountTTC * 0.02)  // 2%
}

// Apply minimum/maximum
stamp = Math.max(5, Math.min(10000, stamp))
```

**Note:** Both methods give nearly identical results (difference of ~0.004%)[^3]

***

## Calculation Examples

### Example 1: Small Invoice (1,000 DA)

**Method 1 (Tranches):**

```
Amount: 1,000 DA
Tranches: 1000 / 100 = 10 tranches
Rate: 1 DA per tranche (amount < 30,000)
Stamp: 10 × 1 = 10 DA ✓
```

**Method 2 (Percentage):**

```
Amount: 1,000 DA
Rate: 1%
Stamp: 1000 × 1% = 10 DA ✓
```


### Example 2: Medium Invoice (11,900 DA)

**Method 1 (Tranches):**

```
Amount: 11,900 DA
Tranches: 11900 / 100 = 119 tranches
Rate: 1 DA per tranche
Stamp: 119 × 1 = 119 DA ✓
```

**Method 2 (Percentage):**

```
Amount: 11,900 DA
Rate: 1%
Stamp: 11900 × 1% = 119 DA ✓
```


### Example 3: Large Invoice (31,010 DA)

**Method 1 (Tranches):**

```
Amount: 31,010 DA
Tranches: 31010 / 100 = 310.1 → 311 tranches (rounded up)
Rate: 1.5 DA per tranche (30,000 < amount < 100,000)
Stamp: 311 × 1.5 = 466.5 → 467 DA (rounded up) ✓
```

**Method 2 (Percentage):**

```
Amount: 31,010 DA
Rate: 1.5%
Stamp: 31010 × 1.5% = 465.15 → 466 DA (rounded up) ✓
```


### Example 4: Very Large Invoice (150,000 DA)

**Method 1 (Tranches):**

```
Amount: 150,000 DA
Tranches: 150000 / 100 = 1,500 tranches
Rate: 2 DA per tranche (amount > 100,000)
Stamp: 1500 × 2 = 3,000 DA ✓
```

**Method 2 (Percentage):**

```
Amount: 150,000 DA
Rate: 2%
Stamp: 150000 × 2% = 3,000 DA ✓
```


### Example 5: Minimum Threshold (250 DA)

```
Amount: 250 DA
Stamp: 0 DA (Exempt - below 300 DA threshold) ✓
```


### Example 6: Minimum Applied (450 DA)

**Method 1:**

```
Amount: 450 DA
Tranches: 450 / 100 = 4.5 → 5 tranches
Stamp: 5 × 1 = 5 DA
Minimum check: max(5, 5) = 5 DA ✓
```


### Example 7: Maximum Cap (10,000,000 DA)

**Method 1:**

```
Amount: 10,000,000 DA
Tranches: 10000000 / 100 = 100,000 tranches
Stamp calculated: 100000 × 2 = 200,000 DA
Maximum applied: min(200000, 10000) = 10,000 DA ✓
```


***

## Implementation in TOTALFisc

### Database Schema Addition

```prisma
// Add to Invoice model in schema.prisma

model Invoice {
  // ... existing fields ...
  
  // Stamp duty calculation
  timbreFiscal    Decimal      @default(0) @db.Decimal(15, 2)
  isTimbreExempt  Boolean      @default(false)  // Electronic payment exemption
  
  // ... rest of fields ...
}
```


### TypeScript Service

```typescript
// lib/services/timbre-fiscal.service.ts

import { Decimal } from '@prisma/client/runtime/library';

export class TimbreFiscalService {
  /**
   * Calculate Timbre Fiscal (Stamp Duty) according to Algerian law 2025
   * 
   * @param amountTTC - Total amount including all taxes (TTC)
   * @param isElectronicPayment - If true, exempt from stamp duty
   * @returns Calculated stamp duty amount
   */
  static calculate(
    amountTTC: Decimal,
    isElectronicPayment: boolean = false
  ): Decimal {
    // Electronic payments are exempt
    if (isElectronicPayment) {
      return new Decimal(0);
    }

    const amount = amountTTC.toNumber();

    // Below 300 DA: exempt
    if (amount <= 300) {
      return new Decimal(0);
    }

    // Calculate number of 100 DA tranches (rounded up)
    const tranches = Math.ceil(amount / 100);

    let stamp: number;

    // Apply rate based on threshold
    if (amount <= 30000) {
      // 1 DA per tranche
      stamp = tranches * 1.0;
    } else if (amount <= 100000) {
      // 1.5 DA per tranche
      stamp = tranches * 1.5;
    } else {
      // 2 DA per tranche
      stamp = tranches * 2.0;
    }

    // Apply minimum of 5 DA
    if (stamp < 5) {
      stamp = 5;
    }

    // Apply maximum of 10,000 DA
    if (stamp > 10000) {
      stamp = 10000;
    }

    // Round to nearest integer (banker's rounding)
    stamp = Math.round(stamp);

    return new Decimal(stamp);
  }

  /**
   * Alternative simplified percentage method
   */
  static calculatePercentage(
    amountTTC: Decimal,
    isElectronicPayment: boolean = false
  ): Decimal {
    if (isElectronicPayment) {
      return new Decimal(0);
    }

    const amount = amountTTC.toNumber();

    if (amount <= 300) {
      return new Decimal(0);
    }

    let stamp: number;

    if (amount <= 30000) {
      stamp = amount * 0.01; // 1%
    } else if (amount <= 100000) {
      stamp = amount * 0.015; // 1.5%
    } else {
      stamp = amount * 0.02; // 2%
    }

    // Round up to nearest integer
    stamp = Math.ceil(stamp);

    // Apply minimum and maximum
    stamp = Math.max(5, Math.min(10000, stamp));

    return new Decimal(stamp);
  }

  /**
   * Get explanation of stamp calculation
   */
  static getCalculationExplanation(amountTTC: Decimal): string {
    const amount = amountTTC.toNumber();

    if (amount <= 300) {
      return 'Montant ≤ 300 DA : Exonéré de timbre fiscal';
    }

    const tranches = Math.ceil(amount / 100);
    let rate: number;
    let rateText: string;

    if (amount <= 30000) {
      rate = 1.0;
      rateText = '1 DA par tranche';
    } else if (amount <= 100000) {
      rate = 1.5;
      rateText = '1,5 DA par tranche';
    } else {
      rate = 2.0;
      rateText = '2 DA par tranche';
    }

    const calculated = tranches * rate;
    const final = Math.max(5, Math.min(10000, calculated));

    return `${tranches} tranches × ${rateText} = ${calculated.toFixed(2)} DA → Timbre fiscal: ${final} DA`;
  }

  /**
   * Validate if amount qualifies for exemption
   */
  static isExempt(amountTTC: Decimal, isElectronicPayment: boolean): boolean {
    return isElectronicPayment || amountTTC.lessThanOrEqualTo(300);
  }
}
```


### Updated Invoice Service

```typescript
// lib/services/invoice.service.ts (update)

import { TimbreFiscalService } from './timbre-fiscal.service';

export class InvoiceService {
  static async createInvoice(
    tenantId: string,
    data: CreateInvoiceInput
  ): Promise<Invoice & { items: InvoiceItem[] }> {
    // ... existing code ...

    const totalAmount = subtotal.add(taxAmount).minus(discountAmount);

    // Calculate Timbre Fiscal
    const timbreFiscal = TimbreFiscalService.calculate(
      totalAmount,
      false // Set to true if electronic payment
    );

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        // ... existing fields ...
        totalAmount,
        timbreFiscal,
        isTimbreExempt: timbreFiscal.equals(0),
        // ... rest of fields ...
      },
      include: {
        items: true,
      },
    });

    return invoice;
  }
}
```


### UI Component for Invoice

```tsx
// components/invoices/invoice-totals.tsx

interface InvoiceTotalsProps {
  subtotal: Decimal;
  taxAmount: Decimal;
  discountAmount: Decimal;
  totalAmount: Decimal;
  timbreFiscal: Decimal;
}

export function InvoiceTotals({
  subtotal,
  taxAmount,
  discountAmount,
  totalAmount,
  timbreFiscal,
}: InvoiceTotalsProps) {
  const grandTotal = totalAmount.add(timbreFiscal);

  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span>Sous-total (HT)</span>
        <span>{subtotal.toFixed(2)} DA</span>
      </div>

      {discountAmount.greaterThan(0) && (
        <div className="flex justify-between text-red-600">
          <span>Remise</span>
          <span>-{discountAmount.toFixed(2)} DA</span>
        </div>
      )}

      <div className="flex justify-between">
        <span>TVA (19%)</span>
        <span>{taxAmount.toFixed(2)} DA</span>
      </div>

      <div className="flex justify-between border-t pt-2">
        <span>Total (TTC)</span>
        <span>{totalAmount.toFixed(2)} DA</span>
      </div>

      {/* Timbre Fiscal */}
      <div className="flex justify-between text-sm text-gray-600">
        <span className="flex items-center gap-2">
          Timbre Fiscal
          <InfoIcon 
            title={TimbreFiscalService.getCalculationExplanation(totalAmount)} 
          />
        </span>
        <span>{timbreFiscal.toFixed(2)} DA</span>
      </div>

      <div className="flex justify-between font-bold text-lg border-t-2 pt-2">
        <span>Total à payer</span>
        <span>{grandTotal.toFixed(2)} DA</span>
      </div>
    </div>
  );
}
```


### Accounting Entry Integration

```typescript
// When posting invoice to accounting, include Timbre Fiscal

const piece = await tx.piece.create({
  data: {
    // ... existing fields ...
    lines: {
      create: [
        // Customer debit (includes timbre)
        {
          lineNumber: 1,
          accountId: clientAccount.id,
          label: `Facture ${invoice.invoiceNumber}`,
          debit: invoice.totalAmount.add(invoice.timbreFiscal), // Include stamp
          credit: 0,
          tenantId,
        },
        // Revenue lines...
        // TVA line...
        // Timbre Fiscal line
        {
          lineNumber: invoice.items.length + 3,
          accountId: timbreAccount.id, // Account 644000 - Droits de timbre
          label: `Timbre fiscal ${invoice.invoiceNumber}`,
          debit: 0,
          credit: invoice.timbreFiscal,
          tenantId,
        },
      ],
    },
  },
});
```


***

## Chart of Accounts Integration

### Recommended Account

```typescript
// Account for Timbre Fiscal
{
  code: "644000",
  label: "Droits de timbre",
  type: "EXPENSE",
  class: 6
}
```


***

## Testing Scenarios

```typescript
// tests/timbre-fiscal.test.ts

describe('TimbreFiscalService', () => {
  it('should exempt amounts <= 300 DA', () => {
    expect(TimbreFiscalService.calculate(new Decimal(250))).toEqual(new Decimal(0));
  });

  it('should calculate 1% for amounts 301-30,000 DA', () => {
    expect(TimbreFiscalService.calculate(new Decimal(1000))).toEqual(new Decimal(10));
    expect(TimbreFiscalService.calculate(new Decimal(11900))).toEqual(new Decimal(119));
  });

  it('should calculate 1.5% for amounts 30,001-100,000 DA', () => {
    expect(TimbreFiscalService.calculate(new Decimal(31010))).toEqual(new Decimal(467));
  });

  it('should calculate 2% for amounts > 100,000 DA', () => {
    expect(TimbreFiscalService.calculate(new Decimal(150000))).toEqual(new Decimal(3000));
  });

  it('should apply minimum of 5 DA', () => {
    expect(TimbreFiscalService.calculate(new Decimal(450))).toEqual(new Decimal(5));
  });

  it('should apply maximum of 10,000 DA', () => {
    expect(TimbreFiscalService.calculate(new Decimal(10000000))).toEqual(new Decimal(10000));
  });

  it('should exempt electronic payments', () => {
    expect(TimbreFiscalService.calculate(new Decimal(50000), true)).toEqual(new Decimal(0));
  });
});
```


***

## Important Notes

1. **Base Calculation:** Always calculate on **TTC (Toutes Taxes Comprises)** - total including all taxes[^5][^1]
2. **Electronic Payment Exemption:** Since 2025, electronic/bank payments are exempt from stamp duty[^2]
3. **Rounding:** Always round UP to the nearest integer[^3][^1]
4. **Controversy:** There are interpretation debates, but the tranche/percentage method is officially accepted[^3]
5. **Safety Margin:** When in doubt, use the method giving the higher amount to avoid tax penalties[^3]
6. **Not threshold of 20,000:** The user mentioned 20,000 DZD, but the actual thresholds are **300 DA, 30,000 DA, and 100,000 DA**[^1][^2][^3]

***

## Summary for TOTALFisc Implementation

### Priority: HIGH ⭐⭐⭐

**Why:** Mandatory tax in Algeria, automatic calculation prevents errors and penalties.

**Implementation Time:** 1-2 days

**What to Add:**

1. ✅ Database field for `timbreFiscal` in Invoice model
2. ✅ Calculation service with both methods
3. ✅ UI display in invoice totals
4. ✅ Accounting entry integration (Account 644000)
5. ✅ PDF invoice display
6. ✅ Testing suite

This feature should be included in **MVP** as it's legally required for all invoices in Algeria.[^2][^5][^1][^3]
<span style="display:none">[^10][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: https://foora-facture.com/calcul-du-timbre-fiscal-facile-avec-foora-guide-complet-pour-les-factures-en-algerie/

[^2]: https://taxsummaries.pwc.com/algeria/corporate/significant-developments

[^3]: https://www.intellixgroup.com/blog/algerie-droit-de-timbre-2025-loi-de-finance-journal-officiel-probleme-et-solutions

[^4]: https://foora-facture.com/quest-ce-que-le-droit-de-timbre-en-algerie/

[^5]: https://www.digitaliac.com/slides/slide/droit-de-timbre-en-algerie-odoo-comptabilite-48

[^6]: https://fatoura.app/blog/droit-de-timbre-en-algerie/

[^7]: https://costy.app/comment-calculer-les-frais-de-timbre-en-algerie-en-2026/

[^8]: https://www.mfdgi.gov.dz/fr/a-propos/actu-fr/codes-fiscaux-fr

[^9]: https://legal-doctrine.com/edition/reamenagement-du-mode-de-calcul-du-droit-de-timbre-de-quittance-une-reforme-fiscale-importante-b8cda97cd9e7d45028f7b4fa96c01bc6

[^10]: https://www.lloydsbanktrade.com/en/market-potential/algeria/taxes

