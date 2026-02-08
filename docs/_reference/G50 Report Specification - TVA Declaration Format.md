<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# G50 Report Specification - TVA Declaration Format (Algeria)

## Overview

The **G50 (Série G N°50)** is a **mandatory monthly fiscal declaration** form in Algeria that must be submitted to the tax office (Centre des Impôts) by the **20th of each month** for the previous month's activity.[^1][^2][^3]

***

## Who Must File G50?

### Required Filing

- Companies under **Régime Réel** (Real Tax Regime)
- Companies under **Régime Simplifié** (Simplified Regime)
- Liberal professions[^2][^4]


### Optional Quarterly Filing

Companies whose total tax payments in the previous year were **less than 150,000 DA** can file quarterly instead of monthly, within **10 days** after each quarter[^5]

### Even with No Tax Due

Companies must still file G50 with **"NÉANT"** (nil) declaration. Failure to file results in penalties of **500 to 1,500 DA**[^1][^2]

***

## Taxes Declared on G50

The G50 form consolidates multiple tax declarations:[^6][^2][^1]

1. **TVA** (Taxe sur la Valeur Ajoutée) - VAT
2. **IBS** (Impôt sur les Bénéfices des Sociétés) - Corporate Tax (monthly advances)
3. **IRG** (Impôt sur le Revenu Global) - Income Tax (withholding)
4. **TAP** (Taxe sur l'Activité Professionnelle) - ⚠️ **ABOLISHED since 2024** (except exceptional cases)[^7][^1]
5. **TPF** (Taxe Parafiscale) - Parafiscal Tax
6. **Droits de Timbre** - Stamp Duties
7. **TIC** (Taxe Intérieure de Consommation) - Domestic Consumption Tax
8. **TPP** (Taxe sur les Produits Pétroliers) - Petroleum Products Tax

***

## G50 Form Structure - TVA Section

### Section 1: Company Identification

| Field | Description |
| :-- | :-- |
| **NIF** | Numéro d'Identification Fiscale (Tax ID) |
| **Raison Sociale** | Company name |
| **Adresse** | Company address |
| **RC** | Registre de Commerce (Commerce Registry Number) |
| **Période** | Declaration period (Month/Year) |
| **Wilaya** | Province |
| **Centre des Impôts** | Tax office name |


***

### Section 2: TVA Calculation (Main Focus)

#### A. Turnover and TVA Collected

| Case \# | Field | Description | Source | Calculation |
| :-- | :-- | :-- | :-- | :-- |
| **1** | Montant brut des ventes | Gross sales amount (TTC) | Sales invoices | Sum of all sales TTC |
| **2** | Exonérations | Exempt sales | Exempt invoices | Sum of exempt sales |
| **3** | CA imposable | Taxable turnover | Calculated | Case 1 - Case 2 |
| **4** | TVA collectée | VAT collected | Calculated | Case 3 × 19% [^3][^5] |

**Formula:**

```typescript
taxableTurnover = grossSales - exemptions
vatCollected = taxableTurnover * 0.19
```


#### B. TVA Deductible (Input VAT)

The deductible VAT is calculated from purchases and requires a **detailed supplier statement**.[^3][^4][^2]


| Case \# | Field | Description |
| :-- | :-- | :-- |
| **5** | TVA sur immobilisations | VAT on fixed assets purchases |
| **6** | TVA sur autres biens et services | VAT on goods and services |
| **7** | TVA déductible totale | Total deductible VAT (5 + 6) |

**Required Supporting Document:** État détaillé des fournisseurs (Supplier Detail Statement)

#### C. Adjustments \& Regularizations

| Case \# | Field | Description |
| :-- | :-- | :-- |
| **8** | Crédit de TVA du mois précédent | VAT credit from previous month |
| **9** | Régularisations | Adjustments (cancelled invoices, etc.) |
| **10** | TVA sur factures annulées | VAT on cancelled invoices |

#### D. Final TVA Calculation

| Case \# | Field | Formula |
| :-- | :-- | :-- |
| **11** | Total déductions | Case 7 + Case 8 + Case 9 |
| **12** | **TVA à payer** | Case 4 - Case 11 |
| **13** | **Crédit de TVA (report)** | If Case 11 > Case 4 |

**Final Logic:**

```typescript
if (vatCollected > totalDeductions) {
  vatToPay = vatCollected - totalDeductions
  vatCredit = 0
} else {
  vatToPay = 0
  vatCredit = totalDeductions - vatCollected
}
```


***

### Section 3: Supplier Detail Statement (État des Fournisseurs)

**Mandatory attachment for TVA deduction** - Must be submitted on **USB/CD** or online[^4][^2][^3]

Required fields for each supplier:


| Field | Description | Verification Required |
| :-- | :-- | :-- |
| **NIF** | Supplier Tax ID | ✅ Authenticate on DGI website |
| **RC** | Commerce Registry | ✅ Authenticate on CNRC website |
| **Nom/Raison Sociale** | Supplier name | - |
| **Adresse** | Supplier address | - |
| **N° Facture** | Invoice number | - |
| **Date Facture** | Invoice date | - |
| **Montant HT** | Amount excluding VAT | - |
| **Montant TVA** | VAT amount deducted | - |
| **Montant TTC** | Total amount including VAT | - |

**Authentication websites:**

- NIF validation: https://www.mfdgi.gov.dz
- RC validation: https://www.cnrc.dz

***

### Section 4: Other Taxes (Summary)

| Tax | Description | Frequency |
| :-- | :-- | :-- |
| **IBS - Acomptes** | Corporate tax quarterly advance | Monthly if large taxpayer |
| **IRG - Salaires** | Payroll withholding tax | Monthly |
| **IRG - Honoraires** | Professional fees withholding | Monthly |
| **IRG - Loyers** | Rent withholding | Monthly |
| **Droits de Timbre** | Stamp duties collected | Monthly |


***

## Implementation in TOTALFisc

### Database Schema Enhancement

```prisma
// Add to schema.prisma

// G50 Declaration Model
model G50Declaration {
  id              String       @id @default(cuid())
  
  // Period
  period          DateTime     // First day of the declaration month
  year            Int
  month           Int
  
  // Status
  status          G50Status    @default(DRAFT)
  submittedAt     DateTime?
  
  // TVA Section
  grossSales      Decimal      @db.Decimal(15, 2)  // Case 1
  exemptions      Decimal      @db.Decimal(15, 2)  // Case 2
  taxableTurnover Decimal      @db.Decimal(15, 2)  // Case 3
  vatCollected    Decimal      @db.Decimal(15, 2)  // Case 4
  
  // Deductible VAT
  vatOnAssets     Decimal      @db.Decimal(15, 2)  // Case 5
  vatOnGoods      Decimal      @db.Decimal(15, 2)  // Case 6
  totalVatDeductible Decimal   @db.Decimal(15, 2)  // Case 7
  
  // Adjustments
  previousCredit  Decimal      @db.Decimal(15, 2)  // Case 8
  adjustments     Decimal      @default(0) @db.Decimal(15, 2)  // Case 9
  cancelledInvoicesVat Decimal @default(0) @db.Decimal(15, 2) // Case 10
  
  // Results
  totalDeductions Decimal      @db.Decimal(15, 2)  // Case 11
  vatToPay        Decimal      @db.Decimal(15, 2)  // Case 12
  vatCredit       Decimal      @db.Decimal(15, 2)  // Case 13
  
  // Other taxes
  ibsAdvance      Decimal      @default(0) @db.Decimal(15, 2)
  irgSalaries     Decimal      @default(0) @db.Decimal(15, 2)
  irgFees         Decimal      @default(0) @db.Decimal(15, 2)
  stampDuties     Decimal      @default(0) @db.Decimal(15, 2)
  
  // Total to pay
  totalAmount     Decimal      @db.Decimal(15, 2)
  
  // Supplier details
  suppliers       G50SupplierDetail[]
  
  tenantId        String
  tenant          Tenant       @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  
  @@unique([tenantId, year, month])
  @@index([tenantId, period, status])
}

enum G50Status {
  DRAFT
  VALIDATED
  SUBMITTED
  PAID
}

// Supplier detail for TVA deduction
model G50SupplierDetail {
  id              String       @id @default(cuid())
  
  declarationId   String
  declaration     G50Declaration @relation(fields: [declarationId], references: [id], onDelete: Cascade)
  
  // Supplier info
  supplierNif     String
  supplierRc      String?
  supplierName    String
  supplierAddress String?
  
  // Verification
  nifVerified     Boolean      @default(false)
  rcVerified      Boolean      @default(false)
  verifiedAt      DateTime?
  
  // Invoice details
  invoiceNumber   String
  invoiceDate     DateTime
  amountHT        Decimal      @db.Decimal(15, 2)
  vatAmount       Decimal      @db.Decimal(15, 2)
  amountTTC       Decimal      @db.Decimal(15, 2)
  
  // Link to accounting
  pieceId         String?
  
  createdAt       DateTime     @default(now())
  
  @@index([declarationId])
  @@index([supplierNif])
}
```


***

### G50 Generation Service

```typescript
// lib/services/g50.service.ts

import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { startOfMonth, endOfMonth } from 'date-fns';

export interface G50GenerationInput {
  tenantId: string;
  year: number;
  month: number; // 1-12
}

export class G50Service {
  /**
   * Generate G50 declaration for a specific month
   */
  static async generateDeclaration(
    input: G50GenerationInput
  ): Promise<any> {
    const { tenantId, year, month } = input;

    // Define period
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = endOfMonth(periodStart);

    // Check if already exists
    const existing = await prisma.g50Declaration.findUnique({
      where: {
        tenantId_year_month: {
          tenantId,
          year,
          month,
        },
      },
    });

    if (existing) {
      throw new Error(`G50 for ${month}/${year} already exists`);
    }

    // 1. Calculate Sales (TVA Collected)
    const salesData = await this.calculateSales(
      tenantId,
      periodStart,
      periodEnd
    );

    // 2. Calculate Purchases (TVA Deductible)
    const purchasesData = await this.calculatePurchases(
      tenantId,
      periodStart,
      periodEnd
    );

    // 3. Get previous month credit
    const previousMonth = month === 1 ? 12 : month - 1;
    const previousYear = month === 1 ? year - 1 : year;

    const previousDeclaration = await prisma.g50Declaration.findUnique({
      where: {
        tenantId_year_month: {
          tenantId,
          year: previousYear,
          month: previousMonth,
        },
      },
      select: { vatCredit: true },
    });

    const previousCredit = previousDeclaration?.vatCredit || new Decimal(0);

    // 4. Calculate totals
    const totalDeductions = salesData.vatOnAssets
      .add(salesData.vatOnGoods)
      .add(previousCredit);

    const vatToPay =
      salesData.vatCollected.greaterThan(totalDeductions)
        ? salesData.vatCollected.minus(totalDeductions)
        : new Decimal(0);

    const vatCredit =
      totalDeductions.greaterThan(salesData.vatCollected)
        ? totalDeductions.minus(salesData.vatCollected)
        : new Decimal(0);

    // 5. Calculate other taxes
    const otherTaxes = await this.calculateOtherTaxes(
      tenantId,
      periodStart,
      periodEnd
    );

    // 6. Create declaration
    const declaration = await prisma.$transaction(async (tx) => {
      const g50 = await tx.g50Declaration.create({
        data: {
          period: periodStart,
          year,
          month,
          status: 'DRAFT',
          
          // TVA Section
          grossSales: salesData.grossSales,
          exemptions: salesData.exemptions,
          taxableTurnover: salesData.taxableTurnover,
          vatCollected: salesData.vatCollected,
          
          vatOnAssets: purchasesData.vatOnAssets,
          vatOnGoods: purchasesData.vatOnGoods,
          totalVatDeductible: purchasesData.vatOnAssets.add(
            purchasesData.vatOnGoods
          ),
          
          previousCredit,
          adjustments: new Decimal(0),
          cancelledInvoicesVat: new Decimal(0),
          
          totalDeductions,
          vatToPay,
          vatCredit,
          
          // Other taxes
          ibsAdvance: otherTaxes.ibsAdvance,
          irgSalaries: otherTaxes.irgSalaries,
          irgFees: otherTaxes.irgFees,
          stampDuties: otherTaxes.stampDuties,
          
          totalAmount: vatToPay
            .add(otherTaxes.ibsAdvance)
            .add(otherTaxes.irgSalaries)
            .add(otherTaxes.irgFees)
            .add(otherTaxes.stampDuties),
          
          tenantId,
          
          // Create supplier details
          suppliers: {
            create: purchasesData.suppliers,
          },
        },
        include: {
          suppliers: true,
        },
      });

      return g50;
    });

    return declaration;
  }

  /**
   * Calculate sales and VAT collected
   */
  private static async calculateSales(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date
  ) {
    // Get all finalized invoices for the period
    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        status: { in: ['FINALIZED', 'SENT', 'PAID'] },
        issueDate: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      select: {
        totalAmount: true,
        taxAmount: true,
        subtotal: true,
        isTimbreExempt: true,
      },
    });

    let grossSales = new Decimal(0);
    let exemptions = new Decimal(0);
    let vatCollected = new Decimal(0);

    for (const invoice of invoices) {
      grossSales = grossSales.add(invoice.totalAmount);
      vatCollected = vatCollected.add(invoice.taxAmount);
      
      // Handle exempt sales if needed
      // if (invoice.isExempt) {
      //   exemptions = exemptions.add(invoice.totalAmount);
      // }
    }

    const taxableTurnover = grossSales.minus(exemptions);

    return {
      grossSales,
      exemptions,
      taxableTurnover,
      vatCollected,
      vatOnAssets: new Decimal(0), // From purchases
      vatOnGoods: new Decimal(0),   // From purchases
    };
  }

  /**
   * Calculate purchases and deductible VAT
   */
  private static async calculatePurchases(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date
  ) {
    // Get purchase journal
    const purchaseJournals = await prisma.journal.findMany({
      where: {
        tenantId,
        nature: { in: ['ACHAT', 'OD'] },
      },
      select: { id: true },
    });

    const journalIds = purchaseJournals.map((j) => j.id);

    // Get TVA account (445660 - TVA déductible)
    const tvaAccount = await prisma.account.findFirst({
      where: {
        tenantId,
        code: { startsWith: '4456' }, // TVA déductible
      },
    });

    if (!tvaAccount) {
      return {
        vatOnAssets: new Decimal(0),
        vatOnGoods: new Decimal(0),
        suppliers: [],
      };
    }

    // Get all deductible VAT lines
    const vatLines = await prisma.transactionLine.findMany({
      where: {
        tenantId,
        accountId: tvaAccount.id,
        piece: {
          journalId: { in: journalIds },
          date: {
            gte: periodStart,
            lte: periodEnd,
          },
        },
      },
      include: {
        piece: {
          include: {
            lines: {
              include: {
                auxiliary: true,
                account: true,
              },
            },
          },
        },
      },
    });

    let vatOnAssets = new Decimal(0);
    let vatOnGoods = new Decimal(0);
    const suppliers: any[] = [];

    // Process each piece
    for (const vatLine of vatLines) {
      const piece = vatLine.piece;
      
      // Determine if it's an asset purchase (class 2)
      const isAsset = piece.lines.some(
        (l) => l.account.class === 2
      );

      const vatAmount = vatLine.debit;

      if (isAsset) {
        vatOnAssets = vatOnAssets.add(vatAmount);
      } else {
        vatOnGoods = vatOnGoods.add(vatAmount);
      }

      // Extract supplier info
      const supplierLine = piece.lines.find(
        (l) => l.auxiliaryId && l.credit.greaterThan(0)
      );

      if (supplierLine?.auxiliary) {
        const amountTTC = supplierLine.credit;
        const amountHT = amountTTC.minus(vatAmount);

        suppliers.push({
          supplierNif: supplierLine.auxiliary.taxId || 'N/A',
          supplierRc: supplierLine.auxiliary.rc || '',
          supplierName: supplierLine.auxiliary.label,
          supplierAddress: supplierLine.auxiliary.address || '',
          invoiceNumber: piece.reference || piece.pieceNumber,
          invoiceDate: piece.date,
          amountHT,
          vatAmount,
          amountTTC,
          pieceId: piece.id,
          nifVerified: false,
          rcVerified: false,
        });
      }
    }

    return {
      vatOnAssets,
      vatOnGoods,
      suppliers,
    };
  }

  /**
   * Calculate other taxes (IBS, IRG, etc.)
   */
  private static async calculateOtherTaxes(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date
  ) {
    // This would involve more complex calculations
    // For MVP, we can return zeros or simplified calculations
    
    return {
      ibsAdvance: new Decimal(0),
      irgSalaries: new Decimal(0),
      irgFees: new Decimal(0),
      stampDuties: new Decimal(0),
    };
  }

  /**
   * Validate G50 before submission
   */
  static async validateDeclaration(
    declarationId: string
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const declaration = await prisma.g50Declaration.findUnique({
      where: { id: declarationId },
      include: { suppliers: true },
    });

    if (!declaration) {
      return { isValid: false, errors: ['Declaration not found'] };
    }

    const errors: string[] = [];

    // Check balance
    const calculatedDeductions = declaration.totalVatDeductible
      .add(declaration.previousCredit)
      .add(declaration.adjustments);

    if (!calculatedDeductions.equals(declaration.totalDeductions)) {
      errors.push('Total deductions mismatch');
    }

    // Check VAT calculation
    if (declaration.vatCollected.greaterThan(declaration.totalDeductions)) {
      if (!declaration.vatToPay.equals(
        declaration.vatCollected.minus(declaration.totalDeductions)
      )) {
        errors.push('VAT to pay calculation error');
      }
    }

    // Verify suppliers
    const unverifiedSuppliers = declaration.suppliers.filter(
      (s) => !s.nifVerified || !s.rcVerified
    );

    if (unverifiedSuppliers.length > 0) {
      errors.push(
        `${unverifiedSuppliers.length} supplier(s) not verified`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Export G50 to Excel/PDF format
   */
  static async exportDeclaration(
    declarationId: string,
    format: 'excel' | 'pdf'
  ): Promise<Buffer> {
    // Implementation would generate the official G50 form
    // in the required DGI format
    throw new Error('Not implemented');
  }
}
```


***

### G50 Page Component

```tsx
// app/(dashboard)/reports/g50/page.tsx

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function G50Page() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const { data: declaration, isLoading } = useQuery({
    queryKey: ['g50', selectedYear, selectedMonth],
    queryFn: () => fetchG50Declaration(selectedYear, selectedMonth),
  });

  const handleGenerate = async () => {
    await generateG50Declaration(selectedYear, selectedMonth);
    // Refetch data
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Déclaration G50</h1>
        
        <div className="flex gap-4">
          <Select
            value={selectedMonth.toString()}
            onValueChange={(v) => setSelectedMonth(parseInt(v))}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>
                  {new Date(2000, i).toLocaleDateString('fr-FR', {
                    month: 'long',
                  })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedYear.toString()}
            onValueChange={(v) => setSelectedYear(parseInt(v))}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => (
                <SelectItem
                  key={i}
                  value={(new Date().getFullYear() - i).toString()}
                >
                  {new Date().getFullYear() - i}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={handleGenerate}>
            Générer G50
          </Button>
        </div>
      </div>

      {isLoading && <div>Chargement...</div>}

      {declaration && (
        <div className="grid grid-cols-2 gap-6">
          {/* TVA Collected */}
          <Card>
            <CardHeader>
              <CardTitle>TVA Collectée</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Montant brut des ventes</span>
                <span className="font-mono">
                  {declaration.grossSales.toFixed(2)} DA
                </span>
              </div>
              <div className="flex justify-between">
                <span>Exonérations</span>
                <span className="font-mono">
                  {declaration.exemptions.toFixed(2)} DA
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span>CA Imposable</span>
                <span className="font-mono font-semibold">
                  {declaration.taxableTurnover.toFixed(2)} DA
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>TVA Collectée</span>
                <span className="font-mono text-blue-600">
                  {declaration.vatCollected.toFixed(2)} DA
                </span>
              </div>
            </CardContent>
          </Card>

          {/* TVA Deductible */}
          <Card>
            <CardHeader>
              <CardTitle>TVA Déductible</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>TVA sur immobilisations</span>
                <span className="font-mono">
                  {declaration.vatOnAssets.toFixed(2)} DA
                </span>
              </div>
              <div className="flex justify-between">
                <span>TVA sur biens et services</span>
                <span className="font-mono">
                  {declaration.vatOnGoods.toFixed(2)} DA
                </span>
              </div>
              <div className="flex justify-between">
                <span>Crédit mois précédent</span>
                <span className="font-mono">
                  {declaration.previousCredit.toFixed(2)} DA
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total Déductions</span>
                <span className="font-mono text-green-600">
                  {declaration.totalDeductions.toFixed(2)} DA
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Result */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Résultat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-xl">
                    <span>TVA à payer</span>
                    <span className="font-mono font-bold text-red-600">
                      {declaration.vatToPay.toFixed(2)} DA
                    </span>
                  </div>
                  <div className="flex justify-between text-xl">
                    <span>Crédit TVA (report)</span>
                    <span className="font-mono font-bold text-green-600">
                      {declaration.vatCredit.toFixed(2)} DA
                    </span>
                  </div>
                </div>

                <div className="space-y-3 border-l pl-6">
                  <div className="flex justify-between">
                    <span>Acompte IBS</span>
                    <span className="font-mono">
                      {declaration.ibsAdvance.toFixed(2)} DA
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>IRG Salaires</span>
                    <span className="font-mono">
                      {declaration.irgSalaries.toFixed(2)} DA
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Droits de timbre</span>
                    <span className="font-mono">
                      {declaration.stampDuties.toFixed(2)} DA
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2 text-xl font-bold">
                    <span>Total à payer</span>
                    <span className="font-mono text-red-600">
                      {declaration.totalAmount.toFixed(2)} DA
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-4">
                <Button variant="outline">
                  Export Excel
                </Button>
                <Button variant="outline">
                  Export PDF
                </Button>
                <Button>
                  Valider et Soumettre
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Supplier List */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>
                État des Fournisseurs ({declaration.suppliers?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-2">NIF</th>
                    <th className="text-left">Fournisseur</th>
                    <th className="text-left">N° Facture</th>
                    <th className="text-right">Montant HT</th>
                    <th className="text-right">TVA</th>
                    <th className="text-center">Vérifié</th>
                  </tr>
                </thead>
                <tbody>
                  {declaration.suppliers?.map((supplier: any) => (
                    <tr key={supplier.id} className="border-b">
                      <td className="py-2 font-mono text-xs">
                        {supplier.supplierNif}
                      </td>
                      <td>{supplier.supplierName}</td>
                      <td className="font-mono text-xs">
                        {supplier.invoiceNumber}
                      </td>
                      <td className="text-right font-mono">
                        {supplier.amountHT.toFixed(2)}
                      </td>
                      <td className="text-right font-mono">
                        {supplier.vatAmount.toFixed(2)}
                      </td>
                      <td className="text-center">
                        {supplier.nifVerified && supplier.rcVerified ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span className="text-red-600">✗</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
```


***

## Important Notes for Implementation

### Priority Level: MEDIUM-HIGH ⭐⭐⭐⭐

**Why:**

- Legally mandatory monthly filing
- Core compliance requirement
- Automated calculation saves hours of manual work

**Implementation Timeline:** 2-3 weeks

**MVP Scope:**

- ✅ Automatic TVA calculation from sales/purchases
- ✅ Supplier detail statement generation
- ✅ Basic validation
- ❌ Online submission (manual for MVP)
- ❌ NIF/RC automatic verification (manual for MVP)
- ❌ Other taxes (IBS, IRG) - simplified or manual entry


### Key Algerian Tax Rules

1. **Filing Deadline:** 20th of each month for previous month[^2][^1]
2. **TVA Rate:** 19% (standard rate)[^3][^5]
3. **Penalty for Late Filing:** 500-1,500 DA even if "Néant"[^1][^2]
4. **Quarterly Option:** Available if previous year < 150,000 DA total[^5]
5. **Supplier Authentication:** NIF and RC must be verified online[^4][^2]

***

## Summary

The G50 is the **backbone of Algerian tax compliance**. TOTALFisc should automate this process by:

1. Auto-calculating from accounting transactions
2. Generating supplier detail statements
3. Validating data before submission
4. Exporting to official DGI format

This feature significantly reduces accountant workload and ensures compliance.[^6][^2][^3][^5][^1]
<span style="display:none">[^10][^11][^12][^13][^14][^15][^16][^8][^9]</span>

<div align="center">⁂</div>

[^1]: https://fatoura.app/blog/g50-declaration-fiscale-en-algerie/

[^2]: https://legal-doctrine.com/edition/La-déclaration-G50-en-Algérie

[^3]: https://lentrepreneuralgerien.com/images/pdf/impots/Comment_remplir_G50.pdf

[^4]: https://legal-doctrine.com/en/edition/La-déclaration-G50-en-Algérie

[^5]: https://lentrepreneuralgerien.com/impots/item/37-qu-est-ce-qu-une-g50-algerie

[^6]: https://www.digitaliac.com/slides/slide/declaration-g50-algerie-odoo-41

[^7]: https://legal-doctrine.com/en/edition/Formulaire-de-déclaration-G50-et-ultime-déclaration-de-la-taxe-sur-lactivité-professionnelle

[^8]: https://www.mfdgi.gov.dz/fr/component/tags/tag/g50

[^9]: https://lentrepreneuralgerien.com/images/pdf/impots/Serie-G-n50.pdf

[^10]: https://www.mfdgi.gov.dz/techargement-ar/formulaires-de-declaration

[^11]: https://lentrepreneuralgerien.com/images/pdf/impots/G50_TER_SALAIRES_IFU.pdf

[^12]: https://www.mfdgi.gov.dz/fr/espace-telechargements/formulaires-declaration?view=frontlist\&catid[0]=521

[^13]: https://lentrepreneuralgerien.com/images/pdf/impots/g50-excel.xls

[^14]: https://fr.scribd.com/document/677556342/G50

[^15]: https://www.mfdgi.gov.dz/component/tags/tag/g50

[^16]: https://fr.scribd.com/document/387530850/Comment-Remplir-G50-2018

