# TOTALFisc Documentation

**Modern Algerian Accounting SaaS Platform**

Version: 1.0 MVP | Tech Stack: Next.js 15, Prisma, PostgreSQL, TypeScript

---

## 📚 Documentation Index

| # | Document | Description |
|---|----------|-------------|
| 01 | [Getting Started](./01-getting-started.md) | Prerequisites, installation, setup |
| 02 | [Architecture](./02-architecture.md) | System design, folder structure |
| 03 | [Database Schema](./03-database-schema.md) | Complete Prisma schema |
| 04 | [Accounting Core](./04-accounting-core.md) | Validation, transactions |
| 05 | [Security](./05-security.md) | Authentication & authorization |
| 06 | [Invoicing](./06-invoicing.md) | Invoice service, PDF generation |
| 07 | [Reporting](./07-reporting.md) | Balance, reconciliation |
| 08 | [Frontend](./08-frontend-components.md) | UI components |
| 09 | [Deployment](./09-deployment.md) | Environment, Vercel |
| 10 | [Roadmap](./10-roadmap.md) | V2/V3 features |
| 11 | [Forms Standard](./11-forms-standard.md) | RHF + Zod patterns |
| 12 | [Tables Standard](./12-tables-standard.md) | TanStack Table patterns |
| 13 | [SCF Chart of Accounts](./13-scf-chart-of-accounts.md) | Algerian account codes |
| 14 | [Timbre Fiscal](./14-timbre-fiscal.md) | Stamp duty calculation |
| 15 | [G50 Report](./15-g50-report.md) | Monthly TVA declaration |
| 16 | [Mobile Strategy](./16-mobile-strategy.md) | React Native prep |

---

## What is TOTALFisc?

A cloud-based accounting SaaS for Algerian businesses combining SCF compliance with modern UX.

### Core Features

- ✅ **100% SCF Compliant** - Algerian chart of accounts
- ✅ **Liasse Fiscale Ready** - Automated tax returns
- ✅ **Professional Invoicing** - Auto-accounting
- ✅ **Multi-tenant SaaS** - Cloud-based

---

## Quick Start

```bash
git clone https://github.com/your-org/totalfisc.git
cd totalfisc
npm install
cp .env.example .env.local
npx prisma migrate dev
npm run dev
```

See [Getting Started](./01-getting-started.md) for details.
# totalfisc_nextjs
