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

// REST module (students)
import { useStudents, useStudentMutations } from '@/hooks/useStudents';
```

`local-database-update` event — dispatched by saves; do not duplicate.

## When to use which layer

| Pattern | Use when |
|---------|----------|
| `useLiveCollection` + `saveCollection` | Legacy module CRUD via `/api/db/collections/*` |
| TanStack Query + `apiJson` | Dedicated REST (`/api/students`, workspace) |
| Hybrid cache | Query fetch may `saveCollection` for legacy KPI readers (students) |

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
| GET/POST | `/api/db/objects/:key` | POST → `canWriteObject`; server-only keys blocked |
| POST | `/api/db/reset` | Admin — tenant-scoped minimal reseed |

REST resources: `GET/POST/PUT/DELETE /api/students` (pilot).

## Add new collection (legacy path)

1. Add empty default in frontend — **no** large `*Data.ts` seed push
2. Type in `@mms/shared` if shared shape
3. `useLiveCollection('key')` in UI
4. Optional seed row in `minimalSeeds.ts` for default settings only

## Add new collection (modern path)

1. Backend REST route + Zod (`mms-backend-api` skill)
2. Query hooks on frontend
3. Stop using `/api/db/collections/:name` for that entity

## Concurrency

Full-array read-modify-write — merge concurrent edits to same collection.

## Student hydration

`db.ts` hydrates students from linked contacts — preserve when editing links.

## Branding / global settings

| Do | Don't |
|----|-------|
| `getBrandingSettings()` / `await saveBrandingSettings()` | `saveObject('branding', raw)` in settings panels |
| Merge via `@mms/shared` helpers | Show "Saved" before server responds |

## Sync pitfalls

| Pitfall | Fix |
|---------|-----|
| Non-admin `syncDatabase()` fails 403 | Expected — only admins bulk-download; use collection GET or REST |
| Apex host API calls | Tenant routes need subdomain host (Vite forwards `x-forwarded-host`) |
| Stale UI after REST write | `invalidateQueries` on mutation |

## Rules

`mms-data-layer.mdc`, `mms-query.mdc`, `mms-backend.mdc`, `mms-tenant.mdc`
