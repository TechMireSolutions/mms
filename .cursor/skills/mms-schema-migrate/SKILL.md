---
name: mms-schema-migrate
description: Forward-only Drizzle migrations with journal/meta, expand/contract DDL, FORCE RLS on new tenant tables, and ban on drizzle-kit push against shared/prod DBs. Use when changing schema.ts, writing SQL migrations, or reviewing DDL PRs. Do NOT use for client-side query caching (use mms-query-factories) or application Fastify route handlers (use mms-backend-api).
license: Proprietary
metadata:
  owner: mms-platform
  last-verified: 2026-09-24
---

# MMS Schema & Drizzle Migration Workflow

**Rules (norms SSOT):** `mms-data-layer.mdc` §5–§6 · `mms-auth-security.mdc` · `mms-performance.mdc` · `mms-soft-delete`.

Operational procedure for creating PostgreSQL schemas, Drizzle models, forward-only SQL migrations, and matching `@mms/shared` Zod contracts.

## 1. Schema Authoring Standards

- **3NF & Strict Typing**: Dedicated, typed columns only. Untyped JSON/JSONB/EAV blobs and comma-delimited strings are banned (`mms-data-layer.mdc` §5).
- **Multi-Tenancy**: Every tenant table requires `tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" })` and `FORCE ROW LEVEL SECURITY`.
- **Primary & Temporal Keys**: `bigint` identity PK (high-write) or `uuid` PK (distributed); `TIMESTAMPTZ` with timezone for `createdAt`/`updatedAt`. Bounded `varchar(N)` for predictable text.
- **Drizzle Relations & Types**: Define bidirectional `relations(entityTable, ...)` and export `$inferSelect` and `$inferInsert` types.
- **Shared Zod Contracts**: Define matching write schemas in `packages/shared/src/schemas/` with `.strict()`.

## 2. Migration Execution Procedure

1. **Author Schema**: Add/edit `apps/backend/src/db/schema/[entity].ts` and export from `schema.ts`.
2. **Generate Migration**: Run `pnpm --filter mms-backend db:generate`. Never squash or alter existing committed migrations.
3. **Commit Parity**: Always commit SQL migration + `_journal.json` + meta snapshot in the exact same change.
4. **Expand/Contract Workflow**: Add nullable column → deploy & backfill → apply NOT NULL/CHECK constraint. Drop old columns only after dual-read window.
5. **Attach RLS Policies**: Tenant tables must include `tenant_isolation_policy` and `platform_superadmin_policy` (`mms-data-layer.mdc` §5).
6. **Soft-Delete Strategy**: Soft-deletable tables use `softDeleteColumns` mixin, Category B partial index (`WHERE deleted_at IS NULL`), and `forbid_hard_delete()` trigger (`mms-soft-delete`).
7. **Non-Blocking Indexes**: Never write-blocking `CREATE INDEX` on large production tables in migration SQL. Run concurrent indexes via `pnpm --filter mms-backend index:concurrent`.
8. **Ban Direct Push**: `drizzle-kit push` and `db push` are strictly banned against shared or production databases.

## 3. Verification & CI Ratchets

Execute before opening PR or committing DDL:

```bash
# 1. Audit migration integrity, RLS enforcement, and lock safety
bash scripts/check-migrations.sh
MMS_RLS_STRICT=1 bash scripts/check-migrations.sh

# 2. Verify non-blocking index additions and explicit projections
pnpm run check:migration-indexes
pnpm run check:db-projections

# 3. Typecheck backend and shared contracts
pnpm typecheck
```
