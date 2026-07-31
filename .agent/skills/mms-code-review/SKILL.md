---
name: mms-code-review
description: Reviews MMS code against project rules, skills, and migration status. Use when reviewing PRs, doing a code review, checking rule compliance, or auditing backend/frontend changes before merge.
---

# MMS Code Review

Agent self-review after edits → also follow always-on `mms-completion-review.md`.

## Review order

1. Automated gates (`pnpm typecheck`, scoped lint/tests)
2. Security / tenant / RBAC
3. Data layer (Query vs legacy, bulk upsert, RLS)
4. Module §7 gold-standard (+ messaging variants when touched)
5. i18n / a11y
6. Scope creep

## Automated checks

```bash
pnpm typecheck
pnpm test
cd apps/frontend && pnpm lint
cd apps/backend && pnpm lint
```

E2E when touching auth/routing/onboard: `pnpm exec playwright test` (critical path: `e2e/tests/onboarding-login.spec.ts`)

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
- [ ] After server `bulkSave` imports (e.g. Google sync), invalidate only — do not re-upsert the same rows
- [ ] Hybrid reads use `useXxxCollection()` — not raw `useLiveCollection` on REST pages

### UI / config
- [ ] No hardcoded labels/colours/status maps — `t()` + registries
- [ ] No new `uiStrings` keys outside Contacts module
- [ ] Fields/tabs from registry
- [ ] Module tier: `work` | `reports` | `setup`
- [ ] `ResponsiveAccordionTabs` / `SubTabBar` — no inline tab bars
- [ ] Mobile-first layout: no fixed `w-[Npx]` page widths; no `max-lg:` layout forks; logical CSS for RTL
- [ ] Tables wrapped (`Table` or `overflow-x-auto`); interactive controls ≥ 44×44 (`min-h-11 min-w-11`)
- [ ] `FormModal` for add/edit entity dialogs when touching legacy overlays
- [ ] Settings panels use `useSettingsDraft` / domain draft hooks + live preview — not direct `saveObject` on change
- [ ] New settings section: registered in `SETTINGS_SECTIONS`, `SETTINGS_NAV`, `SETTINGS_SECTION_COMPONENTS`
- [ ] Settings footer labels via `t()` — no hardcoded save-state strings in `SettingsFormActions`
- [ ] Brand colour previews use derived tokens (`brandingTheme`) — not raw hex on surfaces
- [ ] **Platform apex English-only**: no tenant `settings.language` / RTL on apex; use `shouldForcePlatformEnglish` + `applyApexPlatformTheme('en')`; platform shells `dir="ltr"`
- [ ] **Missing tenant host**: hard-redirect to apex `/tenant-not-found?subdomain=…` (`tenantNotFoundPath`) — never mount `/settings` or stay on the bad host; contact platform admin copy only

### RBAC (frontend)
- [ ] Module pages use `useModulePermissions(X_MODULE_MANIFEST)` (or `can()`) — not `role ===` / `disabled={role === '…'}`
- [ ] Forbidden actions omitted — not disabled placeholders

### Soft delete (when entity supports it)
- [ ] `DELETE` soft-deletes; `POST :id/restore` restores
- [ ] List supports `includeDeleted`; Work default excludes deleted; BE SQL-filters `deleted_at`
- [ ] Create/update write schemas strip client soft-delete fields
- [ ] FE trash UI or documented intentional hard-delete / manifest variant
- [ ] Soft-delete modules: trash toggle + restore omit Add/messaging in archive mode
- [ ] Entity merge (if any) is atomic server endpoint — not FE dual-write

### Gold-standard module parity (`mms-module-architecture.md` §7)
- [ ] Bulk PUT upsert-only — no `replaceForWorkspace` wipe on API write paths
- [ ] Forms/setup use `mutateAsync` / await; close only after success
- [ ] Manifest `setupSubTabs` + `softDelete` metadata when applicable
- [ ] Setup gated by `canEditSetup`; Work shows `ErrorState` on list failure
- [ ] Cmd/Ctrl+N create when `canWrite` and not in trash

### Messaging (when touched)
- [ ] Composer uses `MessagingRecipient` — not contacts schemas
- [ ] Clear-logs soft-archive semantics preserved
- [ ] Session-forced `userId` on BE; no SQL echo; upsert templates/logs

### Field persistence (new/changed fields)
- [ ] Field on `@mms/shared` type + `DEFAULT_*` + merge helper
- [ ] Write reaches PostgreSQL
- [ ] UI control bound to save path — not orphaned `useState`

### Auth / security
- [ ] No secrets in diff
- [ ] OTP uses `crypto.randomInt()` — not `Math.random()`
- [ ] Rate limit preserved on login/onboard/messaging send when touching those paths
- [ ] No in-memory auth handoff / 2FA maps — use `auth_artifacts`
- [ ] Never trust client tenant/userId for authz
- [ ] `ContactConfigProvider` not nested on child pages

### Testing
- [ ] New `@mms/shared` pure helpers have unit tests
- [ ] Auth/RBAC/tenant changes have `inject()` allow+deny tests
- [ ] Playwright: prefer `getByRole`/`getByLabel` — no `waitForTimeout` sleeps
- [ ] Shell / touch / RTL / table changes: keep `responsive-shell` + `responsive-authenticated` green; extend when touching platform `md` nav or Reports/Setup builders

### Accessibility
- [ ] Icon buttons have `aria-label` from `t()`; forms use associated labels
- [ ] Suspense fallbacks have `role="status"` / screen-reader text
- [ ] Honor `prefers-reduced-motion` for decorative Framer Motion when adding motion

### Performance
- [ ] jspdf/xlsx/html2canvas dynamically imported
- [ ] No `setInterval` / `refetchInterval` polling added
- [ ] No unnecessary `useMemo`/`useCallback` (React Compiler-first)

### Scope
- [ ] No drive-by refactors
- [ ] No unused imports in changed files

## Severity

- **Critical:** security bypass, missing `authenticateTenant`, cross-tenant leak, bulk wipe PUT, data loss
- **Major:** missing RBAC on writes, raw `fetch('/api')`, dual data paths, broken migration journal, nested `ContactConfigProvider`
- **Minor:** style, optional DRY, residual `role ===` in untouched files

## References

- Frontend: `mms-api-interface.md`, `mms-data-layer.md`, `mms-hooks.md`, `mms-ui-ux-design.md`, `mms-auth-security.md`, `mms-messaging.md`
- Backend: `mms-api-interface.md`, `mms-auth-security.md`, `mms-data-layer.md`
- Debt: `mms-migration-status.md`
- Skills: `mms-backend-api`, `mms-backend-security`, `mms-data-sync`, `mms-frontend`, `mms-messaging`
