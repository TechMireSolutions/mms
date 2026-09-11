---
description: Universal module architecture — manifest schemas, three-tier layout, soft-delete, gold-standard parity (§7), background jobs, and lifecycle rules. Applies to tenant modules and platform pages.
paths:
  - "apps/frontend/src/tenant/features/**"
  - "apps/frontend/src/platform/pages/**"
  - "apps/frontend/src/components/ui/ModuleCommandMetricsGrid.tsx"
  - "apps/frontend/src/components/ui/PageHeader.tsx"
  - "apps/frontend/src/components/ui/ResponsiveAccordionTabs.tsx"
  - "apps/frontend/src/components/ui/SubTabBar.tsx"
  - "apps/frontend/src/components/ui/DetailDrawerShell.tsx"
  - "apps/frontend/src/tenant/hooks/useModuleTierTabs.ts"
  - "apps/frontend/src/hooks/useWorkDirectoryViewMode.ts"
  - "apps/frontend/src/hooks/useModuleColumnLayout.ts"
  - "packages/shared/src/settingsTypes.ts"
  - "packages/shared/src/*ModuleManifest.ts"
  - "apps/backend/src/routes/**/*.ts"
  - "apps/backend/src/services/backgroundJob*.ts"
---

# MMS Universal Module Architecture

**Workflow skills:** new/three-tier page → `mms-module-page` · Work/trash/directory → `mms-module-work` · Setup Fields/Preferences → `mms-module-setup` · jobs → `mms-background-jobs` · Reports → `mms-reports-export`.

Definitive specification for creating, structuring, and running directory-based feature modules (e.g., Contacts, Students, Teachers) in the MMS monorepo. These architecture standards apply equally to tenant modules and platform pages; platform must not invent a parallel page shell.

---

## 1. Monorepo Manifests & Domain Modeling
Every module directory must register a single module manifest in `packages/shared/src` (e.g., `contactsModuleManifest.ts` defining `CONTACTS_MODULE_MANIFEST`):
- **Manifest schema**: Defines `moduleId`, entity types, collection/REST database keys, default filters, searchable/filterable fields, and soft-delete/restore policies.
- **Reference Overrides**: UI controls, list columns, layout hooks, and export services must import settings directly from the manifest constants. Hardcoded entity configurations are forbidden.

---

## 2. Three-Tier Page Shell & Layout
Every standard module page (e.g., `ContactsPage.tsx`, `StudentsPage.tsx`) must instantiate a `PageHeader` (persistent title, metrics banner, and create/export global CTAs) and use `useFilteredModuleTierTabs({ canViewSetup, canViewReports })` (wraps `useModuleTierTabs`) to render the operational tiers:

1. **Work (Operational Directory)**: Focuses on daily record editing and navigation. Features search, filters, views (`table` | `cards`), detail drawers, and multi-selection bulk actions. No charts or KPI dashboards belong here.
2. **Reports (Analytics)**: Focuses on charts and data exports. Features a KPI summary card strip, Recharts modules, and visual query builders.
3. **Setup (Configuration)**: Restricted via `useModulePermissions(manifest)` → `canViewSetup` / `canEditSetup` (often mapped from `configuration.view`). Houses module-specific Fields customizers and Preferences. Use `useFilteredModuleTierTabs` so forbidden tiers are omitted.

---

