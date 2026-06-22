---
name: mms-module-work
description: Implements or reviews MMS module command centres and Work tabs from globle1.md sections 2-3: metrics, create/export actions, search/filter/sort directories, detail drawers, mobile views, column prefs, templates, and bulk actions.
---

# MMS Module Work Workflow

Source: `globle1.md` sections 2-3. Rules: `mms-module-work.mdc`, `mms-module-architecture.mdc`, `mms-module-isolation.mdc`, `mms-rbac.mdc`, `mms-query.mdc`.

Use this skill when changing a module command centre, Work tab, directory, row actions, bulk actions, filters, detail drawer, mobile cards, or column preferences.

## Reference Files

- Contacts reference page: `apps/frontend/src/pages/Contacts.tsx`
- Contacts state/actions: `useContactsPageState.ts`, `useContactsPageActions.ts`
- Contacts directory: `ContactsToolbar`, `ContactsTable`, `ContactCards`, `ContactKanban`
- Contacts REST hooks: `useContacts.ts`
- Shared contract pattern: `packages/shared/src/contactsModuleContract.ts`

## Workflow

1. Read the module contract first. If it does not exist, create/update `{module}ModuleContract.ts` before wiring UI constants.
2. Keep `PageHeader` as the always-visible command centre. Put module metrics, add, export, and integrity tools there.
3. Keep Work module-scoped: directory, CRUD, detail drawer, filters, sorting, view switch, selection, and bulk actions only.
4. Use Query hooks when REST exists; use `useLiveCollection` only for legacy collection modules.
5. Enforce permissions in both UI and backend. UI hiding is not security.
6. Persist column/field preferences per user and module when permitted.
7. Add or preserve mobile card layouts for dense directories.
8. Report validation, permission, sync, and partial-bulk failures clearly through `notify` and inline states.

## Work Checklist

```
- [ ] PageHeader command centre stays visible on all tiers
- [ ] Metrics are permission-scoped
- [ ] Create action uses approved fields/defaults
- [ ] Export respects filters, RBAC, field visibility, and soft-delete policy
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

Related skills: `mms-module-page`, `mms-contacts`, `mms-data-sync`, `mms-background-jobs`.
