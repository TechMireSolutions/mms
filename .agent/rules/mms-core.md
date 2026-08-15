---
trigger: always_on
---

# MMS Core

Madrasa Management System monorepo — applies on every task across both **tenant** and **platform** boundaries.

**Workflow skills:** orientation → `antigravity-workspace` · install/run → `mms-dev-setup`. Matrix below (rules = norms; skills = checklists).

## Monorepo Layout & Stack

```
apps/frontend/     React 19 + Vite 8 · Tailwind v4 · Radix/shadcn · TanStack Query v5 · Framer Motion · Lucide · Recharts
apps/backend/      Fastify 5 + tsx · PostgreSQL + Drizzle ORM (strictly normalized 3NF/BCNF, RLS, parameterized SQL only)
packages/shared/   @mms/shared (SSOT for types, strict Zod DTOs, schemas, constants, pure utils)
```

- **Root commands:** `pnpm dev`, `pnpm build`, `pnpm typecheck`, `pnpm test`.
- **Environment:** `VITE_API_URL` (FE); `JWT_SECRET`, `DATABASE_URL` (BE).

## Boundaries & Layering

| Layer | Sanctioned Contents | Constraints |
|---|---|---|
| `@mms/shared` | Types, strict Zod DTOs, configs, manifests, pure utils | Zero DOM, React, Fastify, or DB dependencies. Write schemas use `.strict()`. Align 1:1 with Drizzle tables. |
| `apps/frontend/src/lib/*` | FE-wide logic: query factories, i18n, apiClient | Sanctioned shared FE layer across features/platform. |
| `apps/frontend/src/components/ui/*` | Shared UI primitives & design tokens | Prop-driven chrome only; zero feature domain imports. |
| `apps/frontend/src/tenant/features/*` | Feature adapters: config + labels + wiring | Banned direct cross-feature imports (`@/tenant/features/{a}` from `{b}`). Route via `@/tenant/hooks/collections/*` facades or extract shared chrome to `components/ui` / `lib/` / `@mms/shared` — `mms-dry.md`. |

- **Extraction Corollary:** Ban targets coupling, not duplication. When 2+ components are near-identical, extract the shared 90% into `components/ui/` or `lib/` and keep wrappers thin.
- **Inter-module data:** Batch `/resolve` + Query; `local-database-update` only for legacy settings/local drafts.
- **Validation SSOT:** Shared Zod in `@mms/shared` (`.strict()` write DTOs, explicit Insert/Update/Response types). Do not fork schemas.

## Real-time & Data Authority

| Pattern | Allowed | Banned |
|---|---|---|
| **Realtime** | Tenant WS `/api/ws` + `broadcastTenantUpdate` → Query invalidation; Query `refetchInterval` / job polls | Ad-hoc `setInterval` / `fetch` in `useEffect`; parallel WS stacks |
| **Data Authority** | Server-authoritative REST + TanStack Query; SQL aggregates for KPIs/reports | `useLiveCollection` / `getCollection` / `saveCollection` for REST entities; unpaged client-side dumps (`loadAllFn`) |
| **Database Schema** | Strict 3NF/BCNF normalization, typed PostgreSQL columns, bidirectional `relations(...)` | Semi-structured domain storage (`json()`, `jsonb()`, `array()`, EAV tables, untyped blobs) |

## Tenant & Platform Invariants

- **Tenant Writes:** `authenticateTenant` + transaction RLS (`SET LOCAL app.current_tenant`) + `can()` / collection check. Validate with `@mms/shared` Zod before DB persistence. Never trust client body `workspaceSubdomain` or authz `userId`.
- **Platform Writes:** `authenticatePlatform` + `platformUserCan` / `requirePlatformPermission` + password re-auth on destructive ops.
- **Contacts Canonical:** Persons link by `contactId`; profile fields live on contacts. Hydrate on read, strip on write (`mms-fields.md`, `mms-form-architecture.md`).
- **Data Standards:** Phone numbers E.164 via `parsePhoneNumber`; WhatsApp number ID via `PuppeteerWhatsAppProvider.getNumberId`; Money as decimal strings (`/^\d+(\.\d{1,2})?$/`).
- **Module Pages:** Three tiers only (Work, Reports, Setup) via `PageHeader` + `useFilteredModuleTierTabs`.
- **Write Mechanism:** Cookie SPA + `apiClient` only (No React Server Actions).

