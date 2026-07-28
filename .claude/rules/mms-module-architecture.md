---
description: Universal module architecture — manifest schemas, three-tier layout, soft-delete, gold-standard parity (§7), background jobs, and lifecycle rules.
paths:
  - "apps/frontend/src/pages/**/*.tsx"
  - "apps/frontend/src/components/**"
  - "packages/shared/src/settingsTypes.ts"
  - "packages/shared/src/*ModuleManifest.ts"
  - "apps/backend/src/routes/**/*.ts"
  - "apps/backend/src/services/backgroundJob*.ts"
---

# MMS Universal Module Architecture

Definitive specification for creating, structuring, and running directory-based feature modules (e.g., Contacts, Students, Teachers) in the MMS monorepo.

---

## 1. Monorepo Manifests & Domain Modeling
Every module directory must register a single module manifest in `packages/shared/src` (e.g., `contactsModuleManifest.ts` defining `CONTACTS_MODULE_MANIFEST`):
- **Manifest schema**: Defines `moduleId`, entity types, collection/REST database keys, default filters, searchable/filterable fields, and soft-delete/restore policies.
- **Reference Overrides**: UI controls, list columns, layout hooks, and export services must import settings directly from the manifest constants. Hardcoded entity configurations are forbidden.

---

## 2. Three-Tier Page Shell & Layout
Every standard module page (e.g., `Contacts.tsx`, `Students.tsx`) must instantiate a `PageHeader` (persistent title, metrics banner, and create/export global CTAs) and use `useModuleTierTabs()` to render exactly three operational tabs:

1. **Work (Operational Directory)**: Focuses on daily record editing and navigation. Features search, filters, views (table/grid), detail drawers, and multi-selection bulk actions. No charts or KPI dashboards belong here.
2. **Reports (Analytics)**: Focuses on charts and data exports. Features a KPI summary card strip, Recharts modules, and visual query builders.
3. **Setup (Configuration)**: Restricted to workspace admins (`can('configuration.view')`). Houses module-specific Fields customizers and Preferences configurations.

---

## 3. Work Directory & Detail Drawer
- **Search & Filter**: Search and filter operations must only target fields defined as searchable/filterable in the manifest.
- **Pagination**: Work directories use server page/filter APIs — do not load full collections client-side for REST modules.
- **Metrics**: Command-centre KPIs come from server `/metrics` (or manifest-defined endpoints), not client reduce of full lists.
- **Detail Drawer**: Selecting an entity row opens an in-place detail drawer (instead of page navigation) respecting the module's tab/field order, read/write permissions, and custom fields.
- **Bulk Actions**: Bulk operation bars slide in only when records are selected. Enforce backend permission checks, calculate partial failures, and audit all bulk updates/deletions.

---

## 4. Setup, Fields Registry & Preferences
- **Custom Fields Builder**: Custom fields can be created dynamically, storing definitions in tenant-scoped registries (e.g., `contact_field_config`).
- **Dependency Guard**: Warn and block field deletions using `get*FieldRemovalIssues()` if the field contains active data or is configured in table column views.
- **Auto-Saving**: Form builder and field reordering config changes must save immediately (`saveObject` writes) to prevent local-state drift. General settings changes require an explicit "Save" click.

---

## 5. Background Jobs & Processing
Operations that exceed direct interaction limits or process massive records must run as background jobs:
- **Eligible Actions**: Large CSV data exports/imports, bulk messaging queues, database deduplication scans, and long report generations.
- **User UX**: Staged tasks must update in the global `BackgroundJobsTray`. Show status (`running | completed | failed`), progress percentage, error counts, and download links.
- **Backend Isolation**: Run background tasks in isolated workers (`worker.ts` / `jobRunnerProcess.ts`). Enforce RBAC at enqueue **and** execute. Bind jobs to tenant + user; use an idempotency key when retries are expected.

---

## 6. Security Boundaries & Isolation
- **Row-Level Security (RLS)**: Enforce transaction-scoped tenant RLS context using `set_config` with `is_local: true` (SET LOCAL) on pooled connections, as defined in **`mms-data-layer.md`**. Prohibit global config settings.
- **RBAC**: Apply `can('module.action')` checks globally. Render options based on permissions (forbidden actions must be omitted entirely from the DOM, never rendered as disabled placeholders).
- **Soft Deletion**: Use `deletedAt` and `deletedBy` instead of raw `DELETE` SQL operations. Filter deleted rows from standard queries while permitting permitted users to view/restore archives.
  - **Reference FE**: Contacts / Students / Teachers pattern — Work trash toggle (`includeDeleted`), row restore, bulk restore, omit Add/messaging/destructive create in trash mode. Same pattern shipped on Sessions, Attendance, Enrollments, Finance, Accounting, Obligations, Hasanat, Examinations, Question Bank (questions), Users (`tenant_users.deleted_at`; `status` remains invite/suspend).
  - **Documented variants**: Messaging admin clear soft-archives logs (not a row trash browser); Question Bank tests/papers and assessment_results remain upsert-only by design.
  - **When adding REST CRUD**: Ship `DELETE` soft-delete + `POST :id/restore`, list `includeDeleted`, and Work trash UI (or document intentional hard-delete / variant in manifest `softDelete`).

---

## 7. Gold-standard module parity (required for REST modules)

Align new or refactored modules with Students / Contacts as the bar. Checklist:

| Requirement | Standard |
|-------------|----------|
| **Bulk PUT** | Upsert only — repository `bulkSave` + `conflictTarget` (or equivalent merge-by-id). **Never** call `replaceForWorkspace` / wipe-missing-rows from API bulk write paths. |
| **Soft-delete** | `DELETE` + `POST :id/restore` (+ bulk when applicable); Work `showDeleted` / `includeDeleted` trash UI; manifest `softDelete` metadata. |
| **Mutations** | `mutateAsync` + await form `onSave` / setup save; close modals only after success. |
| **Setup** | Manifest `setupSubTabs`; `canEditSetup` gates edits (`saveSettingsAsync`); SubTabBar always visible; read-only message when view-only. |
| **Work UX** | `ErrorState` + retry on list query failure; Cmd/Ctrl+N opens create when `canWrite` and not in trash. |
| **Manifest** | `setupSubTabs`, `softDelete`, `work.bulkActions`, permissions — import constants; do not hardcode tier/sub-tab ids. |
| **i18n / RBAC** | All copy via `t()`; `useModulePermissions(manifest)` — omit forbidden CTAs. |

**Do not regress**: reintroducing bulk wipe on PUT, fire-and-forget `mutate()` that closes forms before success, or soft-delete API without Work trash (unless manifest documents the intentional variant).
