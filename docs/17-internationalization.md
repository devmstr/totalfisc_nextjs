# Internationalization (i18n) & RTL Standards

Senior-level internationalization architecture using `next-intl` with Next.js 15 App Router.

---

## 🌍 Supported Languages

| Locale | Language | Direction |
|--------|----------|-----------|
| `fr`   | French   | LTR       |
| `ar`   | Arabic   | RTL       |

---

## 🏗️ Architecture Overview

```
src/
├── app/
│   └── [locale]/        # Dynamic segment for locale
│       ├── layout.tsx   # Provides NextIntlClientProvider
│       └── ...
├── i18n/
│   ├── routing.ts       # Locale definitions
│   ├── request.ts       # Server-side message loading
│   └── navigation.ts    # Locale-aware Link/redirect
├── lib/
│   └── i18n/
│       └── locales.ts   # Standard wrapper for useTranslations
├── messages/            # Centralized translations
│   ├── fr.json
│   └── ar.json
└── middleware.ts        # Locale detection & URL rewriting
```

---

## 📜 Mandatory Standards

### 1. RTL Compatibility (Mandatory)
All UI must be fully compatible with **LTR and RTL** layouts.

- **Direction-Agnostic Patterns**: Use `start/end` mental model instead of `left/right`.
- **CSS Logical Properties**: Use `inline-start`, `margin-block`, etc.
- **Icon Handling**: Chevrons/arrows that imply direction must flip appropriately in RTL.
- **Verification Checklist**:
  - [ ] Component is visually correct in both `dir="ltr"` and `dir="rtl"`.
  - [ ] No overlapped or incorrect padding/margins in RTL.
  - [ ] Dropdowns and tooltips align correctly in RTL.
  - [ ] Tables and forms remain usable in RTL.

### 2. Internationalization (Mandatory)
All user-facing strings must be internationalized. No hardcoded strings are allowed in components.

- **Standard Hook**: Use the wrapper from `@/lib/i18n/locales`.
  ```typescript
  import { useTranslations } from '@/lib/i18n/locales'
  ```
- **Translation Keys**: Use stable, dot-delimited keys (e.g., `employees.new.title`).
- **Dynamic Values**: Use interpolation (e.g., `t('welcome', { name: 'Admin' })`).

---

## 💻 Usage Patterns

### Server Components
```typescript
import { getTranslations } from 'next-intl/server';

export default async function Page() {
  const t = await getTranslations('dashboard');
  return <h1>{t('title')}</h1>;
}
```

### Client Components (Standard)
```typescript
'use client';
import { useTranslations } from '@/lib/i18n/locales';

export default function Button() {
  const t = useTranslations('common');
  return <button>{t('save')}</button>;
}
```

---

## 📍 Required Workflow for New Text

1. **Choose Key**: Select a descriptive dot-delimited key.
2. **Add to All Locales**: Update both `src/messages/fr.json` and `src/messages/ar.json`.
3. **Implementation**: Use `t('your.key')` in the component using the mandatory hook.

---

## ⛔ Anti-Patterns (Do NOT do these)

- ❌ Hardcoding strings in components.
- ❌ Mixing hardcoded and translated strings.
- ❌ Shipping components with missing keys for any locale.
- ❌ Concatenating UI strings manually (use interpolation instead).

---

## 🔗 Related Documentation
- [Frontend Standard](./08-frontend-components.md)
- [Tables Standard](./12-tables-standard.md)
- [Forms Standard](./11-forms-standard.md)
