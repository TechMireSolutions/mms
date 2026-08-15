---
description: Folder structure, colocation, file size limits, naming conventions for symbols/files, and database-to-UI name alignments.
paths:
  - "apps/frontend/src/tenant/features/**"
  - "apps/frontend/src/tenant/hooks/**"
  - "apps/frontend/src/tenant/pages/**"
  - "apps/frontend/src/tenant/components/**"
  - "apps/frontend/src/tenant/routes/**"
  - "apps/frontend/src/platform/**"
  - "apps/frontend/src/components/**"
  - "apps/frontend/src/hooks/**"
  - "apps/backend/src/routes/**"
  - "apps/backend/src/services/**"
  - "apps/backend/src/contacts/**"
  - "apps/backend/src/lib/**"
  - "packages/shared/src/**"
  - "scripts/**/*.sh"
  - "e2e/**"
---

# MMS File Structure & Naming Conventions

**Workflow skills:** FE feature scaffolding → `mms-frontend` · shared barrels/exports → `mms-shared-package` · module page layout → `mms-module-page`.

Governs code layout, file colocation, splitting thresholds, casing conventions, and naming consistency across the monorepo workspaces — applying identically to tenant and platform code.

---

## 1. Monorepo & Directory Structure
MMS uses a strict `pnpm` workspace monorepo layout:
- `apps/frontend/`: React single page application (SPA).
- `apps/backend/`: Fastify API backend.
- `packages/shared/`: `@mms/shared` types, defaults, and I/O-free utilities.
- `scripts/`: Operational scripts and deployment helpers.
- `e2e/`: Playwright end-to-end integration tests.

### Casing & Folder Names
- Shared UI primitives live under `apps/frontend/src/components/ui/`; generic hooks under `apps/frontend/src/hooks/`; shared FE libs under `apps/frontend/src/lib/`.
- Tenant workspace features are modularized under `apps/frontend/src/tenant/features/{module}/` (e.g. `contacts/`, `students/`).
  Each feature folder contains its entry page (`{Module}Page.tsx`), `components/` subdirectory, and `hooks/` subdirectory.
  Shared cross-feature tenant hooks live under `apps/frontend/src/tenant/hooks/` (e.g. `useBranding.ts`, `collections/`).
- Tenant non-feature shells: `apps/frontend/src/tenant/pages/` (auth), `tenant/components/` (AppLayout / guards), `tenant/routes/` (`TenantRoutes.tsx`).
- Platform apex console lives under `apps/frontend/src/platform/` with `pages/`, `components/`, `hooks/`, `lib/`, and `routes/` (incl. `pages/auth/`).
- Backend routes are scoped by namespace under `apps/backend/src/routes/`:
  - `platform/` (e.g. `platformWorkspaces.ts`, `platformAuth.ts`, `platformUsers.ts`, `platformSettings.ts`)
  - `tenant/` — prefer a thin barrel (`contacts.ts`, `messaging.ts`) that registers sub-route modules under `tenant/{module}/` when a domain grows
  - `common/` (e.g. `auth.ts`, `db.ts`, `public.ts`, `backgroundJobs.ts`)
- Backend domain modules (Clean Architecture; Contacts is the reference) split by concern:
  - `{module}/use-cases/**` — domain orchestration functions with repository DI
  - `{module}/repository/**` — storage **interface** (`{module}Repository.ts`) + Drizzle adapter (`{module}RepositoryAdapter.ts`)
  - `{module}/use-cases/{module}UseCases.ts` — composition root factory wiring the default adapter
  - Legacy `services/*.ts` paths for the module become **stable re-export shims** re-exporting the composition root — do not delete public import paths callers use (`mms-dry.md` §2).
- Backend DB helpers may split by concern (`dbConnection.ts`, `documentStore*.ts`, …) behind the stable `database.ts` / document-store public surface — do not break import paths callers already use.

---

## 2. Naming Conventions

### Case Conventions Reference
| Target | Convention | Example |
|--------|------------|---------|
| React Pages & Components | `PascalCase` | `StudentsPage.tsx`, `StudentForm.tsx` |
| Custom React Hooks | `use` + `PascalCase` | `useStudents.ts`, `useModuleTierTabs.ts` |
| Functions, Methods, Variables | `camelCase` (verb-first) | `parsePhoneNumber`, `buildApp` |
| Static Constants | `SCREAMING_SNAKE` | `DEFAULT_GLOBAL_SETTINGS` |
| TypeScript Types & Interfaces | `PascalCase` (no `I` prefix) | `Contact`, `StudentCreateInput` |
| JSON API properties | `camelCase` | `{ firstName, loginEmail }` |
| DB tables, JSON keys, fields | `snake_case` | `contact_roles`, `global_settings`, `custom_fields`, `sort_order` |
| URL route paths | `kebab-case` | `/api/students`, `/api/contacts/lookups`, `/api/saved-reports` |
| Translation & permission keys | `dot.notation` | `students.actions.add`, `students.write` |
| Script files | `kebab-case.sh` | `sync-skills.sh`, `deploy-on-server.sh` |

