---
name: mms-migration-fixes
description: Addresses known MMS technical debt from mms-migration-status — remaining gaps only. Use when the user asks to fix migration gaps, align rules with code, or tackle documented debt.
---

# MMS Migration Fixes

Only implement items **in scope** for the current task. Full register: `.cursor/rules/mms-migration-status.mdc`.

## Resolved (do not reintroduce)

| Item | Resolution |
|------|------------|
| Auth seeds shape | `StoredUser` with `role` + `passwordHash` |
| RBAC on `/api/db/*` writes | `rbacService` |
| Nested `ContactConfigProvider` | Single mount in `App.tsx` |
| JWT localStorage-only | httpOnly cookies + `apiClient` |
| Tenant JWT binding | `authenticateTenant` middleware |
| Bulk sync open download | Admin-only `canDownloadBulkSync` |
| Global DB reset via API | Tenant-scoped `resetTenantData` |
| Massive mock auto-seed | `minimalSeeds` + empty frontend defaults |
| In-memory auth handoff | `auth_artifacts` table |
| Client-side 2FA only | Server `twoFactorService` |
| Orphan route guards | Canonical `ProtectedRoute` in `HostRoutes` |

## Open priorities

### P1 — Per-entity REST migration

**Problem:** Most modules still use `/api/db/collections/:name`.

**Fix:** Add REST route + Query hooks per module (students pilot done).

**Skills:** `mms-backend-api`, `mms-data-sync`, `mms-query`

### P1 — Contacts write RBAC

**Problem:** `POST /api/contacts` has no `canWriteCollection` check.

**Fix:** Add RBAC aligned with `contacts.write` permission.

**Rules:** `mms-rbac.mdc`, `mms-security.mdc`

### P1 — Read RBAC (evaluate)

**Problem:** Any authenticated user can read all tenant collections.

**Fix:** Role-based read matrix or collection-level ACL — design before implementing.

### P2 — `can()` registry coverage

**Problem:** Inline `role ===` checks remain on some pages.

**Fix:** Wire `usePermissions()` when touching modules.

### P2 — Remove legacy `mms_token` path

**Problem:** `apiClient` still reads localStorage token.

**Fix:** Remove after confirming all clients use cookies.

### P2 — Sentry / client error reporting

**Problem:** Console/toasts only.

**Fix:** Wire in `main.tsx` per `mms-observability.mdc`.

### P3 — Relational custom fields

**Problem:** Document store only for custom tabs.

**Fix:** `pgTable` + migration per `mms-fields.mdc`.

## After each fix

```bash
pnpm typecheck && pnpm test
cd apps/backend && pnpm lint   # if BE touched
cd apps/frontend && pnpm lint  # if FE touched
```

Update `mms-migration-status.mdc` **Recently resolved** row when fully done.

## Rules sync

After changing standards: edit `.cursor/rules/*.mdc`, then:

```bash
bash .agents/scripts/sync-rules.sh
```

Copy skill changes to both `.cursor/skills/` and `.agents/skills/`.
