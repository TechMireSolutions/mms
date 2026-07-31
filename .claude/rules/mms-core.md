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
| Inter-module data | Prefer batch `/resolve` + Query; `local-database-update` for settings/legacy local writes — no global singletons |
| `turbo.json` cache | Immutable |

## Stack (current)

Lists the **current** stack agents should target. Freshness / upgrades → `mms-dependencies.md`.

- **BE:** Fastify + tsx · Drizzle + PostgreSQL · no raw `pg` / ad-hoc query strings in controllers (approved Drizzle `sql` fragments OK for RLS `SET LOCAL` and JSONB merge — `mms-data-layer.md`)
- **FE:** React 19 · Vite · Tailwind v4 · Radix/shadcn · TanStack Query · Framer Motion · Recharts · Lucide
- **Icons:** Lucide only · **Animations:** Framer Motion only

## Real-time & polling

| Allowed | Banned |
|---------|--------|
| `local-database-update` event bus (current) | `setInterval` / polling loops |
| WebSockets / SSE (target for live server push) | Repeated `fetch` in `useEffect` without Query |

Do not invent half-polling hybrids or ad-hoc WS clients until the migration gap lands (`mms-migration-status.md`).

## Data authority (trajectory)

| Phase | Pattern | Owner |
|-------|---------|--------|
| **Current** | Per-entity REST + TanStack Query | `mms-data-layer.md` |
| **Target** | localStorage as offline cache only; live server push via WS/SSE; drop remaining hybrid/live-collection report panels | `mms-migration-status.md` |

## Tenant write invariant

Any new tenant write path must use **`authenticateTenant`** + transaction-scoped RLS (`SET LOCAL`) + `can()` / collection permission. Never trust client-supplied `workspaceSubdomain` or authz `userId`.

## Validation SSOT

Shared Zod schemas live in `@mms/shared`. FE forms and BE `parseRequest` must consume the same shapes — do not fork request/response schemas per app.

## Platform rules (modern app)

| Topic | Owner |
|-------|--------|
| Dependencies & latest stack | `mms-dependencies.md` |
| File structure & naming | `mms-structure-naming.md` |
| DRY / single source of truth | `mms-dry.md` |
| Security, rate limits, tenant isolation | `mms-auth-security.md` |
| Testing & CI tests | `mms-testing-observability.md` |
| Logging, health, error boundaries | `mms-testing-observability.md` |
| Accessibility baseline | `mms-ui-ux-design.md` |

## Performance (agent-checkable)

- Route-lazy heavy deps (charts, PDF, xlsx, editors) — do not grow the initial Work-tier bundle with report-only libs.
- Declare size on media/charts to avoid CLS — `mms-ui-ux-design.md`.

## MMS edit discipline

1. Read implicated files before editing; validate against `@mms/shared` and `schema.ts`.
2. New UI must be config-driven (field/tab/column registry).
3. Remove unused imports/dead code in the change boundary.
4. Run `pnpm typecheck` after non-trivial changes; completion review per `mms-completion-review.md`.
5. Never commit unless the user asks; never commit `.env` or credentials.
6. Do not expand into migration-status “Recently Resolved” items unless the task requires them.

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
| App copy (nav, toasts, modals, settings) | **`mms-settings-i18n.md`** — `t('key')` |
| Field/tab/status labels | Registries + `labelKey` / `StatusBadge` — **`mms-fields.md`**, **`mms-settings-i18n.md`** |
| Theme colours | `branding` / CSS variables — **`mms-ui-ux-design.md`** |
| Module prefs & formats | `@mms/shared` `DEFAULT_*` + settings getters — **`mms-settings-i18n.md`** |
| Platform apex locale | **English/LTR only** — `shouldForcePlatformEnglish` — **`mms-settings-i18n.md`** |
| Unknown tenant host | Hard-redirect to apex `/tenant-not-found?subdomain=…` — **never** stay on bad host or open `/settings` — **`mms-settings-i18n.md`**, **`mms-ui-ux-design.md`** §8 |

Contacts legacy `uiStrings` is migration debt — new copy uses `appTranslations` (`mms-migration-status.md`).

## Domain

- **Contact-first persons:** `contacts` canonical; module rows link by id; hydrate on read, strip on save.
- **`persona`:** Purged everywhere — residual = migration defect.
- **Phones:** E.164 on save (`parsePhoneNumber` from `@mms/shared`; backend contacts route too).
- **WhatsApp:** Only `PuppeteerWhatsAppProvider.getNumberId` — no manual toggles in UI.

## Module pages

Three tiers only — details split by concern:

- **Shell & universal behaviour:** `mms-module-architecture.md`
- **Shell components:** `mms-ui-ux-design.md` (`useModuleTierTabs`, `ResponsiveAccordionTabs`, PageHeader)
- **Content scope:** `mms-module-architecture.md` (what belongs in `work` / `reports` / `setup`)
