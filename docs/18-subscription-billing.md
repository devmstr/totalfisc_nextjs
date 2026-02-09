# Subscription & Billing Module

This document outlines the multi-tenant SaaS pricing architecture for TOTALFisc, designed to serve both Accounting Firms (Cabinets) and Direct Companies (SMEs).

## Overview

The subscription model is a hybrid of **usage-based** and **seat-based** pricing, ensuring scalability from solo practitioners to large enterprises.

### Customer Segments

1.  **Accounting Firms (Cabinets)**: Manage multiple client companies (tenants).
2.  **Direct Companies**: Manage their own single company.

## Pricing Tiers

### 1. STARTER 🌱

_Target: Solo accountants, micro-businesses, startups._

- **Price**: 4,990 DA/month or 49,900 DA/year.
- **Tenants**: 1 Company.
- **Users**: 2 Users (Owner + 1 Collaborator).
- **Volume Limits**:
  - 200 Transactions/month.
  - 50 Invoices/month.
  - 100 Auxiliaries.
- **Storage**: 2 GB.
- **Key Features**: Core Accounting, Invoice Management, G50.
- **Support**: Email (48h).

### 2. PROFESSIONAL 💼

_Target: Small accounting offices, SMEs with dedicated bookkeepers._

- **Price**: 9,990 DA/month or 99,900 DA/year.
- **Tenants**: Up to 5 Companies.
- **Users**: 5 Users Total (Max 3 per tenant).
- **Volume Limits**:
  - 1,000 Transactions/month.
  - 250 Invoices/month.
  - 500 Auxiliaries.
- **Storage**: 10 GB.
- **Key Features**: Includes Starter + Multi-user, Advanced Reports, Liasse Fiscale, Budget Forecasting.
- **Support**: Priority Email (24h).

### 3. CABINET (Enterprise) 🏢

_Target: Large accounting firms, multi-entity groups._

- **Price**: 24,990 DA/month (Base) + Volume Pricing.
- **Base Includes**: 15 Tenants, 15 Users.
- **Volume Pricing**:
  - +1,490 DA per additional tenant.
  - +990 DA per additional user.
  - Bulk discounts available (15-35%).
- **Limits**: Virtually Unlimited (Software limits set to 999/999,999).
- **Storage**: 100 GB.
- **Key Features**: Includes Professional + White-labeling, API Access, SSO, Multi-entity consolidation, Priority Phone Support.

## Technical Architecture

### Database Schema

The system uses Prisma with PostgreSQL. Key models include:

- **Organization**: The billing entity.
- **Subscription**: Links Organization to a Plan and Billing Cycle.
- **SubscriptionLimits**: Snapshot of current plan limits (allows for custom overrides).
- **UsageMetrics**: Tracks real-time usage (reset monthly).
- **UsageSnapshot**: Historical usage data for analytics.

### Feature Gating

Feature availability is controlled via the `SubscriptionService`.

**Key Concepts:**

- **Hard Limits**: Absolute caps on resources (e.g., Max Tenants). Actions are blocked when reached.
- **Soft Limits**: Usage tracking that may trigger alerts or overage charges (Cabinet plan).
- **Feature Flags**: Boolean toggles for specific capabilities (e.g., `apiAccess`, `customBranding`).

### Service Layer

`SubscriptionService` handles:

1.  **Plan Configuration**: Returns default limits for each tier.
2.  **Permission Checks**: `canPerformAction(orgId, action)` verifies limits before writes.
3.  **Feature Checks**: `hasFeature(orgId, feature)` guards specific functionality.
4.  **Usage Tracking**: `incrementUsage(orgId, metric)` updates counters.
5.  **Billing Cycle**: `resetMonthlyUsage(subId)` resets counters at period end.

### Middleware Implementation

Route protection is implemented via Next.js middleware and Server Actions:

- **Route Guards**: Redirect to upgrade page if accessing restricted features.
- **Action Guards**: Check limits before executing database writes (e.g., creating a transaction).

## User Interface

- **Upgrade Banner**: Contextual alerts when features are locked.
- **Usage Meter**: Visual progress bars for resource consumption.
- **Subscription Settings**: Dashboard for plan management, usage overview, and billing history.

## Future Considerations

- **Downgrade Logic**: Handling data when moving to a lower tier (e.g., archiving excess tenants).
- **Data Retention**: Policy for cancelled subscriptions.
- **Automated Payments**: Integration with local payment gateways (Chargily, Satim).
