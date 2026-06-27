---
trigger: model_decision
---

# MMS Universal Module Architecture

Definitive specification for creating, structuring, and running directory-based feature modules (e.g., Contacts, Students, Teachers) in the MMS monorepo.

---

## 1. Monorepo Contracts & Domain Modeling
Every module directory must register a single module contract in `packages/shared/src` (e.g., `contactsModuleContract.ts` defining `CONTACTS_MODULE_CONTRACT`):
- **Contract Schema**: Defines `moduleId`, entity types, collection/REST database keys, default filters, searchable/filterable fields, and soft-delete/restore policies.
- **Reference Overrides**: UI controls, list columns, layout hooks, and export services must import settings directly from the contract constants. Hardcoded entity configurations are forbidden.

---

## 2. Three-Tier Page Shell & Layout
Every standard module page (e.g., `Contacts.tsx`, `Students.tsx`) must instantiate a `PageHeader` (persistent title, metrics banner, and create/export global CTAs) and use `useModuleTierTabs()` to render exactly three operational tabs:

1. **Work (Operational Directory)**: Focuses on daily record editing and navigation. Features search, filters, views (table/grid), detail drawers, and multi-selection bulk actions. No charts or KPI dashboards belong here.
2. **Reports (Analytics)**: Focuses on charts and data exports. Features a KPI summary card strip, Recharts modules, and visual query builders.
3. **Setup (Configuration)**: Restricted to workspace admins (`can('configuration.view')`). Houses module-specific Fields customizers and Preferences configurations.

---

## 3. Work Directory & Detail Drawer
- **Search & Filter**: Search and filter operations must only target fields defined as searchable/filterable in the contract.
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
- **Backend Isolation**: Run background tasks in isolated workers. Job executions must run in `apps/backend/src/worker.ts` and `apps/backend/src/jobRunnerProcess.ts`. Enforce RBAC security checks at queue and execute times.

---

## 6. Security Boundaries & Isolation
- **Row-Level Security (RLS)**: Enforce transaction-scoped tenant RLS context using `set_config` with `is_local: true` (SET LOCAL) on pooled connections, as defined in **`mms-data-layer.md`**. Prohibit global config settings.
- **RBAC**: Apply `can('module.action')` checks globally. Render options based on permissions (forbidden actions must be omitted entirely from the DOM, never rendered as disabled placeholders).
- **Soft Deletion**: Use `deletedAt` and `deletedBy` instead of raw `DELETE` SQL operations. Filter deleted rows from standard queries while permitting admins to view/restore archives.
