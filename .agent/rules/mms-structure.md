---
trigger: model_decision
---

# File Structure

Modern layout: **feature colocation**, **thin boundaries**, **predictable paths**. Details for FE/BE live in `mms-frontend.md` and `mms-backend.md` — this rule owns **cross-cutting structure policy**.

## Monorepo top level

```
apps/frontend/     # React SPA
apps/backend/      # Fastify API
packages/shared/   # @mms/shared — types, pure utils, defaults
scripts/           # deploy, Apache, server helpers (not app logic)
e2e/               # Playwright
.cursor/rules/     # Cursor standards (.agent/rules/ mirror)
```

No new top-level app folders without explicit approval. No business logic in `scripts/`.

## Frontend module layout

| Layer | Location | Rule |
|-------|----------|------|
| Route shell | `pages/{Module}.tsx` | Orchestration only — tier tabs, header, lazy sections |
| Feature UI | `components/{module}/` | One folder per domain; subfolders by concern (`form/`, `tabs/`, `backup/`) |
| Settings UI | `components/settings/` | App-wide panels only; subfolders `backup/`, `modules/` |
| Shared UI | `components/ui/` | shadcn primitives + cross-module composites |
| Cross-route | `components/routing/`, `layout/`, `providers/` | Shell only |
| Data hooks | `hooks/use*.ts` | Reused across ≥2 components or pages |
| Module-only hooks | `{module}/hooks/` or colocated `use*.ts` | Single-module scope |
| Infra | `lib/` | apiClient, db, config, contexts — not feature markup |
| Pure helpers | `@mms/shared` or `lib/{domain}/` | See `mms-dry.md` |

**Banned:** `components/moduleA/` importing from `components/moduleB/` — use shared UI, `@mms/shared`, or events (`mms-core.md`).

## Backend layout

| Layer | Location | Rule |
|-------|----------|------|
| HTTP entry | `routes/*.ts` | Parse → authorize → delegate; no business logic blocks |
| Domain logic | `services/**/*.ts` | One service per aggregate; subfolders by domain (`auth/`, `platform/`) |
| Cross-cutting | `plugins/`, `middleware/` | Registration only |
| Persistence | `db/schema.ts`, `db/database.ts`, `migrations_drizzle/` | Drizzle only — no raw SQL strings |
| Validation | `validation/*Schemas.ts` | Zod per resource |
| Infra helpers | `lib/` | tenant context, HTTP errors, shared parsers |

## File size & splitting

| Signal | Action |
|--------|--------|
| File **> ~300 lines** | Split by concern (tabs, hooks, utils, subcomponents) |
| **>3 responsibilities** in one module | Extract hooks, services, or child components |
| Duplicate JSX blocks **≥2×** | Extract shared component (`mms-dry.md`) |

## Tests & config

- **Backend tests:** `apps/backend/src/__tests__/` or `*.test.ts` beside source
- **Frontend tests:** colocated `*.test.ts(x)` or `__tests__/`
- **Env/config:** `lib/config/`, `config/` — never scattered magic paths
- **Barrel files:** avoid deep `index.ts` re-export chains — prefer direct imports

## New module checklist

1. `pages/{Module}.tsx` + `components/{module}/`
2. Register route + nav (`lib/config/routes.ts`, `lib/config/navConfig.tsx`)
3. Tier tabs via `useModuleTierTabs()` (`mms-ui-tabs.md`)
4. Shared types/settings in `@mms/shared` if cross-app
