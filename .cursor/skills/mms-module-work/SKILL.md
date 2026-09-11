---
name: mms-module-work
description: Implements or reviews MMS module command centres and Work tabs — metrics, directories, drawers, bulk actions, soft-delete trash, column prefs. Use when changing PageHeader command centre, Work directory, trash/restore, bulk actions, detail drawers, filters, or mobile cards.
---

# MMS Module Work Workflow

**Rule (norms SSOT):** `mms-module-architecture.mdc` §2–§3, §6–§7. Also `mms-auth-security.mdc`, `mms-data-layer.mdc` §6, `mms-performance.mdc`. Soft-Delete System SSOT → **`mms-soft-delete`**.

## Reference

- Contacts: `apps/frontend/src/tenant/features/contacts/ContactsPage.tsx`
- Soft-delete Work pattern: Students, Teachers, Sessions, Attendance, Enrollments, Finance, Accounting, Obligations, Hasanat, Examinations, QB questions, Users
- Platform pattern: Work directories on the platform apex (e.g. Workspaces) follow identical patterns to tenant modules.
- Variants: Messaging (log clear soft-archive); QB tests/papers + assessment_results (upsert-only)
- Manifests: `packages/shared/src/*ModuleManifest.ts`
- Collections hooks: `apps/frontend/src/tenant/hooks/collections/*`

## Workflow

1. Read/update `{module}ModuleManifest.ts` before wiring UI constants.
2. `PageHeader` stays visible — metrics, add, export, integrity tools live there.
3. Work = directory/CRUD/drawer/filters/bulk only — no charts.
4. **Filters SSOT**: one Filters menu owns presets/dimensions; no always-visible chip bar that repeats the same options. Build the filter menu with the shared `ModuleFilterDropdown` + `ModuleFilterCheckboxGroup` / `ModuleFilterRadioGroup` (`ModuleFiltersMenuButton`) — do not inline raw `DropdownMenu` filter chrome in Work toolbars. Preset ids + `labelKey`s live in `@mms/shared` next to the list-query schema (Contacts: `CONTACTS_QUICK_FILTER_OPTIONS`). Active state = badge + Clear; `FilterChips` only for removable active multi-selects.
5. **View mode**: person-directory Work → `directoryViews: ['table','cards']` (never `list`); domain modules keep their own sub-modes (finance/attendance/…). Resolve one `viewMode`; defaults/cards paging — rule §3.
6. REST modules: Query hooks + server pagination/`/metrics` — no full-collection client reduce; no new `useLiveCollection`; ban `loadAllFn` / unpaged list GET. Prefer **keyset/cursor** for hot/large directories when touching list APIs — `mms-data-layer.mdc`.
7. `useModulePermissions(manifest)` / `can()` (tenant) or `platformUserCan` (platform) — omit forbidden CTAs (UI hide ≠ security; BE `rbacService` / platform guards still required).
8. **Soft-delete Work UX**:
   - **URL Search Param Sync**: Synchronize `viewingDeleted` with URL search params (`?view=trash` via `useSearchParams`). Query hook maps `viewingDeleted` to `includeDeleted`. Deep linking to trash works seamlessly.
   - **Filter State Preservation**: Toggling `ModuleTrashToggle` must preserve active search query and filter selections — never reset filters on toggle (`docs/soft-delete.md` §7.10).
   - **Toolbar Controls**: Mount `ModuleTrashToggle` directly in `ModuleWorkToolbar` (not in Filters dropdown). Hide Add/Create and Export CTAs when `viewingDeleted = true`. Guard `Cmd/Ctrl+N` shortcut: check `!viewingDeleted && canWrite`.
   - **Bulk Actions**: Wire `BulkSelectionDeleteAction` (active mode) and `BulkSelectionRestoreAction` (trash mode) via `ModuleWorkBulkActionBar`.
   - **Detail Drawer & Precedence**: On `deletedAt != null`, render `ArchivedBanner` (`WarningCallout` tone="warning") above drawer tabs. Hide Edit, Call, SMS, WhatsApp, and Email buttons; show Restore button (gated on `canDelete`). When drawer opens with active bulk selection, drawer takes precedence; restore operates strictly on the drawer entity.
   - **Optimistic Undo Toast**: Single-record deletions trigger an instant TanStack Query cache hide with a 5–10s Undo toast triggering `POST /:id/restore` without forcing navigation to trash.
   - **Retention Expiry Countdown**: Render countdown badge in trash directory and drawer (`⚠️ Purges in N days` if $\le 7$ days, or `Archived indefinitely` if null).
