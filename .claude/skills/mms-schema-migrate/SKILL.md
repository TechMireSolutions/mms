---
name: mms-schema-migrate
description: Forward-only Drizzle migrations with journal/meta, expand/contract DDL, FORCE RLS on new tenant tables, and ban on drizzle-kit push against shared/prod DBs. Use when changing schema.ts, writing SQL migrations, or reviewing DDL PRs.
---

# MMS Schema Migrate Workflow

**Rules (norms SSOT):** `mms-data-layer.md` · `mms-ops-infrastructure.md` · `mms-structure-naming.md`.

Do **not** use for product debt register → `mms-migration-fixes`. Do **not** use for route/service wiring → `mms-backend-api` (point here for DDL).

## Workflow

1. Edit `apps/backend/src/db/schema.ts` (composite tenant keys, typed soft-delete columns when needed).
2. Append forward-only `migrations_drizzle/00NN_*.sql` — do not resurrect pre-squash history.
3. Update `_journal.json` + meta snapshots in the same change.
4. Prefer expand/contract: add nullable → backfill → constrain; drop only after dual-read window.
5. **Ban** `drizzle-kit push` / `db push` against shared/prod — local/dev emergency only.
6. New tenant tables: RLS + **FORCE ROW LEVEL SECURITY**; writes via `withTenantTransaction` / SET LOCAL.
7. Prefer partial indexes for hot active lists (`WHERE deleted_at IS NULL`) when adding soft-delete.
8. Restart / `initDb` applies migrations; run inject smoke if RLS or write paths touched.
9. Size pool via `PG_POOL_MAX` — do not hardcode `Pool({ max })` in call sites.
10. Statement/sql safety budgets → `mms-data-layer.md` (`statement_timeout`, parameterized `sql` only — ban user→`sql.raw`).

## DFS (`custom_fields`) migration — reference

The canonical DFS migration is `migrations_drizzle/0030_custom_fields.sql` (`DFS.md` §2.5). When adding `custom_fields` (or amending), follow this template:

- `id: text` (app-generated `cf_<ts>_<rand>` via `crypto.randomUUID()`) — **not** `uuid`.
- `workspace_subdomain: text` referencing `workspaces.subdomain` (not `workspace_id: uuid`).
- Composite PK `PRIMARY KEY ("workspace_subdomain", "id")`.
- `module_id` denormalized for scoped list queries (avoids joining `custom_tabs` on every list).
- `FORCE ROW LEVEL SECURITY` + tenant-scoping policy `workspace_subdomain = current_setting('app.tenant_subdomain', true)`.
- Indexes: `(workspace_subdomain, tab_id)`, `(workspace_subdomain, module_id)`, `(workspace_subdomain, module_id, sort_order)` (active list).
- Append journal entry `idx: 30, tag: "0030_custom_fields"` to `meta/_journal.json` in the same change.

**`audit_logs` RLS gap (pre-existing):** `audit_logs` (used by DFS audit hooks) currently lacks `FORCE ROW LEVEL SECURITY`. This is pre-existing tech debt outside DFS scope, but DFS writes to it — file a follow-up migration to add RLS. DFS audit hooks always set `workspaceSubdomain` from `getRequestTenant()`, never from the request body (`DFS.md` §2.2/§4.4).

## Checklist

```
- [ ] schema.ts + SQL + journal/meta committed together
- [ ] No drizzle-kit push in CI/prod docs or scripts
- [ ] Expand/contract for breaking DDL
- [ ] FORCE RLS on new tenant tables (DFS custom_fields → 0030_custom_fields.sql)
- [ ] Soft-delete columns/indexes when archiving entities
- [ ] Aware of PG timeout / sql fragment norms (data-layer)
- [ ] DFS: parameterized uniqueness query — fieldKey registry-validated before @> containment (DFS §4.1/§4.2)
```

## Done

Migration applies cleanly on empty + existing DB — `mms-completion-review.md`.
