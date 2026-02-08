# G50 Report (TVA Declaration)

Monthly fiscal declaration for TVA and other taxes in Algeria.

**Filing Deadline:** 20th of each month for previous month

---

## Who Must File?

- Companies under **Régime Réel** (Real Tax Regime)
- Companies under **Régime Simplifié** (Simplified Regime)
- Liberal professions

> **Note:** Even with no tax due, file with "NÉANT" (nil). Penalty: 500-1,500 DA.

---

## Taxes Declared

| Tax | Description |
|-----|-------------|
| **TVA** | Value Added Tax (main focus) |
| **IBS** | Corporate Tax (monthly advances) |
| **IRG** | Income Tax (withholding) |
| **Timbre** | Stamp Duties |

> ⚠️ **TAP abolished** since 2024 (except exceptions)

---

## G50 Structure

### Section 1: Company Info

| Field | Description |
|-------|-------------|
| NIF | Tax ID |
| Raison Sociale | Company name |
| RC | Commerce Registry |
| Période | Month/Year |

### Section 2: TVA Calculation

| Case | Field | Formula |
|------|-------|---------|
| 1 | Gross sales TTC | Sum of invoices |
| 2 | Exemptions | Exempt sales |
| 3 | Taxable turnover | Case 1 - Case 2 |
| **4** | **TVA Collectée** | Case 3 × 19% |
| 5 | TVA on assets | Input VAT (immob.) |
| 6 | TVA on goods | Input VAT (other) |
| 7 | Total deductible | Case 5 + 6 |
| 8 | Previous credit | Carry-forward |
| 11 | Total deductions | Case 7 + 8 |
| **12** | **TVA à payer** | Case 4 - 11 |
| 13 | Credit (report) | If 11 > 4 |

---

## Database Schema

```prisma
model G50Declaration {
  id              String       @id @default(cuid())
  
  // Period
  year            Int
  month           Int
  status          G50Status    @default(DRAFT)
  
  // TVA Section
  grossSales      Decimal      @db.Decimal(15, 2)
  exemptions      Decimal      @db.Decimal(15, 2)
  taxableTurnover Decimal      @db.Decimal(15, 2)
  vatCollected    Decimal      @db.Decimal(15, 2)
  
  // Deductible
  vatOnAssets     Decimal      @db.Decimal(15, 2)
  vatOnGoods      Decimal      @db.Decimal(15, 2)
  totalVatDeductible Decimal   @db.Decimal(15, 2)
  
  // Adjustments
  previousCredit  Decimal      @db.Decimal(15, 2)
  
  // Results
  totalDeductions Decimal      @db.Decimal(15, 2)
  vatToPay        Decimal      @db.Decimal(15, 2)
  vatCredit       Decimal      @db.Decimal(15, 2)
  
  // Other taxes
  ibsAdvance      Decimal      @default(0) @db.Decimal(15, 2)
  irgSalaries     Decimal      @default(0) @db.Decimal(15, 2)
  stampDuties     Decimal      @default(0) @db.Decimal(15, 2)
  
  totalAmount     Decimal      @db.Decimal(15, 2)
  
  suppliers       G50SupplierDetail[]
  tenantId        String
  
  @@unique([tenantId, year, month])
}

enum G50Status {
  DRAFT
  VALIDATED
  SUBMITTED
  PAID
}

model G50SupplierDetail {
  id              String       @id @default(cuid())
  declarationId   String
  
  // Supplier info
  supplierNif     String
  supplierRc      String?
  supplierName    String
  
  // Verification
  nifVerified     Boolean      @default(false)
  
  // Invoice
  invoiceNumber   String
  invoiceDate     DateTime
  amountHT        Decimal      @db.Decimal(15, 2)
  vatAmount       Decimal      @db.Decimal(15, 2)
  amountTTC       Decimal      @db.Decimal(15, 2)
}
```

---

## Supplier Detail Statement

Required attachment for TVA deduction:

| Field | Required |
|-------|----------|
| Supplier NIF | ✅ Verify on mfdgi.gov.dz |
| Supplier RC | ✅ Verify on cnrc.dz |
| Invoice number | ✅ |
| Invoice date | ✅ |
| Amount HT | ✅ |
| VAT amount | ✅ |
| Amount TTC | ✅ |

---

## Service Implementation

```typescript
// lib/services/g50.service.ts

export class G50Service {
  static async generateDeclaration(
    tenantId: string,
    year: number,
    month: number
  ) {
    // 1. Get invoices for period
    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        status: { in: ['FINALIZED', 'SENT', 'PAID'] },
        issueDate: { gte: periodStart, lte: periodEnd },
      },
    });

    // 2. Calculate TVA collected
    const vatCollected = invoices.reduce(
      (sum, inv) => sum.add(inv.taxAmount),
      new Decimal(0)
    );

    // 3. Get purchase VAT (deductible)
    const vatDeductible = await this.calculateDeductibleVAT(
      tenantId, periodStart, periodEnd
    );

    // 4. Get previous credit
    const previousCredit = await this.getPreviousCredit(
      tenantId, year, month
    );

    // 5. Calculate final amounts
    const totalDeductions = vatDeductible.add(previousCredit);
    
    const vatToPay = vatCollected.greaterThan(totalDeductions)
      ? vatCollected.minus(totalDeductions)
      : new Decimal(0);
    
    const vatCredit = totalDeductions.greaterThan(vatCollected)
      ? totalDeductions.minus(vatCollected)
      : new Decimal(0);

    return { vatCollected, vatToPay, vatCredit };
  }
}
```

---

## Workflow

1. **Generate** - Auto-calculate from invoices/purchases
2. **Review** - Verify supplier details
3. **Validate** - Check calculations
4. **Export** - Generate official format
5. **Submit** - Mark as submitted
6. **Pay** - Record payment

---

## Next Steps

- [SCF Chart of Accounts](./13-scf-chart-of-accounts.md) - Account codes
- [Timbre Fiscal](./14-timbre-fiscal.md) - Stamp duty
- [Invoicing](./06-invoicing.md) - Invoice service
