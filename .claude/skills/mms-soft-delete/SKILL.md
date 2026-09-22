---
name: mms-soft-delete
description: Implements, verifies, or audits the MMS Soft-Delete System — column quintuple, 3-tier index strategy, partial unique indexes, BEFORE DELETE triggers, RLS policies, dynamic query ASTs, and trash UX. Use when adding or changing soft-delete, trash directories, restore handlers, DDL migrations, or auditing deletion lifecycles. Do NOT use for ephemeral scratchpad data (hard-delete directly per mms-data-layer.md) or immutable audit log events (use mms-audit-trail).
license: Proprietary
metadata:
  owner: mms-platform
  last-verified: 2026-09-15
---

# MMS Soft-Delete System Workflow

**Rules (norms SSOT):** `mms-data-layer.md` §6 · `mms-module-architecture.md` §6–§7 · `mms-core.md` · `mms-auth-security.md` · `mms-form-architecture.md` · `mms-performance.md`. DDL migrations → `mms-schema-migrate`. Backend API → `mms-backend-api`. Work UI → `mms-module-work`. Outbox/Audit → `mms-audit-trail`. Background Jobs → `mms-background-jobs`.

SSOT operational workflow for the soft-delete architecture across tenant workspaces and platform apex per `docs/soft-delete.md`.

---

## When to use

- Adding soft-delete, archive, or restore functionality to a new or existing module
- Writing Drizzle schemas or DDL migrations for soft-deletable tables (`softDeleteColumns` mixin, partial indexes, triggers, RLS)
- Implementing backend routes (`DELETE /:id`, `POST /:id/restore`, `POST /bulk-delete`, `POST /bulk-restore`, `GET /?includeDeleted=true`)
- Implementing frontend Work trash UX (`viewingDeleted`, `ModuleTrashToggle`, `ModuleWorkBulkActionBar`, optimistic undo toast)
- Handling unique constraints on recyclable fields (`email`, `phone`, `employee_id`, slug)
- Auditing code against soft-delete anti-patterns and performance invariants

---

## 1. Core Principles & 4-Bucket Model

MMS enforces **soft-delete** (marking rows archived in-place) over physical `DELETE` for all business entities to preserve audit continuity, historical ledgers, and enable self-service trash recovery.

| Bucket | Mechanism | Target Entities | Rationale |
|---|---|---|---|
| **1. Soft-Delete** | `UPDATE SET deleted_at = NOW()` | `contacts`, `students`, `faculty`, `invoices` | High referential weight; user self-service restoration. |
| **2. Ephemeral Hard-Delete** | Physical SQL `DELETE` | `question_bank_tests`, draft form steps, join edges | Scratchpad data without independent lifecycle. |
| **3. Sweeper TTL Purge** | Background worker (`lte(purge_after, NOW())`) | `message_logs`, temp upload artifacts, session tokens | Time-bounded operational data purged after retention window. |
| **4. Append-Only Immutable** | `DELETE`/`UPDATE` blocked at DB layer | `audit_trail_events`, `accounting_entries` | Regulatory source of truth; tamper-evident hash chains. |

---

## 2. Database Schema Standard

### 2.1 Column Quintuple
Every soft-deletable table inherits the standard audit quintuple via Drizzle mixin:

```ts
// apps/backend/src/db/schema/softDeleteSchema.ts (re-exported via db/schema/index.ts)
export const softDeleteColumns = {
  deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
  deletedBy: text('deleted_by'),
  deletionReason: varchar('deletion_reason', { length: 500 }),
  restoredAt: timestamp('restored_at', { withTimezone: true, mode: 'date' }),
  restoredBy: text('restored_by'),
  deletedWithCascade: boolean('deleted_with_cascade').default(false),
};
```
> Contract: `deletedAt` and `restoredAt` must always be JavaScript `Date` objects (`new Date()`) — never ISO strings.

### 2.2 Three-Tier Index Strategy
1. **Category A (Trash-mode):** `index('tbl_deleted_idx').on(table.workspaceSubdomain, table.deletedAt)`
2. **Category B (Active-record hot partial):** `index('tbl_active_idx').on(table.workspaceSubdomain).where(sql`${table.deletedAt} is null`)`
3. **Category C (Archived-record partial):** `index('tbl_archived_idx').on(table.workspaceSubdomain, table.deletedAt).where(sql`${table.deletedAt} is not null`)`

