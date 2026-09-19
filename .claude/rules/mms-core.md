---
description: MMS stack, boundaries, ownership index, and MMS-specific edit discipline
---

# MMS Core

Madrasa Management System monorepo — applies on every task across both **tenant** and **platform** boundaries.

**Workflow skills:** orientation → `antigravity-workspace` · install/run → `mms-dev-setup`.
**Ownership matrix** (topic → owner rule → workflow skill) → `.cursor/rules/README.md`. Rules = norms (SSOT); skills = checklists that point back at them.

## Monorepo Layout & Stack

```
apps/frontend/     React 19 + Vite 8 · React Router 7 · Tailwind v4 · Radix UI/shadcn · TanStack Query v5 + @ts-rest · Zustand 5 · Framer Motion 13 · Lucide · Recharts 3
apps/backend/      Fastify 5 + Node.js 24 (native type stripping, built-ins, AsyncLocalStorage) · @ts-rest/fastify · PostgreSQL 16 + Drizzle ORM 0.45 · BullMQ 6 + Redis 7 · Pino 10
packages/shared/   @mms/shared (SSOT for types, strict Zod 4 DTOs, @ts-rest contracts, schemas, constants, pure utils)
```

- **Tooling & Runtimes:** Node.js `>=24.14.0`, pnpm `11.15.1`, Turbo `^2.10.9`, TypeScript `~7.0.2`.
- **Root commands:** `pnpm dev`, `pnpm build`, `pnpm typecheck`, `pnpm test`, `pnpm lint`.
- **Registry of every version pin, and the Node 24 runtime rules** → `mms-dependencies.md` (do not restate versions here).

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
- **Data Standards:** Phone numbers E.164 via `parsePhoneNumber`; WhatsApp number ID via `PuppeteerWhatsAppProvider.getNumberId`; money as decimal strings (`/^\d+(\.\d{1,2})?$/`); sequential UUIDv7 (RFC 9562) for distributed/public primary keys.
- **React 19 & Frontend Standards:** Native `ref` as prop (ban `forwardRef` in newly authored components); mandatory `useId()` for accessible control/label pairs; TanStack Query as authoritative server state.
- **Module Pages:** Three tiers only (Work, Reports, Setup) via `PageHeader` + `useFilteredModuleTierTabs` (`mms-module-architecture.md`).
- **Write Mechanism:** Cookie SPA + `apiClient` only (no RSC server action posts) — `mms-form-architecture.md`.
- **Audit Trail & Immutability:** RFC 8785 canonical JSON, outbox pattern, sharded hash chains, right-to-erasure via crypto-shredding — `mms-data-layer.md` §5, skill `mms-audit-trail`.
- **Soft-Delete Architecture & Lifecycle:** Mandatory for tenant entity tables; Category B partial index (`WHERE deleted_at IS NULL`), partial unique indexes, session revocation on delete, lock-free chunked retention purge — `mms-data-layer.md` §6, skill `mms-soft-delete`.
- **Background Jobs:** Long work runs in the BullMQ worker process, never in the request path — `mms-module-architecture.md` §5, skill `mms-background-jobs`.
- **Migrations:** Forward-only DDL, expand/contract, lock-safe indexes (never a write-blocking `CREATE INDEX` in a migration) — `mms-data-layer.md` §7, skill `mms-schema-migrate`.

## Edit Discipline

1. **Scope:** Edit in-scope files only; ask before deletions or large removals.
2. **Clean Boundary:** Remove dead code, unused imports, and debug logs in the change boundary. Run `pnpm typecheck` after non-trivial changes.
3. **File Sizing:** Hard ceiling ~300 lines / soft target ~220 lines. Split by concern behind stable barrels (`mms-structure-naming.md`).
4. **Performance & Rendering:** Route-lazy heavy deps; memoize non-trivial work; virtualize > 30 items — norms `mms-performance.md` (do not restate recipes here).
5. **Git Safety:** Conventional Commits (`type(scope): description`). Short-lived branches; protected `main`. Never commit or push unless explicitly requested. Never commit `.env` or credentials — `mms-agent-universal.md`.
