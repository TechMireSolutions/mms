---
trigger: model_decision
---

# MMS Contacts Module

**Authoritative rules:** this file for CRM UI/API. **Universal module shell:** `mms-module-architecture.md` (source: `globle1.md`). **Person identity policy:** `mms-contact-link.md`.

## Module contract

Single source of truth: `packages/shared/src/contactsModuleContract.ts` → `CONTACTS_MODULE_CONTRACT`.

Hooks and page logic must import tier ids, REST path, bulk actions, soft-delete policy, and searchable keys from the contract — do not duplicate literals in components.

## File map

| Area | Path |
|------|------|
| Page (thin) | `pages/Contacts.tsx` |
| Page state/actions | `hooks/useContactsPageState.ts`, `hooks/useContactsPageActions.ts` |
| Query hooks | `hooks/useContacts.ts` |
| Sync outbox | `hooks/useContactsSyncOutbox.ts`, `lib/contacts/contactsSyncOutbox.ts` |
| Field RBAC hooks | `hooks/useVisibleContactFields.ts` |
| i18n | `t('contacts.*')` — no `uiStrings` |
| Saved reports | `components/contacts/ContactsSavedReports.tsx` |
| Command metrics | `components/contacts/ContactsCommandMetrics.tsx` |
| Offline banner | `components/contacts/ContactsDataBanner.tsx` |
| Sync conflict panel | `components/contacts/ContactsSyncConflictPanel.tsx` |
| Work views | `ContactsTable`, `ContactCards` (mobile) |
| Detail | `ContactDetailDrawer.tsx` |
| Dedup | `DuplicateDetection.tsx` + `@mms/shared/contactDuplicateUtils.ts` |
| Export | `lib/contacts/exportContactsCsv.ts` + server `POST /export/csv` job |
| Background jobs UI | Global `BackgroundJobsTray` (`TopBarActions`) — not a module-local banner |
| Report fields | `packages/shared/src/contactsReportFields.ts` |
| Field dependencies | `packages/shared/src/contactFieldDependencies.ts` |
| Search/drill-down | `contactsSearchUtils.ts`, `contactsWorkDrillDown.ts` |
| Config | `lib/contexts/ContactConfigContext.tsx` + `lib/contactConfig/*` |
| Field store | `lib/contactFieldsStore.ts` (does **not** persist `uiStrings`) |
| Column prefs | `lib/contacts/columnPrefsStorage.ts` (local cache) + `GET/PUT /api/contacts/column-prefs` |
| Prefs object | `contact_prefs` via `prefsStorage.ts` (`savePrefs` / `loadPrefs`) |
| Shared RBAC | `contactFieldAccess.ts`, `contactColumnAccess.ts`, `contactSoftDelete.ts` |
| Backend REST | `routes/contacts.ts`, `services/contactService.ts`, `contactPrefsService.ts` |
| Validation | `validation/contactSchemas.ts` |
| WhatsApp | `services/whatsApp*.ts` |

## Data layer

Server-first via TanStack Query (`mms-query.md`):

- **Read:** `useContactsCollection()` / `useContacts()` — active contacts only in Work (soft-delete excluded)
- **Write:** `useContactMutations()` — CRUD, restore, export/merge/setup audit, saved reports; offline enqueue via `contactsSyncOutbox`
- Do not parallel `saveCollection` in page handlers — **no `contactsData.ts` mock seed**
- `fetchContacts` syncs **active contacts only** to localStorage (never writes deleted rows to cache)

## Soft delete (§1.5)

- REST `DELETE` sets `deletedAt` / `deletedBy` / optional `deletionReason` — not hard remove
- `POST /bulk-delete` for bulk soft delete with partial-failure counts
- `POST /:id/restore` and `POST /bulk-restore` for admin restore (requires `contacts.delete`)
- Work archive toggle (`Show deleted`) — gated on `can('contacts.delete')`; `GET ?includeDeleted=true` requires same on API
- Contract: `softDelete.workExcludesDeleted`, duplicates/search/export policies
- Upsert of a deleted id clears soft-delete flags and audits `contact.restore`

## RBAC (§1.2)

| Layer | Implementation |
|-------|----------------|
| Module | `can('contacts.read' \| 'contacts.write' \| 'contacts.delete')` |
| API | `canWriteContacts` / `canDeleteContacts` / `canReadContacts` in `rbacService` — aligned with FE matrix |
| Tabs | `canViewContactTab` — form + detail + context `enabledTabIds` |
| Fields | `canViewContactField` / `canEditContactField` — form tabs, drawer |
| Columns | `canViewContactColumn` — table + mobile cards |

## Work tier

| View | Component | Breakpoint |
|------|-----------|------------|
| Desktop List | `ContactsTable` + column RBAC | `lg:block` (screens >= 1024px) |
| Mobile/Tablet cards | `ContactCards` + dynamic column metadata | `lg:hidden` (screens < 1024px) |

