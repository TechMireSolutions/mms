---
name: mms-code-review
description: Reviews MMS code against project rules, skills, and migration status. Use when reviewing PRs, doing a code review, checking rule compliance, or auditing backend/frontend changes before merge.
---

# MMS Code Review

## Automated checks

```bash
pnpm typecheck
pnpm test
cd apps/frontend && pnpm lint
cd apps/backend && pnpm lint
```

## Checklist

### Architecture
- [ ] Shared types/utils in `@mms/shared` (not duplicated)
- [ ] No frontend → backend direct imports
- [ ] Backend: routes → services → database (no `pg` in routes)
- [ ] Correct data layer: Query for REST resources, `useLiveCollection` for legacy modules

### Backend API
- [ ] Tenant protected routes use **`authenticateTenant`** — not raw `jwtVerify`
- [ ] `host` / `x-forwarded-host` tested in `inject()` tests for tenant routes
- [ ] Zod or JSON Schema on write bodies
- [ ] `rbacService` on writes; admin-only on sync download/upload
- [ ] Drizzle migration + **`_journal.json`** entry if schema changed
- [ ] Stable error `type` codes; no stack traces in responses

### Frontend API
- [ ] Internal MMS calls use `apiFetch` / `apiJson` — no raw `fetch('/api/...')`
- [ ] `credentials: 'include'` via apiClient
- [ ] Query hooks export stable `QUERY_KEY` constants
- [ ] Mutations invalidate affected queries
- [ ] No duplicate data path (Query + `useLiveCollection` for same entity)

### UI / config
- [ ] No hardcoded labels/colours/status maps — `t()` + registries
- [ ] Fields/tabs from registry
- [ ] Module tier: Operations | Analytics | Configuration

### Field persistence (new/changed fields)
- [ ] Field on `@mms/shared` type + `DEFAULT_*` + merge helper
- [ ] Write reaches PostgreSQL
- [ ] UI control bound to save path — not orphaned `useState`

### Auth / security
- [ ] No secrets in diff
- [ ] OTP uses `crypto.randomInt()` — not `Math.random()`
- [ ] Rate limit preserved on login/onboard when touching auth
- [ ] No in-memory auth handoff / 2FA maps — use `auth_artifacts`
- [ ] `AuthContext` mount effect stable (`useCallback`) — no render loops

### Testing
- [ ] New `@mms/shared` pure helpers have unit tests
- [ ] Auth/RBAC/tenant changes have `inject()` tests
- [ ] Frontend tests use happy-dom when touching apiClient/hooks

### Accessibility
- [ ] Icon buttons have `aria-label`; forms use `t()` labels

### Performance
- [ ] jspdf/xlsx/html2canvas dynamically imported

### Scope
- [ ] No drive-by refactors
- [ ] No unused imports in changed files

## Severity

- **Critical:** security bypass, missing `authenticateTenant`, cross-tenant data leak, data loss
- **Major:** missing RBAC on writes, raw fetch, dual data paths, broken migration journal
- **Minor:** style, optional DRY

## References

- Backend rules: `mms-backend.mdc`, `mms-security.mdc`, `mms-database.mdc`, `mms-rbac.mdc`
- Debt: `mms-migration-status.mdc`
- Skills: `mms-backend-api`, `mms-auth-users`, `mms-data-sync`, `mms-frontend`
