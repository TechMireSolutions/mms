---
name: mms-data-sync
description: Legacy/hybrid localStorage and /api/db document-store sync (db.ts, useLiveCollection, objects/collections). Use when fixing legacy persistence or /api/db — not for new REST Query hooks (use mms-query-factories) or backup wipe-restore UI (use mms-backup-restore).
---

# MMS Data Sync Workflow

**Legacy / hybrid only.** New REST entity work → skill **`mms-query-factories`** (+ `mms-data-layer.mdc`). Backup wipe-restore UI → **`mms-backup-restore`**. Maintain existing non-migrated keys only — **do not** add new entity collections / new `useLiveCollection` for REST-migrated modules.

## Frontend (`apps/frontend/src/lib/db.ts`)

All sync HTTP calls go through **`apiClient`** (`credentials: 'include'`) internally.

```ts
import { getCollection, saveCollection, saveCollectionAsync } from './db';

// Legacy / non-migrated collections only — prefer empty default (no mock auto-seed)
const items = getCollection<MyType>('collection_key');
await saveCollectionAsync('collection_key', updated); // await server before claiming saved

// Contacts Setup uses typed REST — not document-store objects/collections
// GET/PUT /api/contacts/lookups, /field-config, /preferences (Query via collections/contacts)

// Reactive (localStorage modules)
import { useLiveCollection } from '../hooks/useLiveCollection';
const items = useLiveCollection<MyType>('collection_key');

// REST modules — Query hooks from collection facades / feature hooks
import {
  useStudentsPaginated,
  useStudentMutations,
  useStudentsByIds,
  useStudentsMetrics,
} from '@/tenant/hooks/collections/students';
import {
  useContactsPaginated,
  useContactMutations,
  useContactsByIds,
  useContactsMetrics,
} from '@/tenant/hooks/collections/contacts';
import {
  useTeachersPaginated,
  useTeacherMutations,
  useTeachersByIds,
} from '@/tenant/hooks/collections/teachers';
```

`local-database-update` event — dispatched by saves; `useLiveCollection` subscribes. Do not duplicate listeners.

## When to use which layer

| Pattern | Use when |
|---------|----------|
| `useLiveCollection` + `saveCollection` | Legacy module CRUD via `/api/db/collections/*` |
| TanStack Query + `apiJson` | Dedicated REST (`/api/students`, `/api/contacts`, `/api/teachers`, workspace) |
| Paginated Work + resolve | `useStudentsPaginated`, `useContactsPaginated`, `useXxxByIds` — no full-list fetch |
| Metrics / aggregates | KPI, dashboard, reports — `use*Metrics` from `@/tenant/hooks/collections/*`, widget-aggregates; ban full-list reduce for KPI values already on `/metrics` |
| Column preferences | Contacts: localStorage + `PUT /api/contacts/column-preferences` (typed `contact_user_column_prefs`); merge with `mergeModuleColumnPreferences` (local width wins). Other modules may still use object maps. |
| Lookup option lists | Contacts: `/api/contacts/lookups` via Query/mutation (`useContactLookups*`) — not `saveCollectionAsync` |
| Contacts Setup field-config / preferences | `useContactFieldConfig*` / `useContactPreferences*` → `/api/contacts/field-config` and `/preferences` — not `saveObject` |

**Writes on REST modules:** use `useXxxMutations()` only — mutations invalidate Query; do not also `saveCollection` for the same entity. Contacts mutations also invalidate `MESSAGING_CONTACTS_RESOLVE_QUERY_KEY`. UI saved/success state must wait for `mutateAsync` or an explicit mutation success callback; fire-and-forget `mutate()` must not immediately show "saved". Backend bulk PUT must upsert (never wipe missing rows via `replaceForWorkspace` on normal save paths — `mms-api-interface.mdc`).

## Backend document store

| Table | Content |
|-------|---------|
| `collections` | JSON arrays per tenant — **non-Contacts lookup lists** (Contacts lookups are typed `contact_lookups`) |
| `objects` | JSON singletons per tenant key `t:{subdomain}:{key}` — **not** Contacts Setup field-config / preferences / column prefs |

