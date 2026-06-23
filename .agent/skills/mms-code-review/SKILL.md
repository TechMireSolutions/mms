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

E2E when touching auth/routing: `pnpm exec playwright test`

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
- [ ] `credentials: 'include'` via apiClient (cookie session — no new `mms_token` writes)
- [ ] Query hooks export stable `QUERY_KEY` constants
- [ ] `enabled: isAuthenticated` on tenant REST hooks
- [ ] Mutations invalidate affected queries (list + count keys)
- [ ] No duplicate data path (Query mutations + parallel `saveCollection` for same write)
- [ ] Hybrid reads use `useXxxCollection()` — not raw `useLiveCollection` on REST pages

### UI / config
- [ ] No hardcoded labels/colours/status maps — `t()` + registries
- [ ] No new `uiStrings` keys outside Contacts module
- [ ] Fields/tabs from registry
- [ ] Module tier: `work` | `reports` | `setup`
- [ ] `ResponsiveAccordionTabs` / `SubTabBar` — no inline tab bars
- [ ] `FormModal` for add/edit entity dialogs when touching legacy overlays
- [ ] Settings panels use `useSettingsDraft` / domain draft hooks + live preview — not direct `saveObject` on change
- [ ] New settings section: registered in `SETTINGS_SECTIONS`, `SETTINGS_NAV`, `SETTINGS_SECTION_COMPONENTS`
- [ ] Settings footer labels via `t()` — no hardcoded save-state strings in `SettingsFormActions`
- [ ] Brand colour previews use derived tokens (`brandingTheme`) — not raw hex on surfaces

### RBAC (frontend)
- [ ] New gates use `can()` — not `role ===` / `disabled={role === '…'}`
- [ ] Forbidden actions omitted — not disabled placeholders

### Field persistence (new/changed fields)
- [ ] Field on `@mms/shared` type + `DEFAULT_*` + merge helper
- [ ] Write reaches SQLite
- [ ] UI control bound to save path — not orphaned `useState`

### Auth / security
- [ ] No secrets in diff
- [ ] OTP uses `crypto.randomInt()` — not `Math.random()`
- [ ] Rate limit preserved on login/onboard when touching auth
- [ ] No in-memory auth handoff / 2FA maps — use `auth_artifacts`
- [ ] `AuthContext` mount effect stable (`useCallback`) — no render loops
- [ ] `ContactConfigProvider` not nested on child pages

### Testing
- [ ] New `@mms/shared` pure helpers have unit tests
- [ ] Auth/RBAC/tenant changes have `inject()` tests
- [ ] Frontend tests use happy-dom when touching apiClient/hooks

### Accessibility
- [ ] Icon buttons have `aria-label` from `t()`; forms use associated labels
- [ ] Suspense fallbacks have `role="status"` / screen-reader text

### Performance
- [ ] jspdf/xlsx/html2canvas dynamically imported
- [ ] No `setInterval` / `refetchInterval` polling added

### Scope
- [ ] No drive-by refactors
- [ ] No unused imports in changed files

## Severity

- **Critical:** security bypass, missing `authenticateTenant`, cross-tenant data leak, data loss
- **Major:** missing RBAC on writes, raw `fetch('/api')`, dual data paths, broken migration journal, nested `ContactConfigProvider`
- **Minor:** style, optional DRY, residual `role ===` in untouched files

## References

- Frontend: `mms-frontend.mdc`, `mms-query.mdc`, `mms-hooks.mdc`, `mms-ui-*`, `mms-rbac.mdc`
- Backend: `mms-backend.mdc`, `mms-security.mdc`, `mms-database.mdc`
- Debt: `mms-migration-status.mdc`
- Skills: `mms-backend-api`, `mms-auth-users`, `mms-data-sync`, `mms-frontend`
