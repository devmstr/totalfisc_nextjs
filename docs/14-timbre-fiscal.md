# Timbre Fiscal (Stamp Duty)

Algerian stamp duty calculation for commercial documents and invoices.

**Legal Basis:** Law of Finance 2025 (Article 100)

---

## Current Thresholds (2025)

| Amount TTC | Rate | Method |
|------------|------|--------|
| **≤ 300 DA** | **Exempt** | No stamp |
| **301 - 30,000 DA** | **1%** | Per 100 DA tranche |
| **30,001 - 100,000 DA** | **1.5%** | Per 100 DA tranche |
| **> 100,000 DA** | **2%** | Per 100 DA tranche |

### Limits

- **Minimum:** 5 DA
- **Maximum:** 10,000 DA
- **Electronic payments:** Exempt

---

## Calculation Service

```typescript
// lib/services/timbre-fiscal.service.ts

import { Decimal } from '@prisma/client/runtime/library';

export class TimbreFiscalService {
  /**
   * Calculate Timbre Fiscal according to Algerian law 2025
   */
  static calculate(
    amountTTC: Decimal,
    isElectronicPayment: boolean = false
  ): Decimal {
    // Electronic payments exempt
    if (isElectronicPayment) {
      return new Decimal(0);
    }

    const amount = amountTTC.toNumber();

    // Below 300 DA: exempt
    if (amount <= 300) {
      return new Decimal(0);
    }

    // Calculate tranches (rounded up)
    const tranches = Math.ceil(amount / 100);

    let stamp: number;

    // Apply rate
    if (amount <= 30000) {
      stamp = tranches * 1.0;    // 1 DA per tranche
    } else if (amount <= 100000) {
      stamp = tranches * 1.5;    // 1.5 DA per tranche
    } else {
      stamp = tranches * 2.0;    // 2 DA per tranche
    }

    // Apply min/max
    stamp = Math.max(5, Math.min(10000, Math.round(stamp)));

    return new Decimal(stamp);
  }

  /**
   * Check if exempt
   */
  static isExempt(amountTTC: Decimal, isElectronic: boolean): boolean {
    return isElectronic || amountTTC.lessThanOrEqualTo(300);
  }
}
```

---

## Examples

| Amount TTC | Calculation | Result |
|------------|-------------|--------|
| 250 DA | Exempt (< 300) | **0 DA** |
| 1,000 DA | 10 × 1 DA | **10 DA** |
| 11,900 DA | 119 × 1 DA | **119 DA** |
| 31,010 DA | 311 × 1.5 DA | **467 DA** |
| 150,000 DA | 1500 × 2 DA | **3,000 DA** |
| 10,000,000 DA | Max cap | **10,000 DA** |

---

## Database Schema

```prisma
model Invoice {
  // ... existing fields ...
  
  timbreFiscal    Decimal  @default(0) @db.Decimal(15, 2)
  isTimbreExempt  Boolean  @default(false)
}
```

---

## Accounting Entry

When posting invoice to accounting:

```typescript
// Timbre Fiscal line
{
  accountId: '644000', // Droits de timbre
  label: `Timbre fiscal ${invoice.invoiceNumber}`,
  debit: 0,
  credit: invoice.timbreFiscal,
}
```

---

## Invoice Display

```tsx
<div className="flex justify-between">
  <span>Total (TTC)</span>
  <span>{totalAmount.toFixed(2)} DA</span>
</div>

<div className="flex justify-between text-sm text-gray-600">
  <span>Timbre Fiscal</span>
  <span>{timbreFiscal.toFixed(2)} DA</span>
</div>

<div className="flex justify-between font-bold border-t pt-2">
  <span>Total à payer</span>
  <span>{totalAmount.add(timbreFiscal).toFixed(2)} DA</span>
</div>
```

---

## Important Notes

1. Always calculate on **TTC** (total including VAT)
2. Electronic/bank payments are **exempt** since 2025
3. Always **round up** to nearest integer
4. Thresholds: 300 DA, 30,000 DA, 100,000 DA

---

## Next Steps

- [G50 Report](./15-g50-report.md) - Monthly TVA declaration
- [Invoicing](./06-invoicing.md) - Invoice service