### ContactCards Design Rules:
- **Responsive Layout**: Consolidates both mobile and tablet views below `lg` to avoid duplicate code. Renders as a cards grid.
- **Aesthetics**: Glassmorphism (`bg-gradient-to-br from-card/95 via-card/80 to-background/60 backdrop-blur-xl`), custom translucent borders (`border-border/30`), and soft hover lifts. Selected card has glowing primary borders (`border-primary/45 bg-primary/[0.02]`).
- **Select All / Totals Bar**: Renders a card-based select-all control bar at the top of the cards when selectable.
- **Stage Badge**: Top-right positioning with glassmorphic look and a small color-pulsating lifecycle status dot.
- **Header**: Groups select checkbox, avatar, and contact name/details cleanly.
- **Pill Badges**: Phone and email pills are interactive copyable components (only shown if configured in user visible columns). Clicking copies the value to the clipboard, changes the copy icon to a green checkmark with a pop animation, and triggers a toast.
- **Dynamic Metadata Grid**: Configured columns (excluding name, stage, phone, email) are rendered dynamically inside each card using tailored badges (e.g. MapPin for location, Mars/Venus/User for gender, Stars for rating, custom wrappers for other fields).
- **Archived Banner**: If viewing soft-deleted contacts, a dedicated warning-colored alert box shows the deletion date and optional deletion reason at the bottom of the card.
- **Action Bar**: Animated quick actions at the bottom with Call, WhatsApp (emerald/green themed), SMS (violet themed), and Profile view buttons with spring micro-animations.

Lazy-load: `DuplicateDetection`, `WhatsAppPanel`, `ContactSyncPanel`, `ContactDetailDrawer`.

## Dedup & merge (§2.2)

- `findContactDuplicatePairs` in `@mms/shared`
- User-confirmed merge only — `DuplicateDetection.tsx`
- `mergeContacts(keep, other, { mergedNotePrefix })` — **no `uiStrings` argument**
- Duplicate warning on save when prefs enabled (`ContactForm`)

## Backend API (`/api/contacts`)

All routes require `authenticateTenant`. Mutations use permission-matrix helpers (`canWriteContacts`, `canDeleteContacts`, `canReadContacts`).

| Route | Notes |
|-------|-------|
| `GET /` | List; `?includeDeleted=true` requires `contacts.delete` |
| `GET /count` | Active count |
| `POST /` | E.164, title-case, audit, WhatsApp enqueue; upsert restores deleted ids |
| `PUT /:id` | Update + audit (`contacts.write` or own linked contact) |
| `DELETE /:id` | **Soft delete** + audit (`contacts.delete`) |
| `POST /bulk-delete` | Bulk soft delete (`contacts.delete`) |
| `POST /:id/restore` | Restore single deleted contact |
| `POST /bulk-restore` | Bulk restore |
| `POST /export-audit` | Client export audit (`contacts.read`) |
| `POST /merge-audit` | Client merge audit after dedup merge (`contacts.write`) |
| `POST /setup-audit` | Setup fields/prefs changes (`contacts.write`) |
| `GET/PUT /column-prefs` | Per-user Work column layout |
| `GET/POST/DELETE /saved-reports` | Saved report logic presets |
| `POST /saved-reports/:id/run` | Re-run preset; updates `lastRunAt` |
| `GET /:id/whatsapp-status` | Server-side WhatsApp probe |

Tests: tenant host `headers: { host: 'demo.localhost' }`.

## Offline sync (§1.4 / globle2 §9)

- `ContactsDataBanner` — stacked offline / pending / conflict / fetch-error banners
- `ContactsSyncConflictPanel` — per-field merge review (`contactSyncDiff`, `mergeContactForSync`)
- `contactsSyncOutbox.ts` + `useContactsSyncOutbox` — queue mutations when offline; auto-flush on reconnect
- Command-centre **Sync conflicts** metric opens review panel

## Google sync (Setup — globle2 §5 / §12)

- Server-stored OAuth config (`GET/PUT/DELETE /api/contacts/google-sync`) — tokens never returned to client
- `POST /google-sync/exchange` — authorization code exchange server-side
- `POST /google-sync/run` — People API fetch + refresh-on-401 + dedupe before import
- `ContactSyncPanel` — OAuth auto-capture via redirect/popup; Apple vCard import unchanged

## Setup field removal (§6.6)

- `getContactFieldRemovalIssues()` in `@mms/shared` — guards `ContactsSettingsPanel.handleDeleteField`
- Checks: seed fields, enabled columns, duplicate-detection prefs, contact data on custom fields

## Export & background jobs (§2.3 / globle2 §8)

- Server `POST /export/csv` + duplicate scan → global `BackgroundJobsTray`
- `exportInlineMaxRows` / `exportChunkSize` on contract; client `downloadContactsCsvChunked()` fallback for selection/archive

## Copy / i18n

- **Work/Reports/Setup UI:** `t('contacts.*')` via `appTranslations` — no `uiStrings`
- Setup save strips legacy `uiStrings` from persisted config (`contactFieldsStore`)
- New copy → `appTranslations` en/ar/ur (`mms-i18n.md`)

## Phones & WhatsApp

- E.164 on save (`parsePhoneNumber`)
- No manual WhatsApp toggles in `PhoneTab`
- UI reads `GET /api/contacts/:id/whatsapp-status`

## Forms

`ContactForm` — `FormModal` + registry tabs filtered by `canViewContactTab`; `useReadOnlyContactFieldKeys` per tab. Tab bodies: `FormPrimitives` + `useVisibleContactFields`.

## Provider rule

`ContactConfigProvider` mounts **only** in `App.tsx`.

## Do not reintroduce

- `DynamicField.tsx`, `TabCustomFields.tsx`, nested `ContactConfigProvider`
- Hard DELETE as default contact removal
- `mergeContacts(..., uiStrings)` signature
- `updateUiStrings` / Setup `uiStrings` editor tab
- `ContactsBackgroundJobsBanner` / `useContactsBackgroundJobs` (superseded by global `BackgroundJobsTray`)
- Second `DraggableFieldList` under `contacts/settings/`
