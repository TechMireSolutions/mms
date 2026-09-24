---
description: DRY (Don't Repeat Yourself) guidelines, extraction thresholds, boundaries, and @mms/shared exports standards.
paths:
  - "packages/shared/**"
  - "apps/frontend/src/hooks/**"
  - "apps/frontend/src/tenant/hooks/**"
  - "apps/frontend/src/lib/**"
  - "apps/backend/src/services/**"
  - "apps/backend/src/contacts/**"
  - "apps/backend/src/lib/**"
---

# MMS DRY & Shared Package Policy

**Workflow skill:** `mms-shared-package` (extract/export pure helpers and Zod DTOs).

Don't Repeat Yourself (DRY) — every piece of logic, schema, and configuration must have a single authoritative source across tenant and platform surfaces.

## 1. Proactive Search & Duplication Audits

- **Search First**: Search `@mms/shared`, `apps/frontend/src/lib/config/`, `apps/frontend/src/hooks/`, and `@/components/ui/` before authoring helpers, schemas, or UI primitives. Extend existing utilities instead of creating near-duplicates.
- **Shared Chrome Reuse**: Reuse central UI primitives (`BulkSelectionBar`, `ModuleTrashToggle`, `EmptyState`, `FieldErrorMessage`, `ModuleCommandMetricsGrid`, `WarningCallout`, `DirectoryCard`, `DetailSheet`) and `formStyles` tokens. Never copy markup across feature folders.
- **SSOT Entity Descriptors**: Consume declarative `EntityDescriptor<T>` registries (`@/components/common/entityRegistry`, `mms-ui-ux-design.md` §6). Labels resolve at runtime via `labelKey: AppTranslationKey`.
- **Person-Directory Chrome**: Reuse shared card/table chrome (`DirectoryCard`, `DirectoryEntityCard`, `DirectoryCardFooterActions`, `useWorkCardAction`, `ModuleWorkBulkActionBar`). Per-module components are thin wiring adapters.
- **Node 24 Built-Ins First**: Use native `glob`, `crypto.hash()`, `URLPattern`, `using`/`await using`, and `process.loadEnvFile()` instead of adding 3rd-party dependencies.
- **Zod SSOT**: Share request/response DTOs from `@mms/shared`. Build schema variants using `.pick`, `.omit`, or `.extend` on the base schema.

## 2. Extraction Thresholds & Strategy

Extract logic to a shared layer (`@mms/shared` or shared UI/hook) when:
1. **Logic Repetition**: The same logic appears ≥ 2 times across different files.
2. **Boundary Cross**: Logic crosses feature boundaries or the frontend ↔ backend boundary.
3. **Length**: Code block is > 15 lines of identical or parametrically identical logic.
4. **Layout Tokens**: The same dimension, toast width, or `z-index` appears ≥ 3 times — promote to `index.css` `@theme` (`h-chart-*`, `max-w-toast`, `z-modal*`).
- **File-Split DRY**: When single files exceed 200 lines (`mms-structure-naming.md` §3), extract by concern inside the same feature folder without altering public barrel exports.

## 3. Monorepo Layer Boundaries

- **`@mms/shared`**: Pure validation schemas, types, constants, default configs, and I/O-free formatters. Named exports only; subpath imports banned. No React, DOM, Fastify, or DB code.
- **`apps/frontend`**: React hooks, UI primitives, providers, and TanStack Query facades. Cross-feature imports (`featureA` from `featureB`) are banned; route through `@/tenant/hooks/collections/*` facades or extract shared UI to `components/ui`.
- **`apps/backend`**: Fastify routes, backend services, and Drizzle schema/queries.

## 4. Quality Bar & Code Cleanup

- **Strict Typing**: Strict TypeScript mode is mandatory. Use `unknown` and type narrowing. `any` is strictly banned in new and touched code (`@typescript-eslint/no-explicit-any`, ratcheted via `check:code-norms`).
- **JSDoc**: Required on public exports in `packages/shared` only. Omit elsewhere; ban narrating comments.
- **Unit Testing**: All non-trivial pure helpers in `@mms/shared` require unit tests.
- **Dead Code**: Prune unused imports, dead variables, and legacy shims within your change boundary.
- **Formatting SSOT**: Format all dates and currency via settings-driven `formatDate` and `formatMoney` from `@mms/shared` (`mms-settings-i18n.md`).
- **Banned Anti-Patterns**: Per-module bulk-bar adapter forks (use unified `ModuleUniversalBulkActionBar` over `ModuleWorkBulkActionBar`); duplicated per-list selection hooks (use shared `useWorkSelection`).
