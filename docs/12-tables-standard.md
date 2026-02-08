# Tables Standard

Standards for building consistent, accessible, URL-driven data tables.

**Stack:** TanStack Table v8 + nuqs + Zod + shadcn/ui

---

## File Structure

Each table is colocated in its feature folder:

```
src/app/(dashboard)/employees/_components/employees-table/
├── columns.tsx                    # Column definitions
├── data-table.tsx                 # Core TanStack wiring
├── data-table-toolbar.tsx         # Search, filters, bulk actions
├── data-table-view-options.tsx    # Column visibility
├── data-table-pagination.tsx      # Pagination controls
├── data-table-faceted-filter.tsx  # Multi-select filters
├── data-table-skeleton.tsx        # Loading state
└── schema.ts                      # Zod schemas + types
```

Rules:
- ❌ No "God Components"
- ✅ One responsibility per file
- ✅ Feature-first colocation

---

## Type Safety (Zod as Source of Truth)

```typescript
// schema.ts
export const EmployeeRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['active', 'inactive']),
  department: z.string(),
  createdAt: z.string(),
});

export type EmployeeRow = z.infer<typeof EmployeeRowSchema>;
```

**Critical Rule:**
> `column.id` MUST match Zod schema keys

---

## Server/Client Split

| Server Component | Client Component |
|------------------|------------------|
| Fetch data | Own table state |
| Filter/sort/paginate | Render UI |
| Validate searchParams | Handle interactions |

### Flow

1. URL changes (search/filter/page/sort)
2. Server Component refetches data
3. Client table re-renders

---

## URL State (Source of Truth)

### URL Conventions

| State | URL Pattern |
|-------|-------------|
| Search | `?q=term` |
| Pagination | `?page=1&limit=10` |
| Multi-filter | `?status=active,pending` |
| Sorting | `?sort=createdAt.desc` |

### nuqs Hook

```typescript
import { useQueryStates, parseAsInteger, parseAsString } from 'nuqs';

export function useEmployeesTableQueryState() {
  return useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(10),
      q: parseAsString.withDefault(''),
      status: parseAsString.withDefault(''),
      sort: parseAsString.withDefault('createdAt.desc'),
    },
    { shallow: false } // Triggers server refetch
  );
}
```

---

## Component Specifications

### columns.tsx

```typescript
'use client';

export const columns: ColumnDef<EmployeeRow>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'status', header: 'Status' },
  // ...
];
```

### data-table.tsx

- Create TanStack table instance
- Use `manualPagination`, `manualSorting`, `manualFiltering`
- Controlled state for `sorting`, `rowSelection`, `columnVisibility`

### data-table-toolbar.tsx

- Debounced search (300ms)
- Faceted filters
- Reset button
- **Critical:** When `q` changes → reset `page` to 1

### data-table-pagination.tsx

- Rows-per-page selector
- Prev/Next/First/Last buttons
- If `pageCount` unknown → Next/Previous only

---

## Data Contract

### Server Must Provide

```typescript
{
  rows: TData[];
  pageCount: number; // or totalCount
}
```

### Client Usage

```tsx
<DataTable data={rows} pageCount={pageCount} />
```

---

## Loading & Mobile

### Skeleton (Mandatory)

- Match column count
- Match row height
- Prevent layout shift

### Mobile Strategy (Required)

Every table must define:
- Horizontal scroll via `ScrollArea`, OR
- Card/List layout under 768px

> A table with no mobile strategy is incomplete.

---

## Definition of Done

A table is complete when:

- [x] URL represents full view state
- [x] Back/Forward restores state
- [x] Server refetch on interaction
- [x] Skeleton prevents layout shift
- [x] Mobile UX defined
- [x] Zod schema drives types
- [x] No God Components

---

## Next Steps

- [Forms Standard](./11-forms-standard.md) - Form patterns
- [Frontend Components](./08-frontend-components.md) - UI components
