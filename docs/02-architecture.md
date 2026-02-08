# System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  Next.js 15 App Router (React Server Components + Client)   │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Dashboard   │  │  Accounting  │  │  Invoicing   │       │
│  │  Pages       │  │  Pages       │  │  Pages       │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                               │
│       Server Actions + API Routes (Next.js 15)              │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Journal     │  │  Invoice     │  │  Report      │       │
│  │  Actions     │  │  Actions     │  │  Actions     │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                      │
│              Services & Validators (TypeScript)              │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Accounting  │  │  Invoice     │  │  Report      │       │
│  │  Validator   │  │  Service     │  │  Generator   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│            Prisma ORM + PostgreSQL Database                  │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Tenants     │  │  Transactions│  │  Invoices    │       │
│  │  Journals    │  │  Accounts    │  │  Reports     │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Framework** | Next.js 15 (App Router) | Full-stack React framework |
| **Language** | TypeScript | Type safety |
| **Database** | PostgreSQL | Relational database |
| **ORM** | Prisma | Database access |
| **Auth** | NextAuth.js | Authentication |
| **UI Components** | **shadcn/ui** | Accessible component library |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **Forms** | React Hook Form + Zod | Form state & validation |
| **Tables** | TanStack Table v8 | Data table management |
| **URL State** | nuqs | Type-safe query params |
| **PDF** | jsPDF | Invoice generation |
| **Icons** | Lucide React | Icon library |

---

## Core Philosophy

TOTALFisc follows a **compliance-first, ledger-centric** architecture with three principles:

1. **Journal-Driven Entry**: All transactions must originate from a journal
2. **Auxiliary-Enforced Detail**: Third-party accounts require mandatory sub-ledger links
3. **Document-Based Integrity**: The "Pièce" (document) is the master transaction unit

### Data Hierarchy

```
Tenant (Company/Dossier)
  └── Journals (Journaux)
       └── Documents (Pièces)
            └── Transaction Lines (Lignes d'écriture)
```

---

## Directory Structure

```
totalfisc/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts                    # Seed data (SCF chart of accounts)
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx         # Main dashboard layout
│   │   │   ├── page.tsx           # Dashboard home
│   │   │   ├── journals/
│   │   │   │   ├── page.tsx       # Journal list
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx   # Journal detail
│   │   │   │       └── pieces/
│   │   │   │           ├── page.tsx
│   │   │   │           ├── new/
│   │   │   │           │   └── page.tsx
│   │   │   │           └── [pieceId]/
│   │   │   │               └── page.tsx
│   │   │   ├── accounts/
│   │   │   │   ├── page.tsx       # Chart of accounts
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx   # Account ledger
│   │   │   ├── auxiliaries/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── invoices/
│   │   │   │   ├── page.tsx       # Invoice list
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx   # Create invoice
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx   # Invoice detail
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx
│   │   │   ├── products/
│   │   │   │   ├── page.tsx
│   │   │   │   └── new/
│   │   │   │       └── page.tsx
│   │   │   ├── investments/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── reports/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── balance/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── general-ledger/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── journal-report/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── fiscal/
│   │   │   │       └── page.tsx   # Liasse Fiscale
│   │   │   └── settings/
│   │   │       ├── page.tsx
│   │   │       ├── company/
│   │   │       ├── fiscal-year/
│   │   │       └── users/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   ├── invoices/
│   │   │   │   └── [id]/
│   │   │   │       └── pdf/
│   │   │   │           └── route.ts
│   │   │   └── reports/
│   │   │       └── export/
│   │   │           └── route.ts
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── table.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── select.tsx
│   │   │   ├── calendar.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── header.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── footer.tsx
│   │   ├── accounting/
│   │   │   ├── transaction-entry-form.tsx
│   │   │   ├── account-selector.tsx
│   │   │   ├── auxiliary-selector.tsx
│   │   │   ├── balance-table.tsx
│   │   │   └── ledger-view.tsx
│   │   ├── invoices/
│   │   │   ├── invoice-form.tsx
│   │   │   ├── invoice-list.tsx
│   │   │   ├── invoice-preview.tsx
│   │   │   └── invoice-pdf-template.tsx
│   │   ├── reports/
│   │   │   ├── report-filters.tsx
│   │   │   └── report-export.tsx
│   │   └── dashboard/
│   │       ├── stats-card.tsx
│   │       ├── recent-activity.tsx
│   │       └── quick-actions.tsx
│   ├── lib/
│   │   ├── prisma.ts              # Prisma client singleton
│   │   ├── auth.ts                # Authentication config
│   │   ├── validations/
│   │   │   ├── accounting.ts      # Validation rules
│   │   │   └── invoice.ts
│   │   ├── services/
│   │   │   ├── journal.service.ts
│   │   │   ├── balance.service.ts
│   │   │   ├── ledger.service.ts
│   │   │   ├── invoice.service.ts
│   │   │   ├── depreciation.service.ts
│   │   │   └── reconciliation.service.ts
│   │   ├── utils/
│   │   │   ├── accounting.ts      # Helper functions
│   │   │   ├── format.ts          # Date/number formatting
│   │   │   └── pdf.ts             # PDF utilities
│   │   └── constants/
│   │       └── scf-accounts.ts    # SCF chart of accounts
│   ├── types/
│   │   ├── accounting.ts
│   │   ├── invoice.ts
│   │   └── report.ts
│   └── hooks/
│       ├── use-tenant.ts
│       ├── use-toast.ts
│       └── use-query-helpers.ts
├── public/
│   ├── images/
│   └── templates/
├── .env.local
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## Next Steps

- [Database Schema](./03-database-schema.md) - Complete Prisma schema
- [Accounting Core](./04-accounting-core.md) - Core business logic
- [Security](./05-security.md) - Authentication & authorization
