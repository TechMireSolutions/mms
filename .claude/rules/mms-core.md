---
description: MMS stack, boundaries, domain rules, and MMS-specific edit discipline
---

# MMS Core

Madrasa Management System monorepo — applies on every task.

## Layout

```
apps/frontend/     React 19 + Vite 8
apps/backend/      Fastify 5 + PostgreSQL
packages/shared/   @mms/shared
```

- **pnpm** at root: `pnpm dev`, `pnpm build`, `pnpm typecheck`
- Env: `VITE_API_URL` (frontend); `JWT_SECRET`, `DATABASE_URL` (backend)

## Boundaries

| Rule | Detail |
|------|--------|
| Shared logic | `@mms/shared` only |
| Cross-module FE imports | Banned between feature modules |
| FE ↔ BE | DTOs via `@mms/shared` only |
| Inter-module data | `local-database-update` event or DTOs — no global singletons |
| `turbo.json` cache | Immutable |

## Stack (fixed)

- **BE:** Fastify + tsx · Drizzle + PostgreSQL · no raw SQL
- **FE:** React 19 · Vite · Tailwind v4 · Radix/shadcn · TanStack Query · Framer Motion · Recharts · Lucide
- **Icons:** Lucide only · **Animations:** Framer Motion only

## Real-time & polling

| Allowed | Banned |
|---------|--------|
| `local-database-update` event bus (current) | `setInterval` / polling loops |
| WebSockets / SSE (target for live server push) | Repeated `fetch` in `useEffect` without Query |

## Data authority (trajectory)

| Phase | Pattern | Owner |
|-------|---------|--------|
| **Current** | `localStorage` + sync to PostgreSQL JSON documents | `mms-data-layer.md` |
| **New REST features** | Server authoritative + TanStack Query cache | `mms-query.md` |
| **Target** | Per-entity API resources; localStorage as offline cache only | `mms-migration-status.md` |

## Platform rules (modern app)

| Topic | Owner |
|-------|--------|
| Dependencies & latest stack | `mms-dependencies.md` |
| File structure | `mms-structure.md` |
| Naming (files, symbols, routes) | `mms-naming.md` |
| DRY / single source of truth | `mms-dry.md` |
| Security, rate limits, tenant isolation | `mms-security.md` |
| Testing & CI tests | `mms-testing.md` |
| Logging, health, error boundaries | `mms-observability.md` |
| Accessibility baseline | `mms-a11y.md` |

## MMS edit discipline

1. Read implicated files before editing; validate against `@mms/shared` and `schema.ts`.
2. New UI must be config-driven (field/tab/column registry).
3. Remove unused imports/dead code in the change boundary.
4. Run `pnpm typecheck` after non-trivial changes.
5. Never commit unless the user asks; never commit `.env` or credentials.

### Anti-patterns

```tsx
// ❌ Nested ContactConfigProvider — mount once in App.tsx only
<ContactConfigProvider><ContactsPage /></ContactConfigProvider>

// ❌ Frontend importing backend
import { getCollection } from '../../../backend/src/db/database';

// ✅ Shared types
import type { Contact } from '@mms/shared';
```

## Hardcoding ban

No hardcoded user-facing strings, labels, colours, formats, or statuses.

| Kind | Owner |
|------|--------|
| App copy (nav, toasts, modals, settings) | **`mms-i18n.md`** — `t('key')` |
| Field/tab/status labels | Registries + `labelKey` / `StatusBadge` — **`mms-fields.md`**, **`mms-i18n.md`** |
| Theme colours | `branding` / CSS variables — **`mms-ui-visual.md`** |
| Module prefs & formats | `@mms/shared` `DEFAULT_*` + settings getters — **`mms-config.md`** |

Contacts legacy `uiStrings` is migration debt — new copy uses `appTranslations` (`mms-migration-status.md`).

## Domain

- **Contact-first persons:** See **`mms-contact-link.md`** — `contacts` canonical; module rows link by id; hydrate on read, strip on save.
- **`persona`:** Purged everywhere — residual = migration defect.
- **Phones:** E.164 on save (`parsePhoneNumber` from `@mms/shared`; backend contacts route too).
- **WhatsApp:** Only `PuppeteerWhatsAppProvider.getNumberId` — no manual toggles in UI.

## Module pages

Three tiers only — details split by concern:

- **Shell:** `mms-ui-tabs.md` (`useModuleTierTabs`, `ResponsiveAccordionTabs`, PageHeader)
- **Content scope:** `mms-module-isolation.md` (what belongs in `work` / `reports` / `setup`)
