# Contact Module

Canonical architecture: **`globle1.md`** (§1–§4) + **`globle2.md`** (§5–§14 Setup & cross-cutting) · **`.cursor/rules/mms-contacts.mdc`**

Contacts is the **reference implementation** for Work / Reports / Setup tiers, command-centre metrics, soft delete, dedup/merge, field-tab-column RBAC, offline sync with conflict review, server Google sync, and server-first Query hooks.

## Entry points

| Area | Path |
|------|------|
| Page | `apps/frontend/src/pages/Contacts.tsx` |
| State / actions | `hooks/useContactsPageState.ts`, `hooks/useContactsPageActions.ts` |
| Query + mutations | `hooks/useContacts.ts` |
| Module contract | `packages/shared/src/contactsModuleContract.ts` |
| Types & registries | `packages/shared/src/contactTypes.ts` |
| Backend REST | `apps/backend/src/routes/contacts.ts`, `services/contactService.ts`, `services/contactPrefsService.ts`, `services/contactGoogleSyncService.ts` |
| Field config | `lib/contexts/ContactConfigContext.tsx`, `lib/contactConfig/*`, `lib/contactFieldsStore.ts` |

## Tiers

- **Work** — paginated list, Kanban, mobile cards, toolbar, archive/restore, bulk actions
- **Reports** — KPI + charts, drill-down to Work, `ContactsSavedReports` (logic presets re-run live)
- **Setup** — fields, preferences, sync (Google server-side + Apple vCard)

## globle2 alignment (Contacts)

| Section | Shipped |
|---------|---------|
| §5 Setup gate + audit | `ContactsSettingsPanel` + `POST /setup-audit`; sync sub-tab |
| §6 Fields/tabs | Registry + `getContactFieldRemovalIssues`; Work Kanban cannot edit stage **options** |
| §7 Prefs | `contact_prefs`, lifecycle colours, templates, defaults |
| §8 Background jobs | Server export + dedup scan → `BackgroundJobsTray` |
| §9 Error feedback | Toasts, conflict panel, bulk partial counts, `reportClientError` on audit failures |
| §10 Performance | Paginated Work list; server metrics/report-analytics/widget-aggregates; batch resolve; server duplicate-check on save |
| §12 Security | Field/column RBAC, server OAuth tokens, export audit |
| §13 Change mgmt | Setup audit + field dependency guards |

## Data & API

- **Read/write:** TanStack Query via `/api/contacts` — no mock seed; localStorage cache holds **active contacts only** (synced from Query)
- **Prefs:** tenant object `contact_prefs` + offline cache (`prefsStorage.ts`)
- **Column prefs:** `GET/PUT /api/contacts/column-prefs` per user
- **Saved reports:** `/api/contacts/saved-reports` CRUD + run
- **Soft delete:** `deletedAt` / `deletedBy` / optional `deletionReason`; restore via `POST /:id/restore` and `POST /bulk-restore`
- **Offline sync:** outbox + `ContactsSyncConflictPanel` per-field merge
- **Google sync:** `/google-sync`, `/google-sync/exchange`, `/google-sync/run` (tokens server-only)
- **Audit:** CRUD, export, merge, saved-report, setup, Google sync lifecycle
- **RBAC:** `contacts.read` / `contacts.write` / `contacts.delete` + field/tab/column helpers in `@mms/shared`

## Copy (i18n)

Use `t('contacts.*')` from `appTranslations`. Do **not** add or persist `uiStrings`.

## Removed (do not restore)

- `lib/data/contactsData.ts` (~9k mock rows) — use `useContactsCollection()` only
- `contactFields.ts`, `ContactStatsBar`, `DynamicField`, `TabCustomFields`, `useContactCopy.ts`, `contactTranslations.ts`
- Setup uiStrings tab / `DEFAULT_UI_STRINGS`
- Hard DELETE as default removal
- Nested `ContactConfigProvider`
- `ContactsBackgroundJobsBanner` / `useContactsBackgroundJobs`
- Direct browser calls to Google OAuth/People APIs (use backend routes)
- `saveCollection('contacts', …)` bypasses in feature code — use `useContactMutations()`
- Work-tier editing of lifecycle stage **option lists** (Setup only)

## Active form tabs

Includes `RelationshipsTab` (registry-driven; not legacy).

## Known platform gaps (not Contacts-specific debt)

- Formal field **archive** workflow vs hide/delete guard
- Workflow transition matrix for lifecycle stages (§7.3)
- Configurable notification rules (§7.4)
- Multi-instance background job queue (Redis/worker)
