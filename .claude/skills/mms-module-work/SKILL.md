---
name: mms-module-work
description: Implements or reviews MMS module command centres and Work tabs — metrics, directories, drawers, bulk actions, soft-delete trash, column prefs. Use when changing PageHeader command centre, Work directory, trash/restore, bulk actions, detail drawers, filters, or mobile cards. Do NOT use for top-level 3-tier module shells (use mms-module-page), module preferences configuration (use mms-module-setup), or analytical report charts (use mms-reports-export).
license: Proprietary
metadata:
  owner: mms-platform
  last-verified: 2026-09-24
---

# MMS Module Work Workflow

**Rules (norms SSOT):** `mms-module-architecture.md` §2–§3, §6–§7 · `mms-data-layer.md` §6 · `mms-ui-ux-design.md` · `mms-performance.md`. Soft-delete workflow → `mms-soft-delete`.

## 1. Work Architecture & Command Center

- **Scope Boundary**: Work tier contains directories, CRUD, drawers, filters, and bulk actions. Zero analytical charts (belong in Reports).
- **PageHeader & Metrics**: Keep `PageHeader` visible; render command metrics using `ModuleCommandMetricsGrid`.
- **Filters SSOT**: Single filter menu via `ModuleFilterDropdown` / `ModuleFiltersMenuButton`. Active state indicated by count badge + Clear CTA; never duplicate active filters in a permanent pill bar.
- **Selection SSOT**: Page controller owns row selection via `useWorkSelection`; list-local selection state is banned.
- **Virtualization**: Mandatory `@tanstack/react-virtual` row virtualization whenever collection items > 30.

## 2. Directory Cards & UI Components

- **Card Primitives**: Standardize cards on `<DirectoryEntityCard>` (or `<DirectoryCard>`) with `<DirectoryCardFooterActions>` (min 44×44px touch floor).
- **Sub-Component Hook**: Extract per-card components and call `useWorkCardAction<TEntity>` for selection, view, edit, and keyboard handling (`Space`/`Enter`).
- **Metadata Layout**: Use `DirectoryCardMetaGrid` + `DirectoryCardMetaTile` for card key-value pairs (never `<dl>/<dt>/<dd>`).

## 3. Soft-Delete Trash & Bulk Operations

- **URL Sync & Preservation**: Bind trash mode to URL search params (`?view=trash`). Toggling `ModuleTrashToggle` must preserve active filters and search terms.
- **Toolbar Gates**: Place `ModuleTrashToggle` in `ModuleWorkToolbar` (not in Filters dropdown). Hide Create/Add and Export actions in trash mode; guard `Cmd/Ctrl+N`.
- **Detail Drawer**: When entity has `deletedAt != null`, render `ArchivedBanner` (`WarningCallout` tone="warning"). Hide Edit and communication CTAs; display Restore button.
- **Bulk Bar**: Two-layer bulk chrome — mount `ModuleUniversalBulkActionBar` (manifest/i18n adapter) over `ModuleWorkBulkActionBar` (presentational dock). Wire `BulkSelectionDeleteAction` (active mode) and `BulkSelectionRestoreAction` (trash mode). Never fork bulk-bar adapters or duplicate selection hooks.

## 4. Verification

```bash
cd apps/frontend && pnpm typecheck && pnpm lint
```
