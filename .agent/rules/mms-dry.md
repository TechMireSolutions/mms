---
trigger: model_decision
description: DRY (Don't Repeat Yourself) guidelines, extraction thresholds, boundaries, and @mms/shared exports standards.
---

# MMS DRY & Shared Package Policy

**Workflow skill:** `mms-shared-package` (extract/export pure helpers and Zod DTOs).

## 1. Proactive Search & Duplication Audits

- **Search First:** Audit `@mms/shared`, `apps/frontend/src/lib/config/`, `apps/frontend/src/hooks/`, and `@/components/ui/` before authoring new utilities, DTOs, or primitives. Extend existing shared abstractions.
- **Shared Chrome SSOT:** Reuse central primitives (`BulkSelectionBar`, `ModuleUniversalBulkActionBar`, `ModuleWorkBulkActionBar`, `ModuleTrashToggle`, `EmptyState`, `FieldErrorMessage`, `ModuleCommandMetricsGrid`, `WarningCallout`, `DirectoryCard`, `DetailSheet`) and `formStyles` tokens. Duplicating UI markup across feature directories is strictly banned.
- **Entity Descriptors:** Consume declarative `EntityDescriptor<T>` registries (`@/components/common/entityRegistry`, `mms-ui-ux-design.md` §6). Runtime labels mandate `labelKey: AppTranslationKey`.
- **Node 24 Built-Ins:** Use native `glob`, `crypto.hash()`, `URLPattern`, `using`/`await using`, and `process.loadEnvFile()` instead of introducing third-party packages.
- **Zod DTO SSOT:** Share request/response contracts in `@mms/shared`. Derive variants via `.pick()`, `.omit()`, or `.extend()`.

## 2. Extraction Thresholds & Strategy

- **Trigger Conditions:** Promote logic to shared layers (`@mms/shared` or central UI/hooks) when:
  1. Identical logic appears $\ge 2$ times across separate files.
  2. Logic crosses feature or frontend $\leftrightarrow$ backend boundaries.
  3. Logic exceeds 15 lines of identical or parametrically identical code.
  4. Dimension, toast width, or z-index appears $\ge 3$ times (promote to `index.css` `@theme`).
- **File Sizing Decomp:** When single files exceed 200 lines (`mms-structure-naming.md` §3), decompose by concern within the feature folder without modifying barrel exports.

## 3. Monorepo Layer Boundaries

- **`@mms/shared`:** Pure validation schemas, types, constants, default configs, and I/O-free formatters. Named exports only; subpath imports banned. Zero React, DOM, Fastify, or database dependencies.
- **`apps/frontend`:** React hooks, UI primitives, providers, and TanStack Query facades. Direct cross-feature imports (`featureA` from `featureB`) are banned; route via `@/tenant/hooks/collections/*` facades or promote to `components/ui`.
- **`apps/backend`:** Fastify routes, services, repositories, and Drizzle schemas/queries.

## 4. Quality Bar & Code Cleanup

- **Strict Type Narrowing:** Strict TypeScript required. Use `unknown` + narrowing. Explicit `any` is strictly banned (`@typescript-eslint/no-explicit-any`, ratcheted via `check:code-norms`).
- **Documentation & Tests:** JSDoc required on public exports in `packages/shared` only; omit elsewhere. Pure helpers in `@mms/shared` require unit tests.
- **Dead Code Elimination:** Prune unused imports, dead variables, and legacy shims within your change boundary.
- **Formatting SSOT:** Format all dates and currency via settings-driven `formatDate` and `formatMoney` from `@mms/shared` (`mms-settings-i18n.md`).
- **Banned Anti-Patterns:** Per-module bulk-bar forks (use unified `ModuleUniversalBulkActionBar`); per-list selection hooks (use shared `useWorkSelection`).

## 5. Workflow & Output Speed Rules

- **Zero Output Bloat:** Emit surgical diffs or targeted snippets only. Never rewrite entire files unless creating a new file from scratch. Omit conversational greetings, polite preambles, and post-code summaries.
- **Verification Gates:** Verify with `pnpm typecheck` and `pnpm test`. If standards/rules are altered, execute `bash .agent/scripts/sync-all.sh` and verify with `node scripts/verify-rules-integrity.mjs`.
