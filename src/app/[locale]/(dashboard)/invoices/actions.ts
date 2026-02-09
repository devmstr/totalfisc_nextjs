'use server'

import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { Decimal } from 'decimal.js'
import { TimbreFiscalService } from '@/lib/services/timbre-fiscal.service'

const createInvoiceSchema = z.object({
  customerId: z.string().min(1),
  date: z.string(),
  dueDate: z.string(),
  paymentMethod: z.string().optional(),
  isElectronicPayment: z.boolean(),
  lines: z.array(
    z.object({
      description: z.string().min(1),
      quantity: z.number().positive(),
      unitPrice: z.number().min(0),
      taxRate: z.number().min(0)
    })
  )
})

export async function createInvoice(data: z.infer<typeof createInvoiceSchema>) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tenantId: true }
    })

    if (!user || !user.tenantId) {
      return { success: false, error: 'User or tenant not found' }
    }

    const validated = createInvoiceSchema.parse(data)

    // Fetch customer details for snapshot
    const customer = await prisma.auxiliary.findUnique({
      where: { id: validated.customerId }
    })

    if (!customer) {
      return { success: false, error: 'Customer not found' }
    }

    // Calculate totals on server
    let subtotal = new Decimal(0)
    let taxAmount = new Decimal(0)

    const lines = validated.lines.map((line, index) => {
      const quantity = new Decimal(line.quantity)
      const unitPrice = new Decimal(line.unitPrice)
      const taxRate = new Decimal(line.taxRate)

      const lineTotal = quantity.mul(unitPrice)
      const lineTax = lineTotal.mul(taxRate).div(100)

      subtotal = subtotal.add(lineTotal)
      taxAmount = taxAmount.add(lineTax)

      return {
        lineNumber: index + 1,
        description: line.description,
        quantity: quantity,
        unitPrice: unitPrice,
        taxRate: taxRate,
        amount: lineTotal
      }
    })

    const totalTTC = subtotal.add(taxAmount)

    // Calculate Timbre Fiscal
    const timbreFiscal = TimbreFiscalService.calculate(
      totalTTC,
      validated.isElectronicPayment
    )
    const totalAmount = totalTTC.add(timbreFiscal)
    const isTimbreExempt = TimbreFiscalService.isExempt(
      totalTTC,
      validated.isElectronicPayment
    )

    // Get next invoice number
    // Find the last invoice to increment number
    const lastInvoice = await prisma.invoice.findFirst({
      where: { tenantId: user.tenantId },
      orderBy: { invoiceNumber: 'desc' } // Assuming invoiceNumber is the field
    })

    const currentYear = new Date().getFullYear()
    let nextSequence = 1

    // improved sequence logic: INV-YYYY-XXXXX
    if (
      lastInvoice &&
      lastInvoice.invoiceNumber.startsWith(`INV-${currentYear}-`)
    ) {
      const parts = lastInvoice.invoiceNumber.split('-')
      if (parts.length === 3) {
        const seq = parseInt(parts[2])
        if (!isNaN(seq)) {
          nextSequence = seq + 1
        }
      }
    }

    const nextNumber = `INV-${currentYear}-${String(nextSequence).padStart(5, '0')}`

    // Create Invoice with nested items
    const invoice = await prisma.invoice.create({
      data: {
        tenantId: user.tenantId,
        invoiceNumber: nextNumber,
        issueDate: new Date(validated.date),
        dueDate: new Date(validated.dueDate),
        customerId: validated.customerId,

        // Snapshot data
        customerName: customer.label,
        customerAddress: customer.address,
        customerTaxId: customer.taxId,
        customerRib: customer.rib,

        status: 'DRAFT',

        // Financials
        subtotal,
        taxRate: new Decimal(19), // This might need to be dynamic or calculated average
        taxAmount,
        timbreFiscal,
        isTimbreExempt,
        totalAmount,
        currency: 'DZD',

        paymentMethod: validated.paymentMethod,

        items: {
          create: lines
        }
      }
    })

    revalidatePath('/invoices')
    return { success: true, data: invoice }
  } catch (error) {
    console.error('Failed to create invoice:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create invoice'
    }
  }
}
