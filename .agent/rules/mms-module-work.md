---
trigger: model_decision
---

# MMS Module Work Tier

Human-readable source: [`globle1.md`](../../globle1.md) sections 2-3. Overall shell: `mms-module-architecture.md`; tier isolation: `mms-module-isolation.md`.

Use this rule when changing a module command centre, Work tab, directory, drawer, filters, bulk actions, or per-user column preferences.

## Command Centre

Every standard module has an always-visible command centre above `work | reports | setup`.

| globle1 | Requirement | Pattern |
|---------|-------------|---------|
| 2.1 Metrics | Permission-scoped totals, shown count, pending/incomplete/duplicate warnings | `ContactsCommandMetrics` |
| 2.2 Integrity | Dedup/merge tools with explicit user confirmation | `DuplicateDetection`, module service helpers |
| 2.3 Export | Respect active filters, RBAC, field visibility, soft-delete policy | module export helper + audit |
| 2.4 Create | Primary add action generated from approved fields and defaults | `PageHeader.actions` + `FormModal` |

Do not hide the create/export/integrity actions inside a tier panel when they are module-level actions. Keep tier-specific controls inside their tier content.

## Work Directory

The Work tab is the operational directory for daily record handling. It owns CRUD, search, filtering, sorting, detail view, and bulk actions for the module's own records only.

Required directory capabilities:

- Search approved searchable fields only.
- Filter approved filterable fields, including custom fields only when allowed.
- Combine filters logically without leaking restricted fields or records.
- Support sort, view switching, status indicators, row actions, and bulk selection.
- Persist column/field visibility per user and module where permitted.
- Use mobile cards or touch-friendly layouts for narrow screens following premium visual standards (glassmorphism background blur, custom copyable badges/pills, spring micro-animations on interactive actions).

Reference implementation: Contacts uses `ContactsToolbar`, `ContactsTable`, `ContactCards`, and server column prefs.

## Detail Drawer

Selecting a record should open an in-place detail drawer rather than forcing navigation away from the directory.

The drawer must use the module tab/field registry and respect:

- tab visibility,
- field visibility,
- field order,
- field/column RBAC,
- custom tabs and fields,
- related-data rules.

High-impact edits should have explicit save/confirm feedback and audit where required. Avoid silent auto-save for sensitive fields.

## Bulk Actions

Bulk bars appear only after selection and only for actions permitted on the selected records.

Bulk operations must:

- verify action permission on the server,
- verify selected record eligibility,
- report partial failure counts and useful details,
- queue long-running work via background jobs,
- audit sensitive operations such as export, delete, restore, merge, and messaging.

## Templates

Reusable templates belong to the module and may be personal, role-scoped, user-shared, or global depending on permissions. Template use must still respect RBAC, field visibility, and module data policy.

## Do Not

- Put cross-module widgets, global dashboard cards, or unrelated reports in Work.
- Fetch full collections when a paged or aggregate API exists.
- Use raw `fetch('/api/...')`; use `apiClient`.
- Add a second data write path beside Query mutations.
- Show forbidden actions as disabled placeholders when they should be omitted.

Skill: `mms-module-work`.