### 2.3 Partial Unique Indexes vs `NULLS NOT DISTINCT`
- **Mandatory:** Use partial unique indexes scoped to `WHERE deleted_at IS NULL` for recyclable keys (`email`, `phone`, `code`, `slug`).
- **Strict Ban:** Never use PostgreSQL 15 `UNIQUE NULLS NOT DISTINCT` — it treats NULLs as identical, permitting only one active row and breaking subsequent soft-deletes.

### 2.4 Deep References
- Detailed SQL trigger definitions for `forbid_hard_delete()` and autovacuum tuning: see [`references/triggers-and-indexes.sql`](references/triggers-and-indexes.sql).
- Dynamic query AST filter helpers for complex joins: see [`references/query-ast-filter.ts`](references/query-ast-filter.ts).
- Transactional outbox CDC events (`entity.soft_deleted`, `entity.restored`): see [`references/cdc-outbox.ts`](references/cdc-outbox.ts).

---

## 3. Backend Implementation Checklist

1. **Delete Route (`DELETE /:id`):**
   - Verify caller has `delete` permission via `can(user, 'delete', resource)`.
   - Check restrict guards (e.g. `activeEntriesCount > 0` → 409 Conflict).
   - If soft-deleting an account (`tenant_users`, `faculty`), immediately invalidate sessions and Redis tokens.
   - Execute soft-delete update inside `withTenant(async (tx) => { ... })`:
     ```ts
     await tx.update(students)
       .set({ deletedAt: new Date(), deletedBy: user.id, deletionReason: body.reason ?? null })
       .where(and(eq(students.id, id), eq(students.workspaceSubdomain, tenantId), isNull(students.deletedAt)));
     ```
   - Emit transactional outbox CDC event `entity.soft_deleted` inside the same transaction.

2. **Restore Route (`POST /:id/restore`):**
   - Verify caller has `delete` or `restore` permission.
   - Guard against collision on active unique constraints before restoring.
   - Execute restore update:
     ```ts
     await tx.update(students)
       .set({ deletedAt: null, restoredAt: new Date(), restoredBy: user.id })
       .where(and(eq(students.id, id), eq(students.workspaceSubdomain, tenantId), isNotNull(students.deletedAt)));
     ```
   - Emit outbox event `entity.restored`.

3. **Query Reads (`GET /`):**
   - Default query path must filter `isNull(table.deletedAt)`.
   - When `includeDeleted=true` query param is provided, verify caller has delete permission, then execute `SET LOCAL app.include_deleted = 'true'` in the transaction.

---

## 4. Frontend Work Tier Integration

1. **State & URL Sync:** Read/write `deleted=true` in search params via `useSearchParams()`.
2. **Toggle Primitive:** Render `ModuleTrashToggle` in the Work action bar next to the search input.
3. **Bulk Actions:** Render `ModuleWorkBulkActionBar` with Restore / Permanent Purge options when in trash mode.
4. **Optimistic Toast:** On single delete, display an undo toast with action:
   ```ts
   toast.success(t('common.deleted'), {
     action: { label: t('common.undo'), onClick: () => restoreMutation.mutate(id) },
   });
   ```
5. **Drawer Chrome:** In detail drawer, show an `ArchivedBanner` with deletion metadata (`deletedAt`, `deletedBy`, `deletionReason`) and a prominent "Restore" button.

---

## 5. Verification & Acceptance Criteria

```bash
# Verify Category B partial indexes across tenant tables
bash .agent/skills/mms-soft-delete/scripts/verify-soft-delete-schema.sh

# Run soft-delete backend and integration tests
pnpm --filter @mms/backend test:inject
```

- [ ] All tenant entities include `deleted_at`, `deleted_by`, `restored_at`, `restored_by`, `deleted_with_cascade`.
- [ ] Active reads return 0 soft-deleted records.
- [ ] Direct SQL `DELETE` is rejected with `check_violation` unless `app.allow_hard_purge = 'true'`.
- [ ] Account soft-deletion immediately terminates active user sessions.

## Script

```bash
bash scripts/verify-soft-delete-schema.sh
```

Runs the migration-index ratchet, then asserts every soft-deletable tenant schema exposes the column sextuple and a Category B partial index (`WHERE deleted_at IS NULL`). It fails when a **targeted** schema file is missing rather than skipping it, so keep the target list in sync with the schema directory.
