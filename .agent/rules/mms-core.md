---
trigger: always_on
---

# MMS Core

Madrasa Management System monorepo — applies on every task.

**Workflow skills:** orientation → `antigravity-workspace` · install/run → `mms-dev-setup`. Per-topic workflows in the Standards index below (rules = norms; skills = checklists).

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
- **FE:** React 19 · Vite 8 · Tailwind v4 · Radix/shadcn · TanStack Query · Framer Motion · Recharts · Lucide
- **Icons:** Lucide only · **Animations:** Framer Motion only

## Real-time & polling

| Allowed | Banned |
|---------|--------|
| `local-database-update` event bus (current FE) | Ad-hoc `setInterval` / repeated `fetch` loops in `useEffect` without Query |
| Tenant WS via existing `/api/ws` + `broadcastTenantUpdate` → Query invalidation | Parallel/ad-hoc WS protocols |
| TanStack Query `refetchInterval`, documented job-progress polls, WS heartbeats | Half-polling hybrids that invent a second realtime stack |
| SSE (optional future) | — |

Prefer the existing tenant WS channel when wiring live push (`mms-migration-status.md`).

## Data authority (trajectory)

| Phase | Pattern | Owner |
|-------|---------|--------|
| **Current** | Per-entity REST + TanStack Query; report widgets/visualizer Query-first; BE broadcasts on `/api/ws` (FE not yet subscribed) | `mms-data-layer.md`, `mms-reports.md` |
| **Target** | localStorage as offline cache only; FE WS → Query invalidation; remaining niche chart/statement panels on server aggregates | `mms-data-layer.md`, `mms-reports.md` (gap register → `mms-migration-status.md`) |

## Tenant write invariant

Any new tenant write path must use **`authenticateTenant`** + transaction-scoped RLS (`SET LOCAL`) + `can()` / collection permission. Never trust client-supplied `workspaceSubdomain` or authz `userId`.

## Validation SSOT

Shared Zod schemas live in `@mms/shared`. FE forms and BE `parseRequest` must consume the same shapes — do not fork request/response schemas per app. Write `.strict()` / write-vs-read shapes → **`mms-form-architecture.md`**.

## Standards index (ownership matrix)

Single prose owner per topic — other rules/skills use short pointers only. **Workflow skill** = invoke for how-to; do not re-author norms in skills.

| Topic | Owner (rule) | Workflow skill |
|-------|--------------|----------------|
| Dependencies & latest stack (Node/pnpm bumps) | `mms-dependencies.md` | `mms-dependency-upgrade` |
| File structure, naming, Title Case on save | `mms-structure-naming.md` | `mms-frontend` / `mms-shared-package` |
| DRY / extraction / `@mms/shared` exports | `mms-dry.md` | `mms-shared-package` |
| Sessions, cookies, CSRF, RBAC, rate limits | `mms-auth-security.md` | `mms-backend-security` |
| apiClient, error `type`, HTTP pagination, bulk PUT upsert, idempotency↔body | `mms-api-interface.md` | `mms-frontend` · `mms-backend-api` |
| Query policy, Drizzle/RLS, soft-delete **schema/strip/SQL**, PG timeouts, WS invalidate | `mms-data-layer.md` | `mms-query-factories` · `mms-schema-migrate` · `mms-data-sync` (legacy) |
| Soft-delete **Work trash / drawer / §7** | `mms-module-architecture.md` | `mms-module-work` · `mms-module-page` |
| Await `mutateAsync` before form close | `mms-module-architecture.md` §7 | `mms-module-page` |
| Background jobs (SKIP LOCKED / durable queue) | `mms-module-architecture.md` §5 | `mms-background-jobs` |
| SQL page / `loadAllFn` ban | `mms-data-layer.md` | `mms-query-factories` |
| Query/controller recipes | `mms-hooks.md` | `mms-query-factories` · `mms-frontend` |
| FormModal shell, write Zod `.strict()`, no Server Actions, uploads | `mms-form-architecture.md` | `mms-form-architecture` |
| UI tokens, tabs, a11y, responsive §7 | `mms-ui-ux-design.md` | `mms-frontend` · `mms-a11y-smoke` |
| Module Work/Reports/Setup, §7 gold-standard | `mms-module-architecture.md` | `mms-module-page` · `mms-module-work` · `mms-module-setup` · `mms-background-jobs` |
| Field/tab registry | `mms-fields.md` | `mms-fields-registry` · `mms-module-setup` |
| Settings, i18n, formatters, backup UI | `mms-settings-i18n.md` | `mms-settings-i18n` · `mms-backup-restore` |
| Health, ports, purge/reset, env, CI (match root engines) | `mms-ops-infrastructure.md` | `mms-dev-setup` · `mms-ops-deploy` · `mms-linux-compatibility` |
| Tests, logging, ErrorBoundary, Sentry | `mms-testing-observability.md` | `mms-code-review` · `mms-a11y-smoke` |
| Reports & exports | `mms-reports.md` | `mms-reports-export` |
| Messaging campaigns | `mms-messaging.md` | `mms-messaging` |
| Open migration gaps / fix recipes | `mms-migration-status.md` | `mms-migration-fixes` |
| Post-edit verify / PR checklist | `mms-completion-review.md` | `mms-code-review` |

Hardcoding ban (copy, colours, formats, statuses): follow the owner row above — never invent parallel string/colour tables.

## Domain invariants (one-liners)

- **Contacts canonical** for persons; module rows link by id; hydrate on read, strip on save — `mms-fields.md` / `mms-form-architecture.md` / `mms-data-layer.md`.
- **`persona` purged** — residual = migration defect.
- **Phones E.164** on save via `parsePhoneNumber` — `mms-form-architecture.md`.
- **WhatsApp number id** only via `PuppeteerWhatsAppProvider.getNumberId` — `mms-messaging.md`.
- **Module pages:** three tiers only — `mms-module-architecture.md` (+ shell components `mms-ui-ux-design.md`).
- **No Server Actions** for tenant writes — cookie SPA + `apiClient` only — `mms-form-architecture.md`.

## Performance (agent-checkable)

- Route-lazy heavy deps (charts, PDF, xlsx, editors) — do not grow the initial Work-tier bundle with report-only libs.
- Declare size on media/charts to avoid CLS — `mms-ui-ux-design.md`.
- React 19: keep route-level `lazy` + `Suspense`. Prefer TanStack Query for lists/entities. Use `use()` only behind existing Suspense boundaries for promise-backed reads — **ban** inventing a second data stack beside Query (`mms-data-layer.md`, `mms-hooks.md`).

## MMS edit discipline

1. Read implicated files before editing; validate against `@mms/shared` and `schema.ts`.
2. New UI must be config-driven (field/tab/column registry).
3. Remove unused imports/dead code in the change boundary.
4. Respect file-size bands — hard ~300 / soft ~220; split behind stable barrels — `mms-structure-naming.md`, `mms-dry.md`.
5. Run `pnpm typecheck` after non-trivial changes; completion review per `mms-completion-review.md`.
6. Never commit unless the user asks; never commit `.env` or credentials.
7. Do not expand into migration-status open gaps or “Do not reintroduce” items unless the task requires them.

### Anti-patterns

```tsx
// ❌ Nested ContactConfigProvider — mount once in TenantScopedProviders only
<ContactConfigProvider><ContactsPage /></ContactConfigProvider>

// ❌ Frontend importing backend
import { getCollection } from '../../../backend/src/db/database';

// ✅ Shared types
import type { Contact } from '@mms/shared';
```
