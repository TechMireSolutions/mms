---
name: mms-module-work
description: Implements or reviews MMS module command centres and Work tabs from mms-module-architecture.md: metrics, create/export actions, search/filter/sort directories, detail drawers, mobile views, column prefs, templates, and bulk actions.
---

# MMS Module Work Workflow

Source: `mms-module-architecture.md` §2-§3. Rules: `mms-module-architecture.md`, `mms-auth-security.md`, `mms-data-layer.md`.

Use this skill when changing a module command centre, Work tab, directory, row actions, bulk actions, filters, detail drawer, mobile cards, or column preferences.

## Reference Files

- Contacts reference page: `apps/frontend/src/tenant/features/contacts/ContactsPage.tsx`
- Students / Teachers soft-delete Work: `StudentsPage.tsx`, `TeachersPage.tsx` + list components
- Contacts REST hooks: `useContacts.ts`
- Shared contract pattern: `packages/shared/src/contactsModuleContract.ts` (also `studentsModuleContract`, `teachersModuleContract`)

## Workflow

1. Read the module contract first. If it does not exist, create/update `{module}ModuleContract.ts` before wiring UI constants.
2. Keep `PageHeader` as the always-visible command centre. Put module metrics, add, export, and integrity tools there.
3. Keep Work module-scoped: directory, CRUD, detail drawer, filters, sorting, view switch, selection, and bulk actions only.
4. Use Query hooks when REST exists; use `useLiveCollection` only for legacy collection modules.
5. Enforce permissions with `useModulePermissions(contract)` / `can()` in UI and `rbacService` on the backend. UI hiding is not security — omit forbidden actions.
6. Soft-delete entities: default list excludes deleted; trash toggle uses `includeDeleted` + filter `deletedAt`; restore/bulk restore; hide Add and messaging in trash mode.
7. Persist column/field preferences per user and module when permitted.
8. Add or preserve mobile card layouts for dense directories.
9. Report validation, permission, sync, and partial-bulk failures clearly through `notify` and inline states.

## Work Checklist

```
- [ ] PageHeader command centre stays visible on all tiers
- [ ] Metrics are permission-scoped
- [ ] Create action uses approved fields/defaults; omitted when !canWrite
- [ ] Export respects filters, RBAC, field visibility, and soft-delete policy
- [ ] Soft-delete trash toggle + restore when API supports it
- [ ] Dedup/merge requires explicit confirmation
- [ ] Search/filter/sort use approved keys
- [ ] Detail drawer uses registry tabs/fields and RBAC
- [ ] Bulk actions verify eligibility and report partial failures
- [ ] Mobile layout exists for dense directories
- [ ] Column prefs are per-user and per-module
- [ ] User-facing copy uses `t()`
```

## Do Not

- Put reports, global dashboard widgets, or foreign-module data in Work.
- Gate PageHeader create/export on `activeTab`.
- Use raw `fetch('/api/...')`.
- Write the same entity through both Query mutations and `saveCollection`.
- Show forbidden actions as disabled clutter when they should be omitted.

Related skills: `mms-module-page`, `mms-form-architecture`, `mms-data-sync`, `mms-background-jobs`.
