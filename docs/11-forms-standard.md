# Forms Standard

Standards for building consistent, accessible, type-safe forms.

**Stack:** React Hook Form + Zod + shadcn/ui

---

## File Structure

### Colocation Rule

Forms live in their route folder:

```
src/app/(dashboard)/employees/new/
├── page.tsx                           # Server: fetch defaults
└── _components/
    └── forms/
        └── employee-form.tsx          # Client: form + schema
```

### Actions Location

Server actions in `_actions/`:

```
src/app/(dashboard)/employees/new/
├── _actions/
│   └── create-employee.ts             # Server action
└── _components/forms/
    └── employee-form.tsx              # Imports action
```

---

## Schema Rule (Important)

**Zod schema MUST live inside the same form file.**

```typescript
// employee-form.tsx

const employeeFormSchema = z.object({
  matricule: z.string().min(1),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email().optional(),
});

type EmployeeFormValues = z.infer<typeof employeeFormSchema>;
```

Benefits:
- Single source of truth
- No cross-file indirection
- Clear mental model: _one form = one file = one schema_

---

## RHF Setup

```typescript
const form = useForm<EmployeeFormValues>({
  resolver: zodResolver(employeeFormSchema),
  defaultValues,
});
```

Rules:
- `defaultValues` is **required**
- Validation mode defaults to `onSubmit`

---

## Field Rendering Pattern

Every field MUST use:

```tsx
<Controller
  control={form.control}
  name="firstName"
  render={({ field, fieldState }) => (
    <FormField data-invalid={fieldState.invalid}>
      <FormLabel htmlFor={field.name}>First Name</FormLabel>
      
      <Input 
        {...field} 
        id={field.name} 
        aria-invalid={fieldState.invalid} 
      />
      
      {fieldState.invalid && (
        <FormMessage>{fieldState.error?.message}</FormMessage>
      )}
    </FormField>
  )}
/>
```

### Component Wiring

| Type | Pattern |
|------|---------|
| Input/Textarea | `{...field}` |
| Select/Combobox | `value={field.value} onValueChange={field.onChange}` |
| Checkbox/Switch | `checked={!!field.value} onCheckedChange={field.onChange}` |
| Numbers | Convert manually in `onChange` |
| Dates | Store as `Date`, validate with `z.date()` |

---

## Server Action Response

### Success

```typescript
{ ok: true }
```

### Failure

```typescript
{
  ok: false,
  fieldErrors?: Record<string, string>,
  message?: string
}
```

### Error Handling

```typescript
if (!result.ok) {
  if (result.fieldErrors) {
    Object.entries(result.fieldErrors).forEach(([field, message]) => {
      form.setError(field as keyof FormValues, { message });
    });
  }
  if (result.message) {
    form.setError("root", { message: result.message });
  }
}
```

---

## UX Defaults

- ✅ Disable submit button while submitting
- ✅ Labels are mandatory (placeholders optional)
- ✅ Errors appear near the field
- ✅ Keyboard navigation works
- ✅ Add `FormDescription` for unclear fields

---

## Guardrails

| ❌ Do NOT | ✅ Do |
|-----------|-------|
| Split schema into another file | Keep schema in form file |
| Define server actions inside form | Import from `_actions/` |
| Use uncontrolled inputs | Use RHF's Controller |
| Place forms outside `_components/forms` | Colocate with route |

---

## Next Steps

- [Tables Standard](./12-tables-standard.md) - Data table patterns
- [Frontend Components](./08-frontend-components.md) - UI components
