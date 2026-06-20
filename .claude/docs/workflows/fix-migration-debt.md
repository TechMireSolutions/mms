---
description: Fix documented MMS technical debt (auth seeds, providers, RBAC, duplicates)
---

# Workflow: Fix Migration Debt

## Steps

1. Load skills: `mms-migration-fixes` + task-specific skill (`mms-auth-users`, `mms-contacts`, etc.)
2. Read `rules/mms-migration-status.md` — confirm item is in scope
3. Implement minimal fix for chosen item only
4. Run `pnpm typecheck` (+ `pnpm lint` if frontend)
5. Update `mms-migration-status` rule if item fully resolved

## Common tasks

| Debt | Skill |
|------|-------|
| Auth seed mismatch | `mms-auth-users` |
| Nested ContactConfigProvider | `mms-contacts` |
| DraggableFieldList duplicate | `mms-fields-registry` |
| RBAC on `/api/db` | `mms-backend-api` + `mms-auth-users` |
