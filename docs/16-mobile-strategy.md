# Mobile Strategy

Guidelines for building a React Native mobile app that shares code with the web platform.

---

## Recommended Mobile Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| **Framework** | React Native + Expo | File-based routing like Next.js |
| **Navigation** | Expo Router | Familiar patterns |
| **UI** | React Native Paper / Tamagui | Native components |
| **State** | TanStack Query | Same as web |
| **Forms** | React Hook Form | Same as web |
| **Validation** | Zod | Same as web |
| **Auth** | JWT from API | Mobile-compatible |

---

## Architecture for Code Sharing

### Monorepo Structure (Recommended)

```
totalfisc/
├── packages/
│   ├── shared/               # Shared code (web + mobile)
│   │   ├── types/            # TypeScript types
│   │   ├── validations/      # Zod schemas
│   │   ├── constants/        # SCF accounts, etc.
│   │   ├── utils/            # Pure functions
│   │   └── services/         # Business logic (API clients)
│   ├── web/                  # Next.js app
│   │   └── src/
│   └── mobile/               # React Native app
│       └── src/
├── prisma/                   # Database (web only)
└── package.json              # Workspace config
```

### What Goes Where

| Package | Contents |
|---------|----------|
| `shared` | Types, Zod schemas, constants, API client |
| `web` | Next.js pages, Server Actions, shadcn/ui |
| `mobile` | React Native screens, native UI components |

---

## API Layer Requirements

### Current: Server Actions (Web-Only)

```typescript
// ❌ Can't be used from mobile
'use server'
export async function createInvoice(data) { ... }
```

### Required: REST API Routes

```typescript
// ✅ Can be used from mobile
// app/api/v1/invoices/route.ts

export async function POST(request: Request) {
  const data = await request.json();
  const result = await InvoiceService.create(data);
  return Response.json(result);
}
```

### API Structure

```
src/app/api/v1/
├── auth/
│   ├── login/route.ts
│   └── refresh/route.ts
├── invoices/
│   ├── route.ts              # GET list, POST create
│   └── [id]/
│       ├── route.ts          # GET, PUT, DELETE
│       └── pdf/route.ts      # GET PDF
├── journals/
│   ├── route.ts
│   └── [id]/
│       └── pieces/route.ts
├── accounts/route.ts
└── reports/
    ├── balance/route.ts
    └── g50/route.ts
```

---

## Shared API Client

```typescript
// packages/shared/api/client.ts

import { z } from 'zod';

const API_URL = process.env.API_URL || 'https://api.totalfisc.com';

export class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  // Invoices
  async getInvoices() {
    return this.request<Invoice[]>('/v1/invoices');
  }

  async createInvoice(data: CreateInvoiceInput) {
    return this.request<Invoice>('/v1/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient();
```

---

## Authentication for Mobile

### JWT Strategy

```typescript
// Web: NextAuth with JWT
// Mobile: Store JWT in SecureStore

// packages/shared/auth/types.ts
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// Mobile: Store tokens
import * as SecureStore from 'expo-secure-store';

await SecureStore.setItemAsync('tokens', JSON.stringify(tokens));
```

### API Route for Mobile Login

```typescript
// app/api/v1/auth/login/route.ts

export async function POST(request: Request) {
  const { email, password } = await request.json();
  
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user || !await bcrypt.compare(password, user.password)) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const accessToken = jwt.sign(
    { userId: user.id, tenantId: user.tenantId },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return Response.json({ accessToken, refreshToken });
}
```

---

## Migration Checklist

### Phase 1: Prepare Web App (Do Now)

- [ ] Extract business logic to `lib/services/`
- [ ] Keep UI separate from business logic
- [ ] Add REST API routes alongside Server Actions
- [ ] Use TanStack Query for data fetching
- [ ] Store Zod schemas in shared location

### Phase 2: Create Monorepo (Before Mobile)

- [ ] Set up pnpm/npm workspaces
- [ ] Move shared code to `packages/shared`
- [ ] Configure TypeScript paths
- [ ] Test imports from both apps

### Phase 3: Build Mobile App

- [ ] Initialize Expo project
- [ ] Set up Expo Router
- [ ] Configure API client
- [ ] Implement auth flow
- [ ] Build screens using shared logic

---

## Code Sharing Examples

### Shared Validation

```typescript
// packages/shared/validations/invoice.ts

export const invoiceSchema = z.object({
  customerId: z.string().min(1),
  items: z.array(invoiceItemSchema).min(1),
  issueDate: z.date(),
  dueDate: z.date(),
});

// Used in both web and mobile
```

### Shared Types

```typescript
// packages/shared/types/invoice.ts

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: 'DRAFT' | 'FINALIZED' | 'PAID';
  totalAmount: number;
  // ...
}
```

### Shared Constants

```typescript
// packages/shared/constants/scf.ts

export const SCF_ACCOUNTS = {
  CLIENTS: '411',
  FOURNISSEURS: '401',
  TVA_COLLECTEE: '4457',
  TVA_DEDUCTIBLE: '4456',
  // ...
};
```

---

## Next Steps

- [Architecture](./02-architecture.md) - Current system design
- [Roadmap](./10-roadmap.md) - Mobile app in V2.5
