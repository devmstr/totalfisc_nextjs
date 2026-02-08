# Getting Started

## Prerequisites

- **Node.js** 18.x or later
- **PostgreSQL** 14.x or later
- **npm** or **pnpm**
- **Git**

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/totalfisc.git
cd totalfisc
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/totalfisc"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-secure-secret-here"

# Application
APP_NAME="TOTALFisc"
APP_URL="http://localhost:3000"
```

> **Tip**: Generate a secure secret with `openssl rand -base64 32`

---

## Database Setup

### 1. Create Database

```bash
# Using psql
psql -U postgres
CREATE DATABASE totalfisc;
\q
```

### 2. Run Migrations

```bash
npx prisma migrate dev
```

### 3. Seed Initial Data

The seed script creates:
- SCF Chart of Accounts (Plan Comptable)
- Default journals
- Sample tenant and admin user

```bash
npx prisma db seed
```

---

## Development

### Start Development Server

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

### Default Credentials

After seeding, use these to login:

| Email | Password |
|-------|----------|
| admin@example.com | password123 |

---

## Project Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx prisma studio` | Open Prisma database GUI |
| `npx prisma migrate dev` | Run migrations |
| `npx prisma db seed` | Seed database |

---

## Next Steps

- [Architecture](./02-architecture.md) - Understand the system design
- [Database Schema](./03-database-schema.md) - Explore the data models
- [Accounting Core](./04-accounting-core.md) - Learn the core business logic