## Standards Index (Ownership Matrix)

| Topic | Owner Rule | Workflow Skill |
|---|---|---|
| Dependencies & Version Freshness | `mms-dependencies.md` | `mms-dependency-upgrade` |
| File Structure, Naming & Title Case | `mms-structure-naming.md` | `mms-frontend` · `mms-shared-package` |
| DRY, Extractions & Shared Package | `mms-dry.md` | `mms-shared-package` |
| Auth, Sessions, CSRF, RBAC & Isolation | `mms-auth-security.md` | `mms-backend-security` |
| API Contracts, Errors, Pagination & Bulk PUT | `mms-api-interface.md` | `mms-frontend` · `mms-backend-api` |
| Data Layer, Drizzle RLS, PG Timeouts & Query | `mms-data-layer.md` | `mms-query-factories` · `mms-schema-migrate` |
| Backend Architecture & Repository Gateway | `mms-api-interface.md` §2 · `mms-structure-naming.md` | `mms-backend-api` |
| Work Directory, Detail Drawer & Trash UX | `mms-module-architecture.md` | `mms-module-work` · `mms-module-page` |
| Background Jobs & Queue Processing | `mms-module-architecture.md` §5 | `mms-background-jobs` |
| React Hook Recipes & Facades | `mms-hooks.md` | `mms-query-factories` · `mms-frontend` |
| FormModal Architecture & Write Schemas | `mms-form-architecture.md` | `mms-form-architecture` |
| UI Design System, Tokens, a11y & §7 Layout | `mms-ui-ux-design.md` | `mms-frontend` · `mms-a11y-smoke` |
| Module Work/Reports/Setup & Gold Standard §7 | `mms-module-architecture.md` | `mms-module-page` · `mms-module-work` · `mms-module-setup` |
| Field & Tab Registries | `mms-fields.md` | `mms-fields-registry` · `mms-module-setup` |
| Settings, i18n (en/ar/ur/fa) & Backup UI | `mms-settings-i18n.md` | `mms-settings-i18n` · `mms-backup-restore` |
| Ops, Health, Ports (5002 prod / 3000 dev) & CI | `mms-ops-infrastructure.md` | `mms-dev-setup` · `mms-ops-deploy` · `mms-linux-compatibility` |
| Testing, Observability & ErrorBoundary | `mms-testing-observability.md` | `mms-code-review` · `mms-a11y-smoke` |
| Reports, Analytics & Exports | `mms-reports.md` | `mms-reports-export` |
| Messaging Campaigns & Logs | `mms-messaging.md` | `mms-messaging` |
| Migration Debt Register | `mms-migration-status.md` | `mms-migration-fixes` |
| Post-Edit Verification Checklist | `mms-completion-review.md` | `mms-code-review` |

## Performance & Edit Discipline

1. **Route-Lazy Heavy Deps:** Split charts, PDF, Excel, code editors into deferred chunks. Declare explicit dimensions on media/charts for zero CLS.
2. **React 19 Hygiene:** Route-level `lazy` + `Suspense`. Avoid premature `useMemo`/`useCallback` (React Compiler ready). Prefer `startTransition` / `useDeferredValue` / `useEffectEvent`.
3. **File Sizing:** Hard ceiling ~300 lines / soft target ~220 lines. Split by concern behind stable barrels (`mms-structure-naming.md`).
4. **Clean Boundary:** Remove dead code, unused imports, and debug logs. Run `pnpm typecheck` after non-trivial changes.
5. **Git Safety:** Conventional Commits (`feat`/`fix`/`chore`). Never commit or push unless explicitly requested. Never commit `.env` or credentials.
