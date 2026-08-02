---
name: mms-data-sync
description: Legacy/hybrid localStorage and /api/db document-store sync (db.ts, useLiveCollection, objects/collections). Use when fixing legacy persistence or /api/db — not for new REST Query hooks (use mms-query-factories) or backup wipe-restore UI (use mms-backup-restore).
---

# MMS Data Sync Workflow

**Legacy / hybrid only.** New REST entity work → skill **`mms-query-factories`** (+ `mms-data-layer.md`). Backup wipe-restore UI → **`mms-backup-restore`**. Do not expand `useLiveCollection` for REST-migrated entities.

## Frontend (`apps/frontend/src/lib/db.ts`)

All sync HTTP calls go through **`apiClient`** (`credentials: 'include'`) internally.

```ts
import { getCollection, saveCollection, saveCollectionAsync } from './db';

// Lookup / legacy collections — prefer empty default (no mock auto-seed)
const items = getCollection<MyType>('collection_key');
await saveCollectionAsync('collection_key', updated); // Setup option lists — await server

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
| Column preferences | `useModuleColumnLayout` / Contacts column prefs — localStorage + `PUT …/column-preferences`; merge with `mergeModuleColumnPreferences` (local width wins) |
| Lookup option lists | `saveCollectionAsync` for genders/labels/`countryCodes` — await before claiming Setup saved |

**Writes on REST modules:** use `useXxxMutations()` only — mutations invalidate Query; do not also `saveCollection` for the same entity. Contacts mutations also invalidate `MESSAGING_CONTACTS_RESOLVE_QUERY_KEY`. UI saved/success state must wait for `mutateAsync` or an explicit mutation success callback; fire-and-forget `mutate()` must not immediately show "saved". Backend bulk PUT must upsert (never wipe missing rows via `replaceForWorkspace` on normal save paths — `mms-api-interface.md`).

## Backend document store

| Table | Content |
|-------|---------|
| `collections` | JSON arrays per tenant — **lookup lists** (not Contacts entity rows) |
| `objects` | JSON singletons per tenant key `t:{subdomain}:{key}` |

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

**Do not** store long-lived OAuth secrets in `objects` — use FORCE-RLS tenant tables (`mms-data-layer.md`). Admin backup snapshots must not include credential tables (`relationalReplaceMapping`); strip `SERVER_ONLY_OBJECT_KEYS` on restore. Envelope helpers SSOT in `@mms/shared` (`buildWorkspaceBackupEnvelope`, `remapBackupKeysToPrefix`, `validateWorkspaceBackupJson`). After server restore: clear local collection cache by prefix — do not dump full relational snapshot into localStorage.

## Add new collection (legacy path)

1. Add empty default in frontend — **no** large `*Data.ts` seed push
2. Type in `@mms/shared` if shared shape
3. `useLiveCollection('key')` in UI
4. Optional seed row in `minimalSeeds.ts` for default settings only

## Add new collection (modern path)

1. Backend REST route + Zod (`mms-backend-api` skill)
2. Query factories / hooks → skill **`mms-query-factories`** (`queryOptions`, tuple keys, `signal`, optimistic bans)
3. Soft-delete: default exclude deleted; trash uses `includeDeleted`
4. **Banned for new modules:** hybrid Query→localStorage mirroring / new `useLiveCollection`
5. Stop using `/api/db/collections/:name` for that entity

Backup/wipe-restore UI + validate-before-wipe → skill **`mms-backup-restore`** (not this skill’s primary path).

## Concurrency

Full-array read-modify-write — merge concurrent edits to same collection.

## Student / contact hydration

`db.ts` hydrates students from linked contacts on read — preserve when editing links. Contact REST persists via repositories on backend.

## Value formatting intercepts
- **Title Case**: `applyTitleCaseRecursive` on save paths (FE sync + BE repos).
- **E.164**: `parsePhoneNumber` on phone save boundaries.

## Branding / global settings

| Do | Don't |
|----|-------|
| `await saveBrandingSettings()` / `saveGlobalSettings()` | local-only save with false "saved" UI |
| Server merge via `@mms/shared` helpers | Skip PostgreSQL sync logic on login sync |

## Rules

`mms-data-layer.md`, `mms-api-interface.md`

## Related skills

`mms-query-factories`, `mms-backup-restore`, `mms-schema-migrate`, `mms-backend-api`, `mms-frontend`, `mms-form-architecture`

## Done

`mms-completion-review.md` — typecheck + scoped lint/tests.
