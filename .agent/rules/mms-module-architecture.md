---
trigger: model_decision
description: Universal module architecture — manifest schemas, three-tier layout, soft-delete, gold-standard parity (§7), background jobs, and lifecycle rules. Applies to tenant modules and platform pages.
---

# MMS Universal Module Architecture

**Workflow skills:** new page → `mms-module-page` · Work/trash → `mms-module-work` · Setup → `mms-module-setup` · jobs → `mms-background-jobs` · Reports → `mms-reports-export`.

## 1. Monorepo Manifests & Domain Modeling

- Register a single manifest in `packages/shared/src` (e.g. `CONTACTS_MODULE_MANIFEST`). Defines `moduleId`, entity types, collection/REST keys, default filters, searchable/filterable fields, and soft-delete/restore policies.
- UI controls, list columns, layout hooks, and export services import directly from manifest constants. Ban hardcoded entity configurations.

## 2. Three-Tier Page Shell & Layout

- Standard module pages instantiate `PageHeader` and `useFilteredModuleTierTabs({ canViewSetup, canViewReports })`:
  1. **Work (Operational Directory)**: Daily record editing, search, filters, views (`table` | `cards`), detail drawers, bulk actions. No charts or KPI dashboards.
  2. **Reports (Analytics)**: Summary KPI card strip, Recharts modules, and visual query builders.
  3. **Setup (Configuration)**: Restricted via `useModulePermissions(manifest)` → `canViewSetup`/`canEditSetup`. Houses Fields customizers and Preferences. Forbidden tiers are omitted.

## 3. Work Directory & Detail Drawer

- **Filters UI SSOT**: Single Filters dropdown owns Work dimensions (presets, status, sort). Ban duplicate chip bars for identical options (`ContactsFilterMenuButton` gold standard). `FilterChips` only for active removable selections.
- **Directory View Mode SSOT**: Single `viewMode` (`table` | `cards`) via `useWorkDirectoryViewMode`. Manifest `directoryViews: ['table','cards']` (never `list` for person directories). Default cards `< md`, table `md+`. Ban dual-rendering with CSS display utilities.
- **Pagination & Virtualization**: Cards and table share identical server pagination. Virtualize DOM rows via `@tanstack/react-virtual` when rendered items > 30 (`mms-performance.md`). Command KPIs load via server `/metrics`, never client reduce of full lists.
- **Column Layout SSOT**: `useModuleColumnLayout` manages visibility and width. Persist via PUT `/column-preferences` and `localStorage` (`mms_{moduleId}_columns_{userId}`). Local widths take precedence; debounce server PUTs. Pass `isColumnVisible` into table/cards; ban boolean flag bags (`show*`).
- **Detail Drawer**: `DetailDrawerShell` renders entity fields in tab/field registry order with all enabled custom fields. In trash mode, show `WarningCallout` banner + Restore; hide Edit and communication CTAs. Header action buttons enforce `min-h-11`/`min-w-11`.
- **Selection SSOT**: Selection state is owned by the page controller via shared `useWorkSelection`; list-local selection state is banned. Directory rows, select-all controls, bulk bars, and keyboard shortcuts bind to controller selection.
- **Bulk Actions**: Two-layer bulk chrome — presentational `ModuleWorkBulkActionBar` dock with manifest/i18n adapter `ModuleUniversalBulkActionBar`. Mount floating or inline. Escape key clears selection. Never place bulk actions inline with toolbar filters.

## 4. Setup & Module Preferences

- Draft preferences in local editor state; persist on explicit Save when dirty. Do not mount Save button enabled by default. Gate with `canEditSetup`.

## 5. Background Jobs & Processing

- Offload long tasks (large CSV import/export, bulk messaging, dedup scans, complex reports) to BullMQ worker process (`apps/backend/src/worker/index.ts`). Never run in the API request path.
- Updates stream via global `BackgroundJobsTray` (`running | completed | failed`, progress percentage, error counts, download links).
- Worker jobs require: (a) idempotency key, (b) bounded retry with backoff, (c) execution-time tenant/user verification, and (d) concurrency isolation. Re-sending user messages or charging payments on automatic retry is strictly banned.

## 6. Security Boundaries & Isolation

- **RLS & RBAC**: Enforce transaction-scoped RLS (`SET LOCAL`) and `can('module.action')`. Omit unauthorized actions from DOM.
- **Soft Deletion & Work Trash Standard**:
  - Manifest contract: declare `softDelete` configuration (`workExcludesDeleted`, `reportsIncludeDeleted`, `captureDeletionReason`, `retentionDays`).
  - Active browses return `404` for archived entities. Synchronize trash mode via URL param `?view=trash` (`ModuleTrashToggle` in toolbar).
  - Toggling trash preserves search and faceted filters. In trash: hide Create/Add, bulk delete, and communication CTAs; show Restore.
  - Non-financial single-record deletions trigger optimistic cache hide + 5–10s Undo toast calling `POST /:id/restore`.
  - Trap PostgreSQL 23505 unique constraint conflicts upon restore. Emit outbox CDC events (`entity.soft_deleted`, `entity.restored`).

## 7. Gold-standard parity (REST tenant modules and platform pages)

Align modules with **Contacts, Students, and Faculty** person-directory standard:
- **Bulk PUT**: Upsert only — HTTP contract `mms-api-interface.md` §5 (never wipe missing records).
- **Soft-delete**: `DELETE` + `POST /:id/restore` (+ batched bulk SQL); URL `?view=trash`; `ModuleTrashToggle` in toolbar; filter state preserved; drawer `WarningCallout` archive banner + Restore; hide create/actions in trash; `Cmd/Ctrl+N` guard; 23505 conflict trap on restore; 5–10s optimistic Undo toast; outbox CDC logging (`mms-data-layer.md` §6).
- **Mutations**: `mutateAsync` + await form `onSave`; close modals only after mutation resolution.
- **Setup**: Manifest `setupSubTabs` (`preferences` default); `canEditSetup` gates writes; read-only fallback when view-only; Preferences Save dirty-gated.
- **Work UX**: `ErrorState` with retry + hint description (`loadFailedHint`); `EmptyState` (`title` required, `compact` when dense); `Cmd/Ctrl+N` create shortcut (`!viewingDeleted && canWrite`); Filters menu SSOT; controller-owned selection via `useWorkSelection`; two-layer bulk-bar chrome; `isColumnVisible` gates; single resolved `viewMode` (`table` | `cards`); desktop tables use `WorkBatchTable`; cards use `DirectoryCard`/`DirectoryEntityCard` + `useWorkCardAction`; identical server pagination; row virtualization over 30 items; `useModuleColumnLayout` column width/visibility persistence.
- **Manifest**: Import constants (`setupSubTabs`, `softDelete`, `work.bulkActions`, permissions). Person directories enforce `directoryViews: ['table','cards']`.
- **i18n / RBAC**: All copy via `t()`; `useModulePermissions(manifest)` gates CTAs. Intersect persisted tier/sub-tab selections with active permissions before rendering content.
