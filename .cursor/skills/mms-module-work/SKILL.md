---
name: mms-module-work
description: Implements or reviews MMS module command centres and Work tabs — metrics, directories, drawers, bulk actions, soft-delete trash, column prefs. Use when changing PageHeader command centre, Work directory, trash/restore, bulk actions, detail drawers, filters, or mobile cards.
---

# MMS Module Work Workflow

Source: `mms-module-architecture.mdc` §2–§3 and §6–§7. Rules: `mms-module-architecture.mdc`, `mms-auth-security.mdc`, `mms-data-layer.mdc`.

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
4. REST modules: Query hooks + server pagination/`/metrics` — no full-collection client reduce; no new `useLiveCollection`.
5. `useModulePermissions(manifest)` / `can()` — omit forbidden CTAs (UI hide ≠ security; BE `rbacService` still required).
6. Soft-delete: default exclude deleted; trash = `includeDeleted` + restore/bulk restore; hide Add/messaging in trash.
7. §7: `ErrorState`+retry on list `isError`; Cmd/Ctrl+N when `canWrite` && !trash; await `mutateAsync` before close.
8. Column prefs per user/module; mobile cards for dense directories; failures via `notify`.

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
- [ ] Copy via t(); no raw fetch('/api/...')
```

## Do Not

- Put reports/KPIs charts in Work.
- Dual-write Query + `saveCollection` for the same entity.
- Show forbidden actions as disabled clutter.
- Treat `isError` as an empty directory.

## Done

`pnpm typecheck` · FE lint · `mms-completion-review.mdc`. Related: `mms-module-page`, `mms-form-architecture`, `mms-data-sync`, `mms-background-jobs`.