## 3. Work Directory & Detail Drawer
- **Search & Filter**: Search and filter operations must only target fields defined as searchable/filterable in the manifest (and shared list-query schemas).
- **Filters UI (SSOT)**: One **Filters** control (dropdown/menu) owns Work filter dimensions (presets, gender, status, sort, …). Do **not** add a parallel always-visible preset chip/pill bar that repeats options already in that menu (Contacts gold standard: `ContactsFilterMenuButton` + `CONTACTS_QUICK_FILTER_OPTIONS` in `@mms/shared`). Active state = badge count on Filters + Clear; optional `FilterChips` only for removable **active selections** (e.g. multi-status), not a second editor for the same enums.
- **Directory view mode (SSOT)**: When Work uses table|cards, resolve a single `viewMode` (`table` | `cards`) via `useWorkDirectoryViewMode` (or equivalent). Manifest `directoryViews` must be `['table','cards']` — never `list` for those directories. Default: **cards** below `md` (768px), **table** at `md+`. User toggle overrides; do **not** dual-render via CSS `md:hidden` / `hidden md:block` alongside override state. Setup `defaultViewLayout` must not drive Work directory render (preference UI may remain until prefs cleanup). Domain modules with non-directory modes (e.g. finance `invoices|payments`, attendance `mark|records`) keep their own `directoryViews` — do not coerce them to table|cards.
- **Pagination & Virtualization**: Cards and table share the same server page API — ban `maxPageSize` dumps / “switch to list” truncation. Always virtualize DOM rows when rendered items > 30 using `@tanstack/react-virtual` (`mms-performance.md`). Full policy → **`mms-data-layer.md`** (HTTP contract `mms-api-interface.md` §6).
- **Metrics**: Command-centre KPIs come from server `/metrics` (or manifest-defined endpoints), not client reduce of full lists.
- **Column layout SSOT**: Use `useModuleColumnLayout` (Contacts: `useContactColumnLayout` via `ContactConfigContext`) for visibility **and** width. Persist via module `PUT …/column-preferences` **and** device `localStorage` (`mms_{moduleId}_columns_{userId}`). On load, merge with `mergeModuleColumnPreferences` — **local width wins** on this PC; never let a server payload without `width` wipe resized columns. Resize UI: `ResizableTableHead` → `setColumnWidth`; debounce server PUT; save local immediately. Pass `isColumnVisible` into table/cards (optional `ALWAYS_COLUMN_VISIBLE`); ban parent `visibleColumns` / `show*` boolean object fans — `mms-ui-ux-design.md` · `mms-dry.md`.
- **Detail Drawer**: Selecting an entity row opens an in-place detail drawer (`DetailDrawerShell`) respecting the module's tab/field order, read/write permissions, and **all enabled registry/custom fields** (no hard-coded key allowlists that drop Setup fields). In trash / `deletedAt`: `WarningCallout` archive banner + Restore (`canDelete`); hide Edit and Call/WA/SMS/Email and create-style CTAs (gold refs: Contacts / Students / Teachers detail drawers). Header Edit and icon actions need `min-h-11` / `min-w-11` — `mms-ui-ux-design.md` §7.
- **Bulk Actions**: Use shared `BulkSelectionBar` (`@/components/ui/BulkSelectionBar`; `floating` \| `inline`) with `BulkSelectionActions` children (`BulkSelectionDeleteAction` / `BulkSelectionRestoreAction` / messaging trio) — do not invent parallel selection chrome. Mount the bar on the list/parent when records are selected; do **not** put trash/restore beside Filters/Add in Work toolbars. Enforce backend permission checks, calculate partial failures, and audit all bulk updates/deletions.

---

## 4. Setup & Module Preferences
- **Preferences Draft & Save**: Draft preferences in local editor state; persist on explicit Save when dirty. Do not leave Save always enabled on first mount.
- **Access Control**: Restricted via `useModulePermissions(manifest)` → `canEditSetup` / `canViewSetup`. Render a read-only message when view-only.

---

## 5. Background Jobs & Processing
Operations that exceed direct interaction limits or process massive records must run as background jobs:
- **Eligible Actions**: Large CSV data exports/imports, bulk messaging queues, database deduplication scans, and long report generations.
- **User UX**: Staged tasks must update in the global `BackgroundJobsTray`. Show status (`running | completed | failed`), progress percentage, error counts, and download links.
- **Backend Isolation**: Run background tasks in isolated workers (`worker.ts` / `jobRunnerProcess.ts`). Enforce RBAC at enqueue **and** execute. Bind jobs to tenant + user; use an idempotency key when retries are expected (`mms-api-interface.md` §6).
- **Claim semantics**: Workers claim the next pending job with `FOR UPDATE SKIP LOCKED` (see `worker.ts`) so concurrent workers do not double-run the same row.
- **Multi-instance**: Current runner is in-process — do **not** pretend a Redis/durable queue exists. Multi-instance deploy needs a durable shared queue before scaling workers horizontally. Workflow → skill **`mms-background-jobs`**.

