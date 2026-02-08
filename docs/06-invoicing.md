# Invoicing

Invoice management, PDF generation, and API routes.

---

## Invoice Service

```typescript
// lib/services/invoice.service.ts

import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import type { Invoice, InvoiceItem, Auxiliary } from '@prisma/client';

export interface CreateInvoiceInput {
  customerId: string;
  issueDate: Date;
  dueDate: Date;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    accountCode?: string;
    productId?: string;
  }>;
  discountAmount?: number;
  customMessage?: string;
  footerText?: string;
}

export class InvoiceService {
  /**
   * Generate next invoice number
   */
  static async getNextInvoiceNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;

    const lastInvoice = await prisma.invoice.findFirst({
      where: {
        tenantId,
        invoiceNumber: { startsWith: prefix },
      },
      orderBy: { invoiceNumber: 'desc' },
      select: { invoiceNumber: true },
    });

    if (!lastInvoice) {
      return `${prefix}001`;
    }

    const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[2]);
    const nextNumber = String(lastNumber + 1).padStart(3, '0');

    return `${prefix}${nextNumber}`;
  }

  /**
   * Create invoice (draft status)
   */
  static async createInvoice(
    tenantId: string,
    data: CreateInvoiceInput
  ): Promise<Invoice & { items: InvoiceItem[] }> {
    const customer = await prisma.auxiliary.findUnique({
      where: { id: data.customerId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Calculate totals
    let subtotal = new Decimal(0);
    let taxAmount = new Decimal(0);

    const itemsWithAmounts = data.items.map((item, index) => {
      const amount = new Decimal(item.quantity).times(item.unitPrice);
      const tax = amount.times(item.taxRate).dividedBy(100);

      subtotal = subtotal.add(amount);
      taxAmount = taxAmount.add(tax);

      return {
        lineNumber: index + 1,
        description: item.description,
        quantity: new Decimal(item.quantity),
        unitPrice: new Decimal(item.unitPrice),
        taxRate: new Decimal(item.taxRate),
        amount,
        accountCode: item.accountCode || '700000',
        productId: item.productId,
      };
    });

    const discountAmount = new Decimal(data.discountAmount || 0);
    const totalAmount = subtotal.add(taxAmount).minus(discountAmount);

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { logo: true },
    });

    const invoiceNumber = await this.getNextInvoiceNumber(tenantId);

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        status: 'DRAFT',
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        customerId: data.customerId,
        customerName: customer.label,
        customerAddress: customer.address,
        customerTaxId: customer.taxId,
        customerRib: customer.rib,
        subtotal,
        taxRate: new Decimal(19),
        taxAmount,
        discountAmount,
        totalAmount,
        currency: 'DZD',
        logo: tenant?.logo,
        customMessage: data.customMessage,
        footerText: data.footerText,
        tenantId,
        items: {
          create: itemsWithAmounts,
        },
      },
      include: { items: true },
    });

    return invoice;
  }

  /**
   * Finalize invoice and create accounting entry
   */
  static async finalizeInvoice(
    invoiceId: string,
    userId: string
  ): Promise<{ success: boolean; pieceId?: string; error?: string }> {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { items: true },
      });

      if (!invoice) {
        return { success: false, error: 'Invoice not found' };
      }

      if (invoice.status !== 'DRAFT') {
        return { success: false, error: 'Invoice already finalized' };
      }

      const result = await prisma.$transaction(async (tx) => {
        // Get sales journal
        const salesJournal = await tx.journal.findFirst({
          where: { tenantId: invoice.tenantId, nature: 'VENTE' },
        });

        if (!salesJournal) {
          throw new Error('Sales journal not found');
        }

        // Get next piece number
        const lastPiece = await tx.piece.findFirst({
          where: { journalId: salesJournal.id },
          orderBy: { pieceNumber: 'desc' },
          select: { pieceNumber: true },
        });

        const nextNumber = lastPiece
          ? String(parseInt(lastPiece.pieceNumber) + 1).padStart(5, '0')
          : '00001';

        // Get accounts
        const clientAccount = await tx.account.findFirst({
          where: { tenantId: invoice.tenantId, code: { startsWith: '411' } },
        });

        const tvaAccount = await tx.account.findFirst({
          where: { tenantId: invoice.tenantId, code: '445710' },
        });

        if (!clientAccount || !tvaAccount) {
          throw new Error('Required accounts not found');
        }

        // Get revenue accounts
        const revenueAccountCodes = [...new Set(
          invoice.items.map((item) => item.accountCode || '700000')
        )];

        const revenueAccounts = await tx.account.findMany({
          where: { tenantId: invoice.tenantId, code: { in: revenueAccountCodes } },
        });

        const revenueAccountMap = new Map(
          revenueAccounts.map((acc) => [acc.code, acc.id])
        );

        // Create accounting entry
        const piece = await tx.piece.create({
          data: {
            pieceNumber: nextNumber,
            date: invoice.issueDate,
            reference: invoice.invoiceNumber,
            journalId: salesJournal.id,
            lines: {
              create: [
                // Debit Customer
                {
                  lineNumber: 1,
                  accountId: clientAccount.id,
                  auxiliaryId: invoice.customerId,
                  label: `Facture ${invoice.invoiceNumber} - ${invoice.customerName}`,
                  debit: invoice.totalAmount,
                  credit: 0,
                  tenantId: invoice.tenantId,
                },
                // Credit Revenue for each item
                ...invoice.items.map((item, index) => ({
                  lineNumber: index + 2,
                  accountId: revenueAccountMap.get(item.accountCode || '700000')!,
                  label: item.description,
                  debit: 0,
                  credit: item.amount,
                  tenantId: invoice.tenantId,
                })),
                // Credit TVA
                {
                  lineNumber: invoice.items.length + 2,
                  accountId: tvaAccount.id,
                  label: `TVA sur facture ${invoice.invoiceNumber}`,
                  debit: 0,
                  credit: invoice.taxAmount,
                  tenantId: invoice.tenantId,
                },
              ],
            },
          },
        });

        // Update invoice
        await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            status: 'FINALIZED',
            finalizedAt: new Date(),
            pieceId: piece.id,
          },
        });

        return piece;
      });

      return { success: true, pieceId: result.id };
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

## PDF Generation

```typescript
// lib/utils/pdf.ts

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Invoice, InvoiceItem, Tenant } from '@prisma/client';

