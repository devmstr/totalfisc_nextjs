# Frontend Components

UI components for the transaction entry system.

---

## Transaction Entry Form

```typescript
// components/accounting/transaction-entry-form.tsx

'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createPiece } from '@/app/(dashboard)/journals/[id]/pieces/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const lineSchema = z.object({
  lineNumber: z.number(),
  accountCode: z.string().min(1, 'Required'),
  auxiliaryId: z.string().optional(),
  label: z.string().min(1, 'Required'),
  debit: z.coerce.number().nonnegative(),
  credit: z.coerce.number().nonnegative(),
});

const formSchema = z.object({
  date: z.coerce.date(),
  reference: z.string().optional(),
  lines: z.array(lineSchema).min(2, 'Minimum 2 lines required'),
});

type FormValues = z.infer<typeof formSchema>;

interface TransactionEntryFormProps {
  journalId: string;
  onSuccess?: () => void;
}

export function TransactionEntryForm({
  journalId,
  onSuccess,
}: TransactionEntryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [balance, setBalance] = useState({ debit: 0, credit: 0 });
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      lines: [
        { lineNumber: 1, accountCode: '', label: '', debit: 0, credit: 0 },
        { lineNumber: 2, accountCode: '', label: '', debit: 0, credit: 0 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lines',
  });

  const handleAddLine = () => {
    append({
      lineNumber: fields.length + 1,
      accountCode: '',
      label: '',
      debit: 0,
      credit: 0,
    });
  };

  const calculateBalance = (values: FormValues) => {
    const totalDebit = values.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = values.lines.reduce((sum, line) => sum + line.credit, 0);
    setBalance({ debit: totalDebit, credit: totalCredit });
  };

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);

    const result = await createPiece({
      journalId,
      ...values,
    });

    if (result.success) {
      toast({
        title: 'Success',
        description: 'Transaction created successfully',
      });
      form.reset();
      onSuccess?.();
    } else {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    }

    setIsSubmitting(false);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        onChange={() => calculateBalance(form.getValues())}
        className="space-y-6"
      >
        {/* Header: Date & Reference */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={field.value?.toISOString().split('T')[0]}
                    onChange={(e) => field.onChange(new Date(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="reference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reference</FormLabel>
                <FormControl>
                  <Input placeholder="FACT N°001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Transaction Lines */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Transaction Lines</h3>
            <Button type="button" onClick={handleAddLine} variant="outline">
              Add Line
            </Button>
          </div>

          <div className="space-y-2">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-12 gap-2 items-start border-b pb-2"
              >
                <div className="col-span-1 flex items-center justify-center pt-8">
                  <span className="font-mono text-sm">{index + 1}</span>
                </div>

                <div className="col-span-2">
                  <Label>Account</Label>
                  <Input
                    {...form.register(`lines.${index}.accountCode`)}
                    placeholder="512000"
                  />
                </div>

                <div className="col-span-4">
                  <Label>Description</Label>
                  <Input
                    {...form.register(`lines.${index}.label`)}
                    placeholder="Transaction description"
                  />
                </div>

                <div className="col-span-2">
                  <Label>Debit</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register(`lines.${index}.debit`)}
                  />
                </div>

                <div className="col-span-2">
                  <Label>Credit</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register(`lines.${index}.credit`)}
                  />
                </div>

                <div className="col-span-1 flex items-end pb-2">
                  {index > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                    >
                      ×
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Balance Indicator */}
          <div className="flex justify-end gap-6 text-sm font-mono p-4 bg-gray-50 rounded">
            <div
              className={
                balance.debit !== balance.credit
                  ? 'text-red-600 font-semibold'
                  : 'text-green-600'
              }
            >
              Debit: {balance.debit.toFixed(2)} DA
            </div>
            <div
              className={
                balance.debit !== balance.credit
                  ? 'text-red-600 font-semibold'
                  : 'text-green-600'
              }
            >
              Credit: {balance.credit.toFixed(2)} DA
            </div>
            {balance.debit !== balance.credit && (
              <div className="text-red-600 font-bold">
                Diff: {Math.abs(balance.debit - balance.credit).toFixed(2)} DA
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting || balance.debit !== balance.credit}
          >
            {isSubmitting ? 'Saving...' : 'Create Transaction'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

---

## Key Features

- **Real-time Balance Calculation** - Shows debit/credit totals as you type
- **Validation** - Enforces minimum 2 lines, balance requirement
- **Add/Remove Lines** - Dynamic line management
- **Account Code Entry** - Fast data entry with keyboard navigation

---

## Component Dependencies

| Component | Source |
|-----------|--------|
| `Button`, `Input`, `Label` | shadcn/ui |
| `Form`, `FormField` | react-hook-form |
| `useToast` | Custom hook |
| `createPiece` | Server action |

---

## Next Steps

- [Deployment](./09-deployment.md) - Environment and deployment guide
- [Roadmap](./10-roadmap.md) - Future features
