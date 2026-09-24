---
name: mms-data-sync
description: Governs legacy localStorage and /api/db document-store persistence (db.ts, useLiveCollection, objects/collections) for non-migrated entities. Use when modifying legacy storage keys, local drafts, or document sync endpoints. Do NOT use for server-authoritative REST entities (use mms-query-factories), full workspace encrypted backups (use mms-backup-restore), or database DDL migrations (use mms-schema-migrate).
license: Proprietary
metadata:
  owner: mms-platform
  last-verified: 2026-09-24
---

# MMS Data Sync Workflow

**Rules (norms SSOT):** `mms-data-layer.mdc` · `mms-core.mdc` · `mms-migration-status.mdc`. Modern REST queries → `mms-query-factories`. Full backups → `mms-backup-restore`.

Operational guide for maintaining non-migrated localStorage and `/api/db` document-store entities.

## 1. Scope & Layer Boundaries

- **Legacy Only**: Restricted to non-migrated document collections. Creating new collections or adding `useLiveCollection` for new or REST-migrated modules is strictly banned.
- **REST Entities**: Primary entities (Contacts, Students, Faculty, Accounting) use server REST via TanStack Query facades (`@/tenant/hooks/collections/*`). Never dual-write REST entities to `saveCollection`.
- **Async Saves**: UI must await `saveCollectionAsync` or `mutateAsync` before indicating saved state. Fire-and-forget saves are forbidden.

## 2. Document Store APIs (`/api/db`)

- **Endpoints & RBAC**:
  - `GET/POST /api/db/collections/:name`: `canReadCollection` / `canWriteCollection`.
  - `GET/POST /api/db/objects/:key`: `canReadObject` / `canWriteObject`. Server-only keys are blocked.
  - `GET /api/db/backup`: Admin + `canBulkSync` (REPEATABLE READ transaction).
  - `POST /api/db/sync`: Admin + `canBulkSync` (wipe-restore under `withSyncTimeout` → aborts with 408 on timeout).
- **Security Invariant**: Never store OAuth tokens or secrets in `objects`; store secrets in tenant FORCE-RLS tables (`mms-auth-security.mdc`).

## 3. Data Formatting & Save Intercepts

- **Title Case**: Apply `applyTitleCaseRecursive` on Latin display names; skip non-Latin RTL scripts (Arabic, Urdu, Persian).
- **Phone Numbers**: Normalize via `parsePhoneNumber` to E.164 on all save paths.
- **Linked Records**: `db.ts` hydrates students from linked contacts on read; Contact REST manages person profile persistence.
