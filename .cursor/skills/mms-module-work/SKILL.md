---
name: mms-module-work
description: Implements or reviews MMS module command centres and Work tabs — metrics, directories, drawers, bulk actions, soft-delete trash, column prefs. Use when changing PageHeader command centre, Work directory, trash/restore, bulk actions, detail drawers, filters, or mobile cards.
---

# MMS Module Work Workflow

**Rule (norms SSOT):** `mms-module-architecture.mdc` §2–§3, §6–§7. Also `mms-auth-security.mdc`, `mms-data-layer.mdc`.

## Reference

- Contacts: `apps/frontend/src/tenant/features/contacts/ContactsPage.tsx`
- Soft-delete Work pattern: Students, Teachers, Sessions, Attendance, Enrollments, Finance, Accounting, Obligations, Hasanat, Examinations, QB questions, Users
- Variants: Messaging (log clear soft-archive); QB tests/papers + assessment_results (upsert-only)
- Manifests: `packages/shared/src/*ModuleManifest.ts`
- Collections hooks: `apps/frontend/src/tenant/hooks/collections/*`

## Workflow

1. Read/update `{module}ModuleManifest.ts` before wiring UI constants.
2. `PageHeader` stays visible — metrics, add, export, integrity tools live there.
3. Work = directory/CRUD/drawer/filters/bulk only — no charts.
4. **Filters SSOT**: one Filters menu owns presets/dimensions; no always-visible chip bar that repeats the same options. Preset ids + `labelKey`s live in `@mms/shared` next to the list-query schema (Contacts: `CONTACTS_QUICK_FILTER_OPTIONS`). Active state = badge + Clear; `FilterChips` only for removable active multi-selects.
5. **View mode**: person-directory Work → `directoryViews: ['table','cards']` (never `list`); domain modules keep their own sub-modes (finance/attendance/…). Resolve one `viewMode`; defaults/cards paging — rule §3.
6. REST modules: Query hooks + server pagination/`/metrics` — no full-collection client reduce; no new `useLiveCollection`; ban `loadAllFn` / unpaged list GET. Prefer **keyset/cursor** for hot/large directories when touching list APIs — `mms-data-layer.mdc`.
7. `useModulePermissions(manifest)` / `can()` — omit forbidden CTAs (UI hide ≠ security; BE `rbacService` still required).
8. Soft-delete: default exclude deleted; trash = `includeDeleted` + restore/bulk restore; hide Add/messaging in trash; **drawer** `WarningCallout` archive chrome + Restore; hide Call/WA/SMS/Email when `deletedAt`.
9. §7: `ErrorState`+retry+hint on list `isError`; directory empties via `EmptyState` (`compact` when dense); Cmd/Ctrl+N when `canWrite` && !trash; await `mutateAsync` before close; bulk selection via floating/inline `BulkSelectionBar` + `BulkSelectionDeleteAction` / `BulkSelectionRestoreAction` (not toolbar-inline trash); column gates via `isColumnVisible` into table/cards.
10. **Column layout**: `useModuleColumnLayout` — merge/local-width rules in rule §3 (do not restate). Pass `isColumnVisible` through content — ban `visibleColumns` boolean object fans.
11. Dense Work tables: prefer `@tanstack/react-virtual` (or named shared wrapper) — ban one-off virtualization libs — `mms-ui-ux-design.mdc`.
12. Command/report KPI **StatCard strips** → `ModuleCommandMetricsGrid` when adding metrics — `mms-ui-ux-design.mdc`.
13. Contacts report KPIs: `activeCount` = soft-delete-filtered roster length (form never writes `isActive`).
14. Contacts mutations invalidate messaging resolve Query keys when person data changes.

## Checklist

```
- [ ] PageHeader visible on all tiers; metrics permission-scoped
- [ ] Create omitted when !canWrite; Cmd/Ctrl+N when allowed
- [ ] Server pagination / metrics — no unbounded client lists / no `loadAllFn`
- [ ] Hot/large directories: keyset preference when touching list APIs
- [ ] Person-directory: `directoryViews: ['table','cards']`; cards + table same page API
- [ ] Soft-delete trash + restore (+ drawer `WarningCallout` archive chrome) or documented variant
- [ ] Bulk selection bar uses shared `BulkSelectionBar` + `BulkSelectionActions` (`BulkSelectionDeleteAction` / Restore / Messaging) on list/parent (no forked floating/inline chrome; no toolbar-inline trash)
- [ ] Directory empties use `EmptyState` (`title` required; dashed when bordered; `compact` when dense)
- [ ] Column gates via `isColumnVisible` into leaves (no `visibleColumns`/`show*` boolean fans)
- [ ] ErrorState + retry + hint on list isError (not empty success)
- [ ] New KPI StatCard strips use `ModuleCommandMetricsGrid`
- [ ] mutateAsync awaited before form close
- [ ] Bulk actions: eligibility + partial failure reporting
- [ ] Export respects filters, RBAC, soft-delete policy
- [ ] Filters menu SSOT — no duplicate preset pill bar; shared preset options when cross-layer
- [ ] Directory viewMode SSOT — cards default `< md`, table `md+`; toggle overrides without CSS dual-render
- [ ] Column widths persist — local + `/column-preferences`; merge preserves device widths
- [ ] Copy via t(); no raw fetch('/api/...')
- [ ] Dense lists: `@tanstack/react-virtual` when virtualizing; card rows `< md` and/or `overflow-x-auto` tables; touch ≥ 44px (`mms-ui-ux-design.mdc` §7)
```

## Do Not

- Put reports/KPIs charts in Work.
- Dual-write Query + `saveCollection` for the same entity.
- Show forbidden actions as disabled clutter.
- Treat `isError` as an empty directory.
- Reintroduce a Work preset chip bar that duplicates Filters menu options.
- Dual CSS breakpoint render + separate viewMode override for the same directory.
- Overwrite local column widths with server prefs that omit `width`.

## Done

`pnpm typecheck` · FE lint · `mms-completion-review.mdc`. Related: `mms-module-page`, `mms-form-architecture`, `mms-data-sync`, `mms-background-jobs`.
