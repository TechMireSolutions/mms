---
description: Fix documented MMS technical debt (auth seeds, providers, RBAC, duplicates)
---

# Workflow: Fix Migration Debt

## Steps

1. Load skills: `mms-migration-fixes` + task-specific skill (`mms-backend-security`, `mms-frontend`, etc.)
2. Read `rules/mms-migration-status.md` — confirm item is in scope
3. Implement minimal fix for chosen item only
4. Run `pnpm typecheck` (+ `pnpm lint` if frontend)
5. Update `mms-migration-status` rule if item fully resolved

## Common tasks

| Debt | Skill |
|------|-------|
| Auth seed mismatch | `mms-backend-security` |
| Nested ContactConfigProvider | `mms-frontend` |
| DraggableFieldList duplicate | `mms-fields-registry` |
| RBAC on `/api/db` | `mms-backend-api` + `mms-backend-security` |