---

## 6. Security Boundaries & Isolation
- **RLS**: Transaction-scoped SET LOCAL — **`mms-data-layer.md`** (do not restate recipes here).
- **RBAC**: Apply `can('module.action')` checks globally. Omit forbidden actions from the DOM (never disabled placeholders).
- **Soft Deletion Architecture (Work UX & API Lifecycle)**: Prefer soft-delete over hard `DELETE`. API/FE camelCase `deletedAt` / `deletedBy`; SQL `deleted_at` / `deleted_by` (typed columns mandatory). Schema strip / partial indexes / RLS / triggers → `mms-data-layer.md` §6 · complete operational checklist → skill **`mms-soft-delete`**.
  - **Module Manifest Contract**: Declare `softDelete` block in `@mms/shared` manifests (`workExcludesDeleted`, `reportsIncludeDeleted`, `exportsIncludeDeleted`, `duplicatesIncludeDeleted`, `captureDeletionReason`, `retentionDays`). When `captureDeletionReason: false`, suppress deletion reason prompts in UI.
  - **Single-Record Read Semantics**: `GET /:id` returns `404 Not Found` for archived records on standard active browses. Trash inspection via `GET /:id?includeDeleted=true` requires `canDeleteCollection(user, collection)` and sets `app.include_deleted = 'true'`.
  - **Atomic Conditional Latch**: Soft-delete updates must use atomic conditional clauses (`UPDATE table SET deleted_at = NOW(), ... WHERE id = :id AND deleted_at IS NULL RETURNING id`) to prevent TOCTOU concurrent delete races.
  - **Batched Bulk Operations**: `bulkDeleteFn` and `bulkRestoreFn` must execute a single batched SQL `UPDATE ... WHERE id IN (...) AND deleted_at IS NULL` — per-row iteration loops are strictly banned (`mms-performance.md` §1).
  - **Uniqueness-on-Restore & Error 23505 Trap**: Handlers restoring records with unique fields (`email`, `phone`, `employee_id`) must pre-check active conflicts and trap PostgreSQL error `23505` (`unique_violation`), mapping to `409 Conflict`.
  - **Outbox CDC & Cache Eviction**: Emit `entity.soft_deleted` and `entity.restored` transactional outbox events with monotonic versioning (`version: Date.now()`) to drive Meilisearch tombstone eviction and Redis cache clearing. External consumers must drop stale/out-of-order events.
  - **Forensic Content Snapshotting**: Capture full snapshots of text/note content in audit event payloads upon archival to ensure survival after hard purges.
  - **Frontend UX Standard**:
    - **URL State Synchronization**: Synchronize `viewingDeleted` with URL search params (`?view=trash` via `useSearchParams`).
    - **Filter State Preservation**: Toggling `ModuleTrashToggle` must preserve active search terms and faceted filter selections.
    - **Controls & CTAs**: Mount `ModuleTrashToggle` in `ModuleWorkToolbar` (not in filter dropdowns). Hide Add/Create CTA and export buttons when `viewingDeleted = true`. Guard `Cmd/Ctrl+N` to check `!viewingDeleted && canWrite`.
    - **Bulk Actions**: Wire `BulkSelectionDeleteAction` (active mode) and `BulkSelectionRestoreAction` (trash mode) via `ModuleWorkBulkActionBar`.
    - **Detail Drawer Precedence**: When an archived record drawer is opened, render `ArchivedBanner` (`WarningCallout` tone="warning"). Hide Edit, Call, SMS, WhatsApp, and Email buttons. Drawer takes precedence over bulk selections, and restore acts strictly on the drawer entity.
    - **Optimistic Undo Toast**: Single-record deletions trigger an instant TanStack Query cache hide with a 5–10s Undo toast triggering `POST /:id/restore`.
    - **Retention Expiry Countdown**: Display countdown badges in trash views and drawers (`Purges in N days` / `Archived indefinitely`).
  - **Referential Integrity Contract**: Modules define either Restrict Guard (`activeEntriesCount > 0` → 409 Conflict) or Programmatic Atomic Cascade (`deleted_with_cascade = true`). When cascading, lock parent row (`FOR UPDATE`) to prevent child insertion races (`docs/soft-delete.md` §2.2 & §4.6).
  - **Active Foreign Key Guarding**: Reject writes attempting to assign foreign keys pointing to soft-deleted entities (`deleted_at IS NOT NULL`), preventing ghost relationships (`docs/soft-delete.md` §1.8).
  - **Documented variants**: Messaging admin clear soft-archives logs (not a row trash browser); Question Bank tests/papers and assessment_results remain upsert-only by design.
  - **When adding REST CRUD**: Ship `DELETE` soft-delete + `POST :id/restore`, list `includeDeleted`, and Work trash UI (or document intentional hard-delete / variant in manifest `softDelete`).

