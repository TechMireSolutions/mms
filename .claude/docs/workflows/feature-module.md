---
description: Add or extend an MMS module with Work, Reports, and Setup tabs
---

# Workflow: Feature Module

This workflow guides the end-to-end implementation of a new or extended MMS feature module, ensuring strict architectural consistency across the frontend, backend, and shared packages in accordance with MMS standards.

## Phase 1: Context & Manifest Definition

- [ ] **Load core skills**: Invoke `mms-module-page`, `mms-module-work`, and `mms-module-setup`. Add `mms-backend-api` if building new REST endpoints, and `mms-fields-registry` if the module uses custom fields.
- [ ] **Review architecture rules**: Read `rules/mms-module-architecture.md`, `rules/mms-api-interface.md`, `rules/mms-data-layer.md`, `rules/mms-ui-ux-design.md`, `rules/mms-settings-i18n.md`, and `rules/mms-fields.md`.
- [ ] **Define the Manifest**: In `packages/shared`, define `{module}ModuleManifest`. Explicitly declare the `tiers` (Work, Reports, Setup), `setupSubTabs`, `softDelete` behavior, and required permissions.
- [ ] **Define DTOs**: Create `.strict()` Zod schemas in `@mms/shared` for validation. Never fork schemas between frontend and backend.

## Phase 2: Backend REST & Data Layer

- [ ] **Database Schema (`mms-schema-migrate`)**: Ensure Drizzle tables are strictly 3NF normalized. Write forward-only migrations with `FORCE RLS` on new tenant tables.
- [ ] **Implement REST plugin**: Create the Fastify backend plugin for the module. Enforce `authenticateTenant` or `authenticatePlatform`.
- [ ] **Transaction RLS**: Wrap tenant writes in `db.transaction()` setting `app.current_tenant` to strictly isolate data. 
- [ ] **Follow API contracts**: Ensure mutations use upsert via bulk PUT (never wipe/replace data destructively). Implement soft-delete and restore if the manifest supports archives.

## Phase 3: Frontend Route & State

- [ ] **Scaffold the feature**: Create the frontend page structure under `apps/frontend/src/tenant/features/{module}/`. Do not import components directly from other features.
- [ ] **Register the route**: Add the new lazy route into `HostRoutes`.
- [ ] **Data Hooks**: Create TanStack Query v5 `queryOptions`/`mutationOptions` factories (`mms-query-factories`). If the data needs to be accessed globally, place the facade in `@/tenant/hooks/collections/*`. **Do not** use `useLiveCollection` for primary data paths.
- [ ] **Form Architecture**: Implement static `FormModal` forms powered by the shared Zod DTOs (`mms-form-architecture.md`). 

## Phase 4: UI/UX Parity & Integration

- [ ] **Meet gold-standard parity**: Ensure the module matches the requirements in `mms-module-architecture.md` §7:
  - Implement a Trash UI if soft-delete is enabled.
  - Use `mutateAsync` for predictable promise chaining in form submissions.
  - Implement robust `ErrorState` components with `loadFailedHint`.
  - Support keyboard shortcuts like `Cmd/Ctrl+N` for quick creation.
  - Ensure setup tabs enforce `canEditSetup` permission gates.
- [ ] **UI Tokens & BiDi**: Ensure layout is accessible (44x44px touch minimums, semantic landmarks) and uses RTL-safe BiDi design tokens (`mms-ui-ux-design.md`).
- [ ] **Register Navigation**: Add the module to `navConfig` and `SYSTEM_MODULES`.
- [ ] **Add Translations**: Define all UI strings as i18n keys and add them to `en`, `ar`, `ur`, and `fa` translation files (`mms-settings-i18n.md`). Hardcoded strings are banned.

## Phase 5: Verification & Sync

- [ ] **Run static analysis**:
  ```bash
  pnpm typecheck
  cd apps/frontend && pnpm lint
  cd apps/backend && pnpm lint
  ```
- [ ] **Run tests**: Execute `pnpm test` and verify backend `inject()` checks for allow/deny cases.
- [ ] **Run completion review**: Ensure all steps in `mms-completion-review.md` are checked off.
- [ ] **Sync Standards**: If any standards, rules, or agent files were modified, run `bash .agent/scripts/sync-all.sh`.

---

> [!IMPORTANT]
> **Three-Tier Architecture**
> MMS modules strictly follow a 3-tier architecture: **Work** (day-to-day operations), **Reports** (analytics), and **Setup** (configuration). Do not invent new top-level paradigms without architectural approval.