### Casing Alignment across Layers (Strict UI-DB Casing)
All internal naming (variables, parameters, types) and database naming (tables, columns, index fields) must strictly align with the UI representation, regardless of position (prefix/suffix).
- *Example*: If the UI displays "Contact Role", the database column must be `contact_role`, the TS variable `contactRole` / `ContactRole` (e.g. `contactRoleId`). Using custom abbreviations like `cntct_rl` or generic names like `role` is forbidden.

### Title Case Formatting for Values
Latin/display name fields (and similar English-script person/place labels) must be standardized to Title Case on save boundaries.
- **Unified Helper**: Use `applyTitleCaseRecursive` from `@mms/shared`.
- **Enforcement Points**: All database save hooks (repositories/insert logic) and client storage write boundaries (`db.ts`) must intercept payload objects and run this formatting recursively.
- **Exclusion Policy**: Standard identifiers, keys, email addresses, phone numbers, passwords, hashes, URLs, dates, and other system/control properties must be systematically excluded (configured inside `applyTitleCaseRecursive`).
- **Scripts / i18n**: **Skip** Title Case for ar/ur/fa and other non-Latin scripts, and for free-form RTL or long prose description fields — do not mangle locale text.

---

## 3. Code Organization & Splitting Thresholds
To prevent monolithic components and maintain clean boundaries:

| Band | Policy |
|------|--------|
| **Hard ceiling ~300 lines** | Application `.ts` / `.tsx` above this **must** be split by concern before / when touching (hooks, presentational sections, pure utils, route submodules). |
| **Soft target ~220 lines** | Prefer this for FE feature shells, page controllers, settings panels, and UI composers when editing. Leave well-factored files alone if already cohesive. |
| **Exceptions** | Translation packs (`appTranslations*.ts`), `schema.ts`, large `*.integration.test.ts` / suite files, and generated artifacts — do not split for line-count alone. |

### Preferred split shapes (behavior-preserving)

| Extract | Typical name | Role |
|---------|--------------|------|
| Page / panel logic | `use*PageController` / `use*Controller` | State, effects, mutations; thin JSX shell remains |
| Action clusters | `use*Actions` / `*ActionHandlers` | Save / decrypt / trash / bulk handlers |
| Presentational chunks | `*Section` / `*Panel` / `*Table` / `*List` / `*Modal` | JSX-only or near-pure UI |
| Pure transforms | `*Utils.ts` / `*Compute.ts` / `*Shared.ts` | I/O-free helpers (promote to `@mms/shared` when cross-app / 2+ modules) |
| Types-only | `*Types.ts` | Props / modal state shared by siblings |

### Stable barrels (required)

- Keep **public import paths** stable: re-export from the original module (`{Module}Page.tsx`, `dropdown-menu.tsx`, `@/lib/db`, feature component entry) so callers do not churn.
- Prefer **named exports**; default exports only for lazy-loaded feature pages (`tenant/features/**/{Module}Page.tsx`) and a few legacy settings defaults already in tree.
- Do **not** combine file splitting with data-authority migration (Query vs live-collection) in the same change — `mms-migration-status.md`.

### Other organization rules

- **Separation of Concerns**: If a component has > 3 distinct responsibilities, split it.
- **Feature import boundary**: Ban circular imports across `tenant/features/*`. Cross-feature data only via `@/tenant/hooks/collections/*` or `@mms/shared` — never feature→feature deep imports.
- **Dry-run Refactoring**: Extract duplicated JSX elements appearing >= 2 times into reusable layout helpers — `mms-dry.md`.
- **Test files**: Colocate `*.test.ts(x)` next to unit under test; E2E only under `e2e/`.
- **Route files**: Match URL segment (`students.ts` → `/api/students`); submodules stay private to that barrel.

### Banned Symbols & Names
- Do not use generic words like `data`, `info`, `helper`, or `util` as a sole variable or class name (use `contactFieldUtils` instead).
- Do not use legacy terms (e.g., `persona` or `Persona`).
- Prune `tmp`, `old`, `new`, or `copy` suffixes from files and directories on touch.
