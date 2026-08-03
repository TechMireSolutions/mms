---
name: mms-schema-migrate
description: Forward-only Drizzle migrations with journal/meta, expand/contract DDL, FORCE RLS on new tenant tables, and ban on drizzle-kit push against shared/prod DBs. Use when changing schema.ts, writing SQL migrations, or reviewing DDL PRs.
---

# MMS Schema Migrate Workflow

**Rules (norms SSOT):** `mms-data-layer.mdc` · `mms-ops-infrastructure.mdc` · `mms-structure-naming.mdc`.

Do **not** use for product debt register → `mms-migration-fixes`. Do **not** use for route/service wiring → `mms-backend-api` (point here for DDL).

## Workflow

1. Edit `apps/backend/src/db/schema.ts` (composite tenant keys, typed soft-delete columns when needed).
2. Append forward-only `migrations_drizzle/000N_*.sql` — do not resurrect pre-squash history.
3. Update `_journal.json` + meta snapshots in the same change.
4. Prefer expand/contract: add nullable → backfill → constrain; drop only after dual-read window.
5. **Ban** `drizzle-kit push` / `db push` against shared/prod — local/dev emergency only.
6. New tenant tables: RLS + **FORCE ROW LEVEL SECURITY**; writes via `withTenantTransaction` / SET LOCAL.
7. Prefer partial indexes for hot active lists (`WHERE deleted_at IS NULL`) when adding soft-delete.
8. Restart / `initDb` applies migrations; run inject smoke if RLS or write paths touched.
9. Size pool via `PG_POOL_MAX` — do not hardcode `Pool({ max })` in call sites.
10. Statement/sql safety budgets → `mms-data-layer.mdc` (`statement_timeout`, parameterized `sql` only — ban user→`sql.raw`).

## Checklist

```
- [ ] schema.ts + SQL + journal/meta committed together
- [ ] No drizzle-kit push in CI/prod docs or scripts
- [ ] Expand/contract for breaking DDL
- [ ] FORCE RLS on new tenant tables
- [ ] Soft-delete columns/indexes when archiving entities
- [ ] Aware of PG timeout / sql fragment norms (data-layer)
```

## Done

Migration applies cleanly on empty + existing DB — `mms-completion-review.mdc`.
