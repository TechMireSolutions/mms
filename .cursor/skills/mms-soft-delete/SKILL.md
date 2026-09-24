---
name: mms-soft-delete
description: Implements, verifies, or audits the MMS Soft-Delete System — column sextuple, 3-tier index strategy, partial unique indexes, BEFORE DELETE triggers, RLS policies, dynamic query ASTs, and trash UX. Use when adding or changing soft-delete, trash directories, restore handlers, DDL migrations, or auditing deletion lifecycles. Do NOT use for ephemeral scratchpad data (hard-delete directly per mms-data-layer.mdc) immutable audit log events (use mms-audit-trail), or posted-journal corrections (use mms-finance-accounting).
license: Proprietary
metadata:
  owner: mms-platform
  last-verified: 2026-09-24
---

# MMS Soft-Delete System Workflow

**Rules (norms SSOT):** `mms-data-layer.mdc` §6 · `mms-module-architecture.mdc` §6–§7 · `mms-core.mdc`.

Operational procedure for implementing, migrating, and verifying soft-delete lifecycle across database, backend API, and frontend Work tiers. Financial posted ledgers are append-only/reversal-driven; see ledger controls before applying generic undo.

## 1. Database Schema Standards

- **Column Sextuple**: Add `softDeleteColumns` mixin (`deletedAt`, `deletedBy`, `deletionReason`, `restoredAt`, `restoredBy`, `deletedWithCascade`).
- **3-Tier Indexing**:
  - Category A (Trash scan): compound `(tenant_id, deleted_at)`.
  - Category B (Active hot partial): `(tenant_id, ...)` `WHERE deleted_at IS NULL` (mandatory for active list performance).
  - Category C (Archived partial): `(tenant_id, deleted_at)` `WHERE deleted_at IS NOT NULL`.
- **Recyclable Uniqueness**: Unique fields (`email`, `phone`, `code`) must use partial unique indexes `WHERE deleted_at IS NULL`.
- **Safety Triggers**: Attach `forbid_hard_delete()` trigger to prevent direct SQL `DELETE` without explicit bypass flag.

## 2. Backend API Implementation

1. **Delete (`DELETE /:id`)**:
   - Verify `can('delete')` permission and check foreign key restrict guards.
   - For user/faculty accounts, immediately invalidate active sessions and Redis tokens.
   - Update `deletedAt = new Date()`, `deletedBy = user.id`, `deletionReason`.
   - Emit transactional outbox CDC event `entity.soft_deleted`.
2. **Restore (`POST /:id/restore`)**:
   - Verify `can('restore')` permission.
   - Check and trap PostgreSQL 23505 unique constraint collisions against active records.
   - Update `deletedAt = null`, `restoredAt = new Date()`, `restoredBy = user.id`.
   - Emit outbox CDC event `entity.restored`.
3. **List Queries**:
   - Default queries enforce `isNull(table.deletedAt)`.
   - `?includeDeleted=true` requires explicit delete permission and applies `SET LOCAL app.include_deleted = 'true'`.

## 3. Frontend Work Tier Integration

- **URL Sync & Toggle**: Mount `ModuleTrashToggle` in toolbar; sync state to `?view=trash` via `useSearchParams()`. Preserves search and active filters across toggles.
- **Bulk Actions**: Mount `BulkSelectionRestoreAction` in trash mode via `BulkSelectionBar`.
- **Optimistic Undo**: Non-financial single-record deletes show instant 5–10s Undo toast calling restore.
- **Detail Drawer**: Display `ArchivedBanner` (`WarningCallout`) with deletion metadata + Restore CTA; hide Edit and communication buttons.

## 4. Verification

```bash
# Verify schema sextuple and Category B partial indexes across tenant tables
bash scripts/verify-soft-delete-schema.sh

# Run backend soft-delete test suite
pnpm --filter mms-backend test
```