type InvoiceWithDetails = Invoice & {
  items: InvoiceItem[];
  tenant: Tenant;
};

export class InvoicePDFGenerator {
  static generate(invoice: InvoiceWithDetails): Buffer {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Company header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.tenant.companyName, 15, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (invoice.tenant.address) {
      doc.text(invoice.tenant.address, 15, 28);
    }
    if (invoice.tenant.phone) {
      doc.text(`Tél: ${invoice.tenant.phone}`, 15, 35);
    }
    if (invoice.tenant.nif) {
      doc.text(`NIF: ${invoice.tenant.nif}`, 15, 42);
    }

    // Invoice title
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURE', pageWidth - 15, 20, { align: 'right' });

    doc.setFontSize(12);
    doc.text(invoice.invoiceNumber, pageWidth - 15, 30, { align: 'right' });

    // Customer info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Client:', 15, 60);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(invoice.customerName, 15, 68);
    if (invoice.customerAddress) {
      doc.text(invoice.customerAddress, 15, 75, { maxWidth: 80 });
    }
    if (invoice.customerTaxId) {
      doc.text(`NIF: ${invoice.customerTaxId}`, 15, 90);
    }

    // Dates
    doc.setFontSize(10);
    const issueDate = new Date(invoice.issueDate).toLocaleDateString('fr-DZ');
    const dueDate = new Date(invoice.dueDate).toLocaleDateString('fr-DZ');
    doc.text(`Date: ${issueDate}`, pageWidth - 60, 60);
    doc.text(`Échéance: ${dueDate}`, pageWidth - 60, 68);

    // Items table
    const tableData = invoice.items.map((item) => [
      item.description,
      item.quantity.toString(),
      `${item.unitPrice.toFixed(2)} DA`,
      `${item.taxRate.toFixed(0)}%`,
      `${item.amount.toFixed(2)} DA`,
    ]);

    autoTable(doc, {
      startY: 110,
      head: [['Description', 'Qté', 'Prix Unitaire', 'TVA', 'Montant']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold',
      },
    });

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY || 110;
    const totalsStartY = finalY + 10;
    const totalsX = pageWidth - 80;

    doc.setFontSize(10);
    doc.text('Sous-total (HT):', totalsX, totalsStartY);
    doc.text(`${invoice.subtotal.toFixed(2)} DA`, pageWidth - 15, totalsStartY, { align: 'right' });

    doc.text(`TVA (${invoice.taxRate.toFixed(0)}%):`, totalsX, totalsStartY + 10);
    doc.text(`${invoice.taxAmount.toFixed(2)} DA`, pageWidth - 15, totalsStartY + 10, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Total (TTC):', totalsX, totalsStartY + 22);
    doc.text(`${invoice.totalAmount.toFixed(2)} DA`, pageWidth - 15, totalsStartY + 22, { align: 'right' });

    // Convert to buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    return pdfBuffer;
  }
}
```

---

## Invoice API Route

```typescript
// app/api/invoices/[id]/pdf/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { InvoicePDFGenerator } from '@/lib/utils/pdf';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        items: { orderBy: { lineNumber: 'asc' } },
        tenant: true,
      },
    });

    if (!invoice) {
      return new NextResponse('Invoice not found', { status: 404 });
    }

    // Verify user has access
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tenantId: true },
    });

    if (user?.tenantId !== invoice.tenantId) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const pdfBuffer = InvoicePDFGenerator.generate(invoice);

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
```

---

## Next Steps

- [Reporting](./07-reporting.md) - Balance and reconciliation services
- [Frontend Components](./08-frontend-components.md) - UI components
