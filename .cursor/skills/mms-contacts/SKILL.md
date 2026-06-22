---
name: mms-contacts
description: Implements Contact module — globle.md reference implementation. Forms, Kanban, cards, dedup/merge, soft delete, field RBAC, sync outbox, ContactConfigContext, /api/contacts REST. Use when editing contacts, CRM, duplicates, exports, or contact Setup.
---

# MMS Contacts Workflow

Contacts is the **reference module** for [`globle.md`](../../globle.md) / `mms-module-architecture.mdc`. Copy patterns to new modules before inventing structure.

## Module contract

`packages/shared/src/contactsModuleContract.ts` → `CONTACTS_MODULE_CONTRACT`

Import tier ids, REST path, bulk actions, soft-delete policy, searchable keys, export thresholds, and setup sub-tabs from the contract in hooks and pages.

## Key files

| Area | Path |
|------|------|
| Page | `apps/frontend/src/pages/Contacts.tsx` (thin orchestrator) |
| State / actions | `hooks/useContactsPageState.ts`, `hooks/useContactsPageActions.ts` |
| Query / mutations | `hooks/useContacts.ts` |
| Sync outbox | `hooks/useContactsSyncOutbox.ts`, `lib/contacts/contactsSyncOutbox.ts` |
| Field RBAC | `hooks/useVisibleContactFields.ts` |
| Command centre | `components/contacts/ContactsCommandMetrics.tsx` |
| Offline banner | `components/contacts/ContactsDataBanner.tsx` |
| Work | `ContactsTable`, `ContactKanban`, `ContactCards` |
| Detail | `ContactDetailDrawer.tsx` |
| Dedup | `DuplicateDetection.tsx` |
| Export | `lib/contacts/exportContactsCsv.ts` (inline + chunked) |
| Saved reports | `components/contacts/ContactsSavedReports.tsx` |
| Search / drill-down | `contactsSearchUtils.ts`, `lib/contacts/contactsWorkDrillDown.ts` |
| Report fields | `contactsReportFields.ts` (CustomReportBuilder) |
| Field dependencies | `contactFieldDependencies.ts` |
| Shared RBAC / soft delete | `contactFieldAccess.ts`, `contactColumnAccess.ts`, `contactSoftDelete.ts`, `contactDuplicateUtils.ts` |
| Merge | `mergeContacts()` in `utils.ts` |
| Config | `lib/contexts/ContactConfigContext.tsx`, `lib/contactConfig/*` |
| Field store | `lib/contactFieldsStore.ts` (no persisted `uiStrings`) |
| Column prefs | `lib/contacts/columnPrefsStorage.ts` + REST column-prefs |
| Setup | `ContactsSettingsPanel.tsx`, `ContactSyncPanel.tsx` |
| Backend | `routes/contacts.ts`, `services/contactService.ts`, `contactPrefsService.ts` |
| WhatsApp | `services/whatsApp*.ts` |

## Backend API (`/api/contacts`)

All routes require `authenticateTenant`. Mutations use permission-matrix helpers.

| Route | Notes |
|-------|-------|
| `GET /` | List; `?includeDeleted=true` requires `contacts.delete` |
| `POST /`, `PUT /:id` | E.164, title-case, audit, WhatsApp enqueue |
| `DELETE /:id` | **Soft delete** + audit |
| `POST /bulk-delete`, `POST /bulk-restore` | Bulk soft delete/restore |
| `POST /export-audit`, `POST /merge-audit`, `POST /setup-audit` | Client-triggered audit |
| `GET/PUT /column-prefs` | Per-user Work column layout |
| `GET/POST/DELETE /saved-reports`, `POST /saved-reports/:id/run` | Saved report logic |
| `GET /:id/whatsapp-status` | Server-side probe only |

Tests: `headers: { host: 'demo.localhost' }`. E2E: `e2e/contacts.api.spec.ts`, `e2e/contacts.ui.spec.ts`.

## Data layer

| Read | Write |
|------|-------|
| `useContactsCollection()` / `useContacts()` | `useContactMutations()` |

- Do not add parallel `saveCollection` writes in page handlers — **no `contactsData.ts` mock**
- Offline: mutations enqueue to `contactsSyncOutbox`; flush via `useContactsSyncOutbox`
- Dashboard widgets: Query cache preferred (`widgetDataUtils`)

## RBAC layers

1. Module: `can('contacts.read' \| 'contacts.write' \| 'contacts.delete')`
2. Tabs: `canViewContactTab`
3. Fields: `canViewContactField` / `canEditContactField`
4. Columns: `canViewContactColumn`
5. API: `canWriteContacts` / `canDeleteContacts` / `canReadContacts`

## globle.md feature map (Contacts)

| § | Feature | Status |
|---|---------|--------|
| 1.1 | Module contract | Shipped |
| 1.2 | RBAC (module/field/column) | Shipped |
| 1.3 | Audit on REST + export/merge/setup | Partial (Setup prefs save audited via route) |
| 1.4 | Offline banner + sync outbox | Partial (no conflict merge UI) |
| 1.5 | Soft delete + restore | Shipped |
| 2.1 | Command metrics | Shipped |
| 2.2 | Dedup + user-confirmed merge | Shipped |
| 2.3 | Export controller | Shipped (chunked > 500 rows) |
| 3.3 | Mobile cards | Shipped |
| 3.4 | Server column prefs | Shipped |
| 4.3 | Report drill-down | Shipped |
| 4.4 | Saved reports re-run | Shipped |
| 6.6 | Field delete dependency checks | Shipped |
| 8 | Background export | Partial (chunked, not job queue) |
| 7 / Sync | Google OAuth | Gap — localStorage credentials |

## Dedup & merge (§2.2)

1. `findContactDuplicatePairs(contacts, prefs)` — shared engine
2. UI: `DuplicateDetection.tsx` — user picks keeper, confirms merge
3. `mergeContacts(keep, other, { mergedNotePrefix: t(...) })` — **never pass `uiStrings`**
4. Optional duplicate warning on save in `ContactForm`

## Setup field removal (§6.6)

Before deleting a custom field in `ContactsSettingsPanel`:

```typescript
getContactFieldRemovalIssues({ fieldKey, columnRegistry, prefs, contacts })
```

Blocks when: seed field, enabled column, duplicate-detection field, or contact data exists.

## i18n

- All contact UI: `t('contacts.*')` via `appTranslations`
- **Do not** add or persist `uiStrings`
- Report builder contacts fields: `contactsReportFields.ts` label keys

## Provider rule

`ContactConfigProvider` mounts **only** in `App.tsx`.

## Do not reintroduce

`contactsData.ts`, `DynamicField.tsx`, nested provider, hard DELETE, `mergeContacts(..., uiStrings)`, Setup uiStrings editor, fake WhatsApp bulk send delay

## Rules

`mms-contacts.mdc`, `mms-module-architecture.mdc`, `mms-contact-link.mdc`, `mms-backend.mdc`, `mms-rbac.mdc`

## Related skills

`mms-module-page`, `mms-backend-api`, `mms-data-sync`, `mms-fields-registry`, `mms-reports-export`
