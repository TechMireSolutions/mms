---
name: mms-data-sync
description: Works with MMS localStorage layer (db.ts), useLiveCollection, TanStack Query cache sync, backend /api/db sync, tenant-scoped storage, and collection/object persistence. Use when reading or writing app data, fixing stale UI, or syncing frontend with PostgreSQL.
---

# MMS Data Sync Workflow

## Frontend (`apps/frontend/src/lib/db.ts`)

All sync HTTP calls go through **`apiClient`** (`credentials: 'include'`) internally.

```ts
import { getCollection, saveCollection } from './db';

// Collections — prefer empty default (no mock auto-seed)
const items = getCollection<MyType>('collection_key');
saveCollection('collection_key', updated);

// Reactive (localStorage modules)
import { useLiveCollection } from '../hooks/useLiveCollection';
const items = useLiveCollection<MyType>('collection_key');

// REST modules (students, contacts, teachers)
import {
  useStudentsPaginated,
  useStudentMutations,
  useStudentsByIds,
  useStudentsMetrics,
} from '@/hooks/useStudents';
import {
  useContactsPaginated,
  useContactMutations,
  useContactsByIds,
  useContactsMetrics,
} from '@/hooks/useContacts';
import {
  useTeachersPaginated,
  useTeacherMutations,
  useTeachersByIds,
} from '@/hooks/useTeachers';
```

`local-database-update` event — dispatched by saves; `useLiveCollection` subscribes. Do not duplicate listeners.

## When to use which layer

| Pattern | Use when |
|---------|----------|
| `useLiveCollection` + `saveCollection` | Legacy module CRUD via `/api/db/collections/*` |
| TanStack Query + `apiJson` | Dedicated REST (`/api/students`, `/api/contacts`, `/api/teachers`, workspace) |
| Paginated Work + resolve | `useStudentsPaginated`, `useContactsPaginated`, `useXxxByIds` — no full-list fetch |
| Metrics / aggregates | KPI, dashboard, reports — `useStudentsMetrics`, `useContactsReportAnalytics`, widget-aggregates |

**Writes on REST modules:** use `useXxxMutations()` only — mutations invalidate Query; do not also `saveCollection` in the page for the same entity. UI saved/success state must wait for `mutateAsync` or an explicit mutation success callback; fire-and-forget `mutate()` must not immediately show "saved". Backend bulk PUT must upsert (never wipe missing rows via `replaceForWorkspace` on normal save paths — `mms-api-interface.md`).

## Backend document store

| Table | Content |
|-------|---------|
| `collections` | JSON arrays per tenant key `t:{subdomain}:{name}` |
| `objects` | JSON singletons per tenant key `t:{subdomain}:{key}` |

## API (auth required — `authenticateTenant`)

| Method | Path | RBAC |
|--------|------|------|
| GET | `/api/db/sync` | **Admin only** |
| POST | `/api/db/sync` | **Admin only** |
| GET/POST | `/api/db/collections/:name` | POST → `canWriteCollection` |
| GET/POST | `/api/db/objects/:key` | POST → `canWriteObject`; server-only keys blocked; obsolete keys must leave `ALLOWED_OBJECTS` after typed-table migrations |
| POST | `/api/db/reset` | Admin — tenant-scoped minimal reseed |

REST resources (pilots): `GET/POST/PUT/DELETE /api/students`, `/api/contacts`.

**Do not** store long-lived OAuth secrets in `objects` — use FORCE-RLS tenant tables (`mms-data-layer.md`). Admin backup snapshots must not include credential tables.

## Add new collection (legacy path)

1. Add empty default in frontend — **no** large `*Data.ts` seed push
2. Type in `@mms/shared` if shared shape
3. `useLiveCollection('key')` in UI
4. Optional seed row in `minimalSeeds.ts` for default settings only

## Add new collection (modern path)

1. Backend REST route + Zod (`mms-backend-api` skill)
2. Query hooks (`useQuery` + `useMutation`, export `QUERY_KEY`, pass `signal`)
3. Soft-delete: default exclude deleted; trash uses `includeDeleted`
4. **Banned for new modules:** hybrid Query→localStorage mirroring / new `useLiveCollection`
5. Stop using `/api/db/collections/:name` for that entity

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

`mms-backend-api`, `mms-frontend`, `mms-form-architecture`, `mms-messaging`

## Done

`mms-completion-review.md` — typecheck + scoped lint/tests.