9. §7: `ErrorState`+retry+hint on list `isError`; directory empties via `ModuleWorkDirectoryEmpty` (`title` via `t()`; `compact` when dense; Clear Filters / Show Active CTAs — Teachers uses `teachers.noTeachersMatchFilters` / `teachers.noDeletedTeachers` / `teachers.tryAdjustingFilters` / `teachers.clickAddTeacher` / `teachers.emptyDirectoryReadOnly` / `teachers.clearFilters`); Cmd/Ctrl+N when `canWrite` && !trash; await `mutateAsync` before close; bulk selection via floating/inline `BulkSelectionBar` + `BulkSelectionActions` (`BulkSelectionDeleteAction` / `BulkSelectionRestoreAction` / Messaging) on list/parent (not toolbar-inline trash); column gates via `isColumnVisible` into table/cards.
10. **Column layout**: `useModuleColumnLayout` — merge/local-width rules in rule §3 (do not restate). Pass `isColumnVisible` through content — ban `visibleColumns` boolean object fans.
11. **Mandatory Work table & list virtualization**: always virtualize DOM rows when rendered items > 30 using `@tanstack/react-virtual` (following `ContactsListDesktopTable.tsx`) — ban unvirtualized rendering of long collections — `mms-performance.mdc`.
12. Command/report KPI **StatCard strips** → `ModuleCommandMetricsGrid` when adding metrics — `mms-ui-ux-design.mdc`.
13. Contacts report KPIs: `activeCount` = soft-delete-filtered roster length (form never writes `isActive`).
14. Contacts mutations invalidate messaging resolve Query keys when person data changes.

## Checklist

```
- [ ] PageHeader visible on all tiers; metrics permission-scoped (tenant or platform)
- [ ] Create omitted when !canWrite (or !platformUserCan); Cmd/Ctrl+N when allowed && !viewingDeleted
- [ ] Server pagination / metrics — no unbounded client lists / no `loadAllFn`
- [ ] Hot/large directories: keyset preference when touching list APIs
- [ ] Person-directory: `directoryViews: ['table','cards']`; cards + table same page API
- [ ] Soft-delete trash + restore: URL synced ?view=trash; ModuleTrashToggle in toolbar; filter state preserved on toggle
- [ ] Optimistic soft-delete with 5–10s Undo toast for single-record delete
- [ ] Detail drawer uses ArchivedBanner (WarningCallout) + Restore; hides edit/comm CTAs; drawer takes precedence over bulk select
- [ ] Retention expiry countdown badge displayed in trash and drawer (Purges in N days / Archived indefinitely)
- [ ] Bulk selection bar uses shared `BulkSelectionBar` + `BulkSelectionActions` (`BulkSelectionDeleteAction` / Restore / Messaging) on list/parent (no forked floating/inline chrome; no toolbar-inline trash)
- [ ] Directory empties use `ModuleWorkDirectoryEmpty` / `EmptyState` (`title` required; dashed when bordered; `compact` when dense)
- [ ] Column gates via `isColumnVisible` into leaves (no `visibleColumns`/`show*` boolean fans)
- [ ] ErrorState + retry + hint on list isError (not empty success)
- [ ] New KPI StatCard strips use `ModuleCommandMetricsGrid`
- [ ] mutateAsync awaited before form close
- [ ] Bulk actions: eligibility + partial failure reporting
- [ ] Export respects filters, RBAC, soft-delete policy (hidden in trash mode if exportsIncludeDeleted: false)
- [ ] Filters menu SSOT — no duplicate preset pill bar; shared preset options when cross-layer
- [ ] Directory viewMode SSOT — cards default `< md`, table `md+`; toggle overrides without CSS dual-render
- [ ] Column widths persist — local + `/column-preferences`; merge preserves device widths
- [ ] Copy via t(); no raw fetch('/api/...')
- [ ] Mandatory virtualization: `@tanstack/react-virtual` for tables/lists/cards > 30 items (`mms-performance.mdc`); card rows `< md` and/or `overflow-x-auto` tables; touch ≥ 44px (`mms-ui-ux-design.mdc` §7)
```

## Do Not

- Put reports/KPIs charts in Work.
- Dual-write Query + `saveCollection` for the same entity.
- Show forbidden actions as disabled clutter.
- Treat `isError` as an empty directory.
- Reintroduce a Work preset chip bar that duplicates Filters menu options.
- Reset active search query or filters when toggling `ModuleTrashToggle`.
- Render ModuleTrashToggle inside the Filters dropdown menu.
- Show Add/Create or Export CTAs when browsing trash mode.
- Dual CSS breakpoint render + separate viewMode override for the same directory.
- Overwrite local column widths with server prefs that omit `width`.

## Done

`pnpm typecheck` · FE lint · `mms-completion-review.mdc`. Related: `mms-soft-delete`, `mms-module-page`, `mms-form-architecture`, `mms-data-sync`, `mms-background-jobs`.