## API (auth required — `authenticateTenant`)

| Method | Path | RBAC |
|--------|------|------|
| GET | `/api/db/backup` | **Admin** + `canBulkSync` — full-fidelity snapshot (document store + relational) via `fetchBackupSnapshot` in `runInReadSnapshotTransaction` (REPEATABLE READ) |
| GET | `/api/db/sync` | **Admin only** — lighter sync snapshot |
| POST | `/api/db/sync` | **Admin** + `canBulkSync` — wipe-restore via `synchronizeData(payload, signal)` under `withSyncTimeout`; abort → rollback + `408` / `backup.syncTimeout` |
| GET/POST | `/api/db/collections/:name` | POST → `canWriteCollection` |
| GET/POST | `/api/db/objects/:key` | POST → `canWriteObject`; server-only keys blocked; obsolete keys must leave `ALLOWED_OBJECTS` after typed-table migrations |
| POST | `/api/db/reset` | Admin — tenant-scoped minimal reseed |

**Shipped REST:** `GET/POST/PUT/DELETE /api/students`, `/api/contacts`, `/api/teachers`, … — Contacts entity is **not** in `ALLOWED_COLLECTIONS` / FE `BUSINESS_COLLECTIONS`.

**Do not** store long-lived OAuth secrets in `objects` — use FORCE-RLS tenant tables (`mms-data-layer.mdc`). Admin backup snapshots must not include credential tables (`relationalReplaceMapping`); strip `SERVER_ONLY_OBJECT_KEYS` on restore. Envelope helpers SSOT in `@mms/shared` (`buildWorkspaceBackupEnvelope`, `remapBackupKeysToPrefix`, `validateWorkspaceBackupJson`). After server restore: clear local collection cache by prefix — do not dump full relational snapshot into localStorage.

## Maintain legacy collections (non-migrated keys only)

**Do not** add new entity collections or new `useLiveCollection` for REST-migrated / new modules — `mms-data-layer.mdc`. For existing legacy keys still on `/api/db/collections/*`:

1. Keep empty defaults — **no** large `*Data.ts` seed push
2. Shared shape in `@mms/shared` when needed
3. Touch UI via existing `useLiveCollection('key')` only
4. Optional seed row in `minimalSeeds.ts` for default settings only

## New REST entity (modern path)

→ skill **`mms-query-factories`** (+ `mms-backend-api`). Ban hybrid Query→localStorage mirror / new `useLiveCollection`.

Backup/wipe-restore UI + validate-before-wipe → skill **`mms-backup-restore`** (not this skill’s primary path).

## Concurrency (legacy document-store only)

Full-array read-modify-write on `/api/db` collections — merge concurrent edits to the **same legacy collection**. This is **not** REST optimistic concurrency (`updated_at` → `409`) — that lives in `mms-api-interface.mdc` §6 / **`mms-backend-api`**.

## Student / contact hydration

`db.ts` hydrates students from linked contacts on read — preserve when editing links. Contact REST persists via repositories on backend.

## Value formatting intercepts
- **Title Case**: `applyTitleCaseRecursive` on Latin/display-name save paths (FE sync + BE repos). **Skip** ar/ur/fa / non-Latin scripts and free-form RTL prose — `mms-structure-naming.mdc`.
- **E.164**: `parsePhoneNumber` on phone save boundaries.

## Branding / global settings

| Do | Don't |
|----|-------|
| `await saveBrandingSettings()` / `saveGlobalSettings()` | local-only save with false "saved" UI |
| Server merge via `@mms/shared` helpers | Skip PostgreSQL sync logic on login sync |

## Rules

`mms-data-layer.mdc`, `mms-api-interface.mdc`

## Related skills

`mms-query-factories`, `mms-backup-restore`, `mms-schema-migrate`, `mms-backend-api`, `mms-frontend`, `mms-form-architecture`

## Done

`mms-completion-review.mdc` — typecheck + scoped lint/tests.
