'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DynamicIcon } from '@/components/ui/icons'
import { toast } from 'sonner'
import { createInvoice } from '../actions'
import { TimbreFiscalService } from '@/lib/services/timbre-fiscal.service'
import { Decimal } from '@prisma/client/runtime/library'

// Schema for invoice form
const invoiceFormSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  date: z.string(),
  dueDate: z.string(),
  paymentMethod: z.string().optional(),
  isElectronicPayment: z.boolean().default(false),
  lines: z
    .array(
      z.object({
        description: z.string().min(1, 'Description is required'),
        quantity: z.number().min(0.01, 'Quantity must be positive'),
        unitPrice: z.number().min(0, 'Price must be positive'),
        taxRate: z.number().default(19)
      })
    )
    .min(1, 'At least one line is required')
})

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>

export default function NewInvoicePage() {
  const t = useTranslations('invoices')
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  // Initialize form
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      isElectronicPayment: false,
      lines: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 19 }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lines'
  })

  // Watch values for calculation
  const lines = form.watch('lines')
  const isElectronicPayment = form.watch('isElectronicPayment')

  // Calculate totals
  const subtotal = lines.reduce(
    (sum, line) => sum + line.quantity * line.unitPrice,
    0
  )
  const taxAmount = lines.reduce(
    (sum, line) => sum + line.quantity * line.unitPrice * (line.taxRate / 100),
    0
  )
  const totalTTC = subtotal + taxAmount

  // Calculate Timbre Fiscal
  const timbreFiscal = TimbreFiscalService.calculate(
    new Decimal(totalTTC),
    isElectronicPayment
  ).toNumber()
  const finalTotal = totalTTC + timbreFiscal

  const onSubmit = async (data: InvoiceFormValues) => {
    setIsPending(true)
    try {
      const result = await createInvoice(data)
      if (result.success) {
        toast.success(t('createdSuccess'))
        router.push('/invoices')
      } else {
        toast.error(result.error || t('createError'))
      }
    } catch (error) {
      toast.error(t('createError'))
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          {t('createInvoice')}
        </h1>
        <Button variant="outline" onClick={() => router.back()}>
          {t('cancel')}
        </Button>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('details')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerId">{t('customer')}</Label>
                <Input
                  {...form.register('customerId')}
                  placeholder="Select Customer (ID)"
                />
                {form.formState.errors.customerId && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.customerId.message}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">{t('date')}</Label>
                  <Input type="date" {...form.register('date')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">{t('dueDate')}</Label>
                  <Input type="date" {...form.register('dueDate')} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('payment')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                <div className="space-y-0.5">
                  <Label className="text-base">{t('electronicPayment')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('electronicPaymentDesc')}
                  </p>
                </div>
                <Switch
                  checked={isElectronicPayment}
                  onCheckedChange={(checked) =>
                    form.setValue('isElectronicPayment', checked)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">{t('paymentMethod')}</Label>
                <Input
                  {...form.register('paymentMethod')}
                  placeholder="e.g. Bank Transfer, Cash"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>{t('items')}</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  description: '',
                  quantity: 1,
                  unitPrice: 0,
                  taxRate: 19
                })
              }
            >
              <DynamicIcon name="Plus" className="mr-2 h-4 w-4" />
              {t('addItem')}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid gap-4 md:grid-cols-12 items-end border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="md:col-span-6 space-y-2">
                    <Label>{t('description')}</Label>
                    <Input {...form.register(`lines.${index}.description`)} />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label>{t('quantity')}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...form.register(`lines.${index}.quantity`, {
                        valueAsNumber: true
                      })}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label>{t('unitPrice')}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...form.register(`lines.${index}.unitPrice`, {
                        valueAsNumber: true
                      })}
                    />
                  </div>
                  <div className="md:col-span-1 space-y-2">
                    <Label>{t('taxRate')}</Label>
                    <Input
                      type="number"
                      {...form.register(`lines.${index}.taxRate`, {
                        valueAsNumber: true
                      })}
                    />
                  </div>
                  <div className="md:col-span-1 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-red-500"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                    >
                      <DynamicIcon name="Trash" className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Totals Summary */}
        <div className="flex justify-end">
          <Card className="w-full md:w-1/3">
            <CardContent className="pt-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t('subtotal')}</span>
                <span>{subtotal.toFixed(2)} DA</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{t('taxAmount')}</span>
                <span>{taxAmount.toFixed(2)} DA</span>
              </div>
              <div className="flex justify-between text-sm font-medium pt-2 border-t">
                <span>{t('totalTTC')}</span>
                <span>{totalTTC.toFixed(2)} DA</span>
              </div>

              {/* Timbre Fiscal Highlight */}
              <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-md font-medium">
                <div className="flex items-center gap-2">
                  <span>{t('timbreFiscal')}</span>
                  {isElectronicPayment && (
                    <span className="text-[10px] bg-emerald-200 dark:bg-emerald-800 px-1 rounded">
                      EXEMPT
                    </span>
                  )}
                </div>
                <span>{timbreFiscal.toFixed(2)} DA</span>
              </div>

              <div className="flex justify-between text-lg font-bold pt-4 border-t">
                <span>{t('totalToPay')}</span>
                <span>{finalTotal.toFixed(2)} DA</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" onClick={() => router.back()}>
            {t('cancel')}
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? t('saving') : t('createInvoice')}
          </Button>
        </div>
      </form>
    </div>
  )
}
