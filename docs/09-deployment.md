# Deployment

Environment configuration and deployment guide.

---

## Environment Variables

```bash
# .env.example

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/totalfisc"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Application
APP_NAME="TOTALFisc"
APP_URL="http://localhost:3000"

# Email (optional for MVP)
# RESEND_API_KEY="re_xxx"
# EMAIL_FROM="noreply@totalfisc.com"

# File Storage (optional for MVP)
# AWS_S3_BUCKET="totalfisc-files"
# AWS_ACCESS_KEY_ID="xxx"
# AWS_SECRET_ACCESS_KEY="xxx"
# AWS_REGION="eu-west-1"
```

### Generating Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32
```

---

## Database Setup

### Local Development

```bash
# Create database
psql -U postgres
CREATE DATABASE totalfisc;
\q

# Run migrations
npx prisma migrate dev

# Seed initial data
npx prisma db seed
```

### Production

Use a managed PostgreSQL service:

- **Neon** (recommended for Vercel)
- **Supabase**
- **Railway**
- **AWS RDS**

---

## Vercel Deployment

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

### 2. Deploy

```bash
# First deployment
vercel

# Set environment variables
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL

# Deploy to production
vercel --prod
```

### 3. Vercel Configuration

Create `vercel.json` in project root:

```json
{
  "buildCommand": "prisma generate && next build",
  "framework": "nextjs",
  "regions": ["cdg1"]
}
```

---

## Production Checklist

### Security

- [ ] Generate strong `NEXTAUTH_SECRET`
- [ ] Use SSL/TLS for database connection
- [ ] Enable rate limiting
- [ ] Configure CORS properly

### Database

- [ ] Run `prisma migrate deploy` (not `dev`)
- [ ] Set up database backups
- [ ] Configure connection pooling

### Performance

- [ ] Enable caching headers
- [ ] Configure CDN for static assets
- [ ] Set up error monitoring (Sentry)

---

## Docker (Optional)

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## Next Steps

- [Roadmap](./10-roadmap.md) - Future features and enhancements