---

## 7. Gold-standard parity (REST tenant modules and platform pages)

Align new or refactored modules with **Contacts, Students, and Teachers** as the gold-standard bar for person-directory Work/Setup (shared `Module*` / `createModule*` / `registerModule*` factories; module config via `createStandardModuleConfigHook` + `useStandardModuleConfig` — `mms-hooks.md`). **Users / Sessions** Work REST and typed Setup REST are closed; residual document-store Setup is other modules per `mms-migration-status.md` P3. Checklist:

| Requirement | Standard |
|-------------|----------|
| **Bulk PUT** | Upsert only — HTTP norms → **`mms-api-interface.md` §5** (never wipe-missing-rows on API write paths). |
| **Soft-delete** | `DELETE` + `POST :id/restore` (+ batched bulk SQL); URL-synchronized `viewingDeleted` (`?view=trash`); `ModuleTrashToggle` in toolbar; filter state preserved; drawer `ArchivedBanner` (`WarningCallout`) + Restore; hide Add/messaging/exports in trash; `Cmd/Ctrl+N` guard; 23505 conflict trap on restore; optimistic Undo toast (5–10s); outbox CDC events (`entity.soft_deleted`, `entity.restored`). Schema strip / partial indexes / RLS / triggers → `mms-data-layer.md` §6 · `mms-soft-delete`. |
| **Mutations** | `mutateAsync` + await form `onSave` / setup save; close modals only after success. |
| **Setup** | Manifest `setupSubTabs` (`preferences` default); `canEditSetup` gates edits (`saveSettingsAsync`); read-only message when view-only; Preferences Save dirty-gated. |
| **Work UX** | `ErrorState` + retry **and** hint description (`loadFailedHint` or module/platform equivalent — tenant Work **and** apex lists); directory empties via `EmptyState` (`title` required; dashed when bordered; `compact` when dense); Cmd/Ctrl+N opens create when `canWrite` and not in trash; Filters menu SSOT (no duplicate preset chip bar); selection UI via `BulkSelectionBar` + `BulkSelectionActions` (`BulkSelectionDeleteAction` / Restore / Messaging) on list/parent (not toolbar-inline trash); column gates via `isColumnVisible` through content (not typed boolean maps); single resolved directory `viewMode` (`table` \| `cards`; cards `< md`, table `md+`); same server pagination for both views; virtualize table/cards rows when items > 30 (`@tanstack/react-virtual` — `mms-performance.md`); column visibility **and** width via `useModuleColumnLayout` (local + `/column-preferences`, merge preserves device widths). |
| **Manifest** | `setupSubTabs`, `softDelete`, `work.bulkActions`, permissions — import constants; do not hardcode tier/sub-tab ids. Person-directory Work: `directoryViews: ['table','cards']` (never `list`). Other modules may use domain sub-modes (finance/attendance/…) — do not coerce those to table\|cards. |
| **i18n / RBAC** | All copy via `t()`; `useModulePermissions(manifest)` — omit forbidden CTAs. |

**Do not regress**: reintroducing bulk wipe on PUT, fire-and-forget `mutate()` that closes forms before success, soft-delete API without Work trash (unless manifest documents the intentional variant), a Work preset pill bar that duplicates the Filters menu, person-directory `directoryViews: ['list',…]` drift, unpaged `loadAllFn` dumps, resetting directory search/filters on trash toggle, missing PostgreSQL 23505 conflict trap on restore, per-row loops in bulk delete/restore.
