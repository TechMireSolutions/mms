---
description: DRY (Don't Repeat Yourself) guidelines, extraction thresholds, boundaries, and @mms/shared exports standards.
paths:
  - "packages/shared/**"
  - "apps/frontend/src/hooks/**"
  - "apps/frontend/src/tenant/hooks/**"
  - "apps/frontend/src/tenant/features/**"
  - "apps/backend/src/services/**"
---

# MMS DRY & Shared Package Policy

**Workflow skill:** `mms-shared-package` (extract/export pure helpers and Zod DTOs).

**Don't Repeat Yourself (DRY)** — every piece of knowledge, logic, and configuration must have a single, unambiguous, authoritative representation within the Madrasa Management System (MMS).

---

## 1. Proactive Search & Duplication Audits
- **Search First**: BEFORE writing any helper function, component, validation schema, utility hook, or CSS style, search `@mms/shared` (including `platformApiErrors` / platform Zod schemas), `apps/frontend/src/lib/config/` (`routes.ts`, `navConfig.tsx`, `settingsNavConfig.ts`), `apps/frontend/src/hooks/`, `apps/frontend/src/tenant/hooks/`, `apps/frontend/src/tenant/hooks/collections/`, `apps/frontend/src/tenant/features/`, `apps/frontend/src/tenant/pages/`, `apps/frontend/src/tenant/components/`, `apps/frontend/src/platform/`, `apps/frontend/src/lib/reports/`, and `apps/frontend/src/components/ui/` for existing equivalents.
- **FE Work chrome**: Before adding selection bars, empties, KPI strips, warning/archive banners, field errors, or quick-action buttons, reuse `BulkSelectionBar` + `BulkSelectionActions` (including `BulkSelectionDeleteAction`) / `EmptyState` / `FieldErrorMessage` / `ModuleCommandMetricsGrid` / `WarningCallout` / `QuickActionButton` / `formStyles` tokens (`WORK_SURFACE`, `WORK_SURFACE_INNER`, `DETAIL_SECTION_TITLE`, `FORM_CARD`, `FORM_INPUT_BUILDER`, `FORM_ERROR`) under `apps/frontend/src/components/ui/` — do not copy markup across modules. Column gates: pass `isColumnVisible` into leaves — do not fan parallel `show*` / `visibleColumns` boolean objects.
- **Extend, Don't Fork**: If an existing helper almost fits your use case, extend its parameters rather than copying it or creating a near-duplicate function.
- **Scan & Refactor**: When editing code, actively scan the surrounding files for duplicate blocks and refactor them into a unified local utility.
- **Zod SSOT**: Do not duplicate the same request/response shape in FE and BE — export once from `@mms/shared`. Schema variants via `.pick` / `.omit` / `.extend` on the shared base only — no copy-paste parallel object literals.

---

## 2. Extraction Thresholds & Strategy
Extract logic to a shared layer (e.g., `@mms/shared` or a local hook/component) if **any** of the following conditions are met:
1. **Logic Repetition**: The same logic appears >= 2 times across different files.
2. **Multi-Module / Boundary Cross**: The logic crosses feature boundaries or the frontend ↔ backend boundary.
3. **Complexity & Length**: A block of code is > 15 lines of identical or parametrically identical implementation.
4. **Layout size / z-index tokens**: The same chart height, toast max-width, filter width, or modal/toast `z-index` appears **≥ 3** times — promote to `index.css` `@theme` (e.g. `h-chart-*`, `max-w-toast`, `z-modal*`) rather than repeating ad-hoc rem utilities — `mms-ui-ux-design.md`.

*Constraint*: Keep code inlined if it is truly unique and used only once. Premature abstraction is prohibited. Logic/JSX extract threshold remains ≥2; layout-token promotion is ≥3.

### File-split DRY (same module)
When a single file exceeds the thresholds in `mms-structure-naming.md`, extract **by concern** inside the same feature folder — this is still DRY (one authority per concern), not a new abstraction layer.
- Preserve behavior and public barrels / import paths.
- Prefer controllers + presentational siblings over copy-paste “utils” that hide duplicates.
- Do not invent parallel APIs or rename public symbols during a split-only change.

---

## 3. Monorepo Layer Boundaries
Ensure clear separation of concerns to prevent domain logic from leaking into infrastructure:

```
@mms/shared              Pure validation schemas, types, constants, default configs, and I/O-free formatters.
apps/frontend/src/*      Hooks, UI, providers, Query clients (no backend imports).
apps/backend/src/*       Fastify routes, services, Drizzle schema/queries.
```

### Shared Package (`@mms/shared`) Standards
- **Import Rule**: Named exports from `@mms/shared` only (e.g. `import { Contact } from '@mms/shared'`). Subpath imports are forbidden.
- **Typical contents**: Domain types/schemas, `DEFAULT_*` configs, `*ModuleManifest`, `appTranslations*`, pure helpers (`formatDate`, `formatMoney`, `parsePhoneNumber`, …).
- **Do NOT Put in Shared**: React components, Fastify/DB query code, or browser APIs (`localStorage`, DOM).

---

## 4. Quality Bar & Code Cleanup
- **Strict Typing**: Strict TypeScript mode is mandatory. Use `unknown` and type narrowing. The use of `any` is forbidden.
- **JSDoc**: Required on **public exports** in `packages/shared` only. Omit elsewhere; do not add narrating comments to application code.
- **Unit Testing**: All non-trivial pure logic helper utilities added to `@mms/shared` must include unit tests.
- **Dead Code**: Actively prune unused imports, dead variables, and legacy shims within your change boundary.
- **Date / money formatting**: Never invent parallel formatters — use settings-driven `formatDate` / `formatMoney` — **`mms-settings-i18n.md`**.
