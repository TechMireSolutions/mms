---
description: Fix documented MMS technical debt from migration-status
---

# Workflow: Fix Migration Debt

## Steps

1. Load skills: `mms-migration-fixes` + task-specific skill (`mms-backend-security`, `mms-frontend`, `mms-module-page`, etc.)
2. Read `rules/mms-migration-status.md` — confirm item is in the open gaps table (not Recently Resolved)
3. Implement minimal fix for chosen item only
4. Run `pnpm typecheck` (+ lint / tests as scoped)
5. Move item to Recently Resolved (and update `mms-migration-fixes` open priorities) when fully done
6. `bash .agent/scripts/sync-all.sh` if standards files changed

## Current P1 focus

| Debt | Skill |
|------|-------|
| Messaging clear / QB papers-results variants (intentional — do not regress) | `mms-module-work`, `mms-messaging` |
| Residual `role ===` / setup matrix special cases | `mms-backend-security`, `mms-frontend` |
| Report drill-down & saved reports beyond Contacts | `mms-reports-export` |
| Custom tabs relational schema | `mms-fields-registry` |
