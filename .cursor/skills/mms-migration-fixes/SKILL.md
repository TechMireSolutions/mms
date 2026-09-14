---
name: mms-migration-fixes
description: Addresses the open priorities P1–P7 in mms-migration-status.mdc — schema realignment, soft-delete debt, and residual architecture gaps. Use when working an item that is explicitly listed as open debt in that register. Do NOT use for new feature work (use mms-module-page), schema DDL authoring (use mms-schema-migrate), soft-delete feature work (use mms-soft-delete), or dependency bumps (use mms-dependency-upgrade).
license: Proprietary
metadata:
  owner: mms-platform
  last-verified: 2026-09-15
allowed-tools: Read Grep Glob Bash(pnpm typecheck) Bash(pnpm test)
---

# MMS Migration Fixes

**Rule (norms SSOT):** `mms-migration-status.mdc` · `mms-core.mdc` · `mms-completion-review.mdc`.

Only implement items **in scope** for the current task.

- **Do not reintroduce themes** (residual debt register): `rules/mms-migration-status.mdc` (closed milestones → `docs/migration-milestones.md`)
- **Open gaps detail** (this skill): prioritized P1–Pn below — the rule keeps a short summary only.

When the user asks to fix migration debt, work from the open priorities here and the owning scoped rules.

The closed-items register (61 rows of "do not reintroduce") is historical reference: **`references/resolved-register.md`**, with closed migration milestones in `docs/migration-milestones.md`.

## Open priorities

Residual Work SQL-page debt for **other** modules (not Teachers/Users/Sessions) lives under “SQL pagination / oversized shells” in `mms-migration-status.mdc`.

### P1 — Soft-delete / schema remaining gaps

**Problem:** Gaps identified across entity schemas, routes, and background workers (`docs/soft-delete.md` §11):
1. **High**: Missing partial unique indexes on `email`/`phone`/`employee_id` for contacts, students, teachers — archived rows block re-registration of the same email.
2. **Medium**: Missing Category B partial indexes (`WHERE deleted_at IS NULL`) and Category C partial indexes (`WHERE deleted_at IS NOT NULL`) on 10+ tables (teachers, sessions, enrollments, finance, accounting, obligations, hasanat, examinations).
3. **Medium**: Missing `deleted_with_cascade` column on `enrollments` — cascade restore from session restore cannot be distinguished from standalone archive.
4. **Low**: Inconsistent inline ternaries for `includeDeleted` in `sessions.ts` / `finance.ts` (replace with `isQueryFlagTrue`).
5. **Low**: Unimplemented scheduled retention hard-purge worker (`purgeExpiredArchivedRecords`).

**Fix:**
- Partial unique indexes (`WHERE deleted_at IS NULL`) already landed in `apps/backend/src/db/migrations_drizzle/0104_soft_delete_system_complete.sql`; verify remaining tables against the three-tier index strategy rather than adding a new migration by hand.
- Category B/C partial indexes live in the same baseline — audit coverage with `pnpm run check:migration-indexes` and add missing pairs as forward-only DDL (`mms-data-layer.mdc` §7).
- Add `deleted_with_cascade` column to enrollments; update session cascade soft-delete and restore logic (`docs/soft-delete.md` §2.2).
- Standardize all query-flag parsing on `isQueryFlagTrue`.
- Implement `purgeExpiredArchivedRecords` in `apps/backend/src/worker/` using chunked `LIMIT 500 FOR UPDATE SKIP LOCKED` (`docs/soft-delete.md` §13).
- Do not regress Messaging clear or QB papers/results variants without an explicit product change. Users soft-delete is in the squashed baseline (`tenant_users.deleted_at` in `0000_init` + forward migrations).

**Skills:** `mms-soft-delete`, `mms-module-work`, `mms-module-page` (§7), `mms-frontend`, `mms-backend-api`, `mms-schema-migrate`, `mms-background-jobs`

### P2 — Residual permission / role special cases

**Problem:** Platform `super_user` checks, setup matrices (`RolesPermissions`), and a few non-gate `role` comparisons remain outside module write surfaces.

**Fix:** Prefer `can()` / contract permissions when touching those UIs; do not add new tenant-module `role ===` write gates (`mms-auth-security.mdc`).

### P4 — Report drill-down & saved reports

**Problem:** Contacts has typed saved reports + share scopes; pinned widgets/visualizer are Query-first. Other modules lag on drill-down / share parity; some niche charts still client-reduce.

**Fix:** Same patterns on other module reports (`mms-reports.mdc`, skill `mms-reports-export`). Prefer `/metrics` / server aggregates over full-row dumps.

### P5 — Responsive e2e depth

**Problem:** Shells + Work-route smoke are green (`responsive-shell` / `responsive-authenticated`). Platform `md` bottom nav and deep Reports/Setup builders are not asserted.

**Fix:** Extend those specs when touching those surfaces — `mms-ui-ux-design.mdc` §4, `mms-testing-observability.mdc`. Do not treat missing depth as license to regress shell overflow/touch floors.

### P7 — PG statement timeout budgets (residual)

**Problem:** Tenant-bound budgets ship on `withTenant` + `runInTransaction` (`PG_STATEMENT_TIMEOUT_MS` / `PG_IDLE_IN_TX_TIMEOUT_MS`). Residual: optional tighter per-route budgets on hot paths.

**Fix:** When touching hot routes, prefer tighter `SET LOCAL` budgets — `mms-data-layer.mdc` (align with Fastify `requestTimeout`).

## After each fix

```bash
pnpm typecheck && pnpm test
cd apps/backend && pnpm lint   # if BE touched
cd apps/frontend && pnpm lint  # if FE touched
```

Update `mms-migration-status` **Recently resolved** when fully done.

## Rules sync

After changing standards:

```bash
bash .agent/scripts/sync-all.sh
```
