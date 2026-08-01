---
name: mms-module-work
description: Implements or reviews MMS module command centres and Work tabs — metrics, directories, drawers, bulk actions, soft-delete trash, column prefs. Use when changing PageHeader command centre, Work directory, trash/restore, bulk actions, detail drawers, filters, or mobile cards.
---

# MMS Module Work Workflow

Source: `mms-module-architecture.md` §2–§3 and §6–§7. Rules: `mms-module-architecture.md`, `mms-auth-security.md`, `mms-data-layer.md`.

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
5. **View mode SSOT**: resolve one `viewMode` (`table` | `cards`) — default cards below `md`, table at `md+`; user toggle overrides. Do not dual-render with CSS breakpoints + separate override state. Setup `defaultViewLayout` must not drive Work directory render.
6. REST modules: Query hooks + server pagination/`/metrics` — no full-collection client reduce; no new `useLiveCollection`.
7. `useModulePermissions(manifest)` / `can()` — omit forbidden CTAs (UI hide ≠ security; BE `rbacService` still required).
8. Soft-delete: default exclude deleted; trash = `includeDeleted` + restore/bulk restore; hide Add/messaging in trash.
9. §7: `ErrorState`+retry on list `isError`; Cmd/Ctrl+N when `canWrite` && !trash; await `mutateAsync` before close.
10. Column prefs per user/module; mobile cards for dense directories; failures via `notify`.

## Checklist

```
- [ ] PageHeader visible on all tiers; metrics permission-scoped
- [ ] Create omitted when !canWrite; Cmd/Ctrl+N when allowed
- [ ] Server pagination / metrics — no unbounded client lists
- [ ] Soft-delete trash + restore (or documented variant)
- [ ] ErrorState + retry on list isError (not empty success)
- [ ] mutateAsync awaited before form close
- [ ] Bulk actions: eligibility + partial failure reporting
- [ ] Export respects filters, RBAC, soft-delete policy
- [ ] Filters menu SSOT — no duplicate preset pill bar; shared preset options when cross-layer
- [ ] Directory viewMode SSOT — cards default `< md`, table `md+`; toggle overrides without CSS dual-render
- [ ] Copy via t(); no raw fetch('/api/...')
- [ ] Dense lists: card rows `< md` and/or `overflow-x-auto` tables; touch targets ≥ 44px (`mms-ui-ux-design.md` §7)
```

## Do Not

- Put reports/KPIs charts in Work.
- Dual-write Query + `saveCollection` for the same entity.
- Show forbidden actions as disabled clutter.
- Treat `isError` as an empty directory.
- Reintroduce a Work preset chip bar that duplicates Filters menu options.
- Dual CSS breakpoint render + separate viewMode override for the same directory.

## Done

`pnpm typecheck` · FE lint · `mms-completion-review.md`. Related: `mms-module-page`, `mms-form-architecture`, `mms-data-sync`, `mms-background-jobs`.
