---
name: mms-code-review
description: Reviews MMS code against project rules, skills, and migration status. Use when reviewing PRs, doing a code review, checking rule compliance, or auditing backend/frontend changes before merge.
---

# MMS Code Review

Agent self-review after edits → also follow always-on `mms-completion-review.mdc`.

**When X → skill Y (deep dive, not this index):** FormModal / Zod forms → **`mms-form-architecture`** · Query factories → **`mms-query-factories`** · axe / focus-return → **`mms-a11y-smoke`** · deps bumps → **`mms-dependency-upgrade`** · DDL → **`mms-schema-migrate`** · CSRF/cookies → **`mms-backend-security`** · backup wipe → **`mms-backup-restore`**.

## Modern practices (pointers only)

| When reviewing… | Owner |
|-----------------|--------|
| Keyset/cursor vs OFFSET lists | `mms-data-layer.mdc` · **`mms-backend-api`** / **`mms-query-factories`** |
| Contested PUT / `updated_at` → 409 | `mms-api-interface.mdc` §6 · **`mms-backend-api`** |
| `sql.raw` / statement_timeout | `mms-data-layer.mdc` · **`mms-schema-migrate`** / **`mms-backend-api`** |
| Dense table virtualization | `@tanstack/react-virtual` — `mms-ui-ux-design.mdc` · **`mms-module-work`** |
| List pending a11y (`aria-busy`) | `mms-ui-ux-design.mdc` · **`mms-a11y-smoke`** |
| Query `placeholderData: (prev) => prev` | `mms-data-layer.mdc` · **`mms-query-factories`** |
| bodyLimit / outbound `AbortSignal.timeout` / idempotency↔body | `mms-api-interface.mdc` · **`mms-backend-api`** |
| Title Case skip ar/ur/fa / RTL prose | `mms-structure-naming.mdc` · **`mms-shared-package`** |
| Messaging send idempotency digest | `mms-api-interface.mdc` §6 · **`mms-messaging`** |

## Review order

1. Automated gates (`pnpm typecheck`, scoped lint/tests)
2. Security / tenant / RBAC
3. Data layer (Query vs legacy, bulk upsert, RLS)
4. Module §7 gold-standard (+ messaging variants when touched)
5. i18n / a11y (axe smoke via `mms-a11y-smoke` when shells/primitives change)
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
- [ ] Backend: routes → use-cases (repo DI) → repository interface → adapter (no `pg`/Drizzle in routes); refactored modules use composition root (`contactUseCases` pattern) — `mms-api-interface.mdc` §2
- [ ] Repository interface is the sole storage gateway; use-case functions take it via DI (testable with fakes) — `mms-data-layer.mdc`
- [ ] Correct data layer: Query for REST resources, `useLiveCollection` for legacy modules
- [ ] Module config via `createStandardModuleConfigHook` (extend the hook, no forked providers) — `mms-hooks.mdc`
- [ ] Touched app files under hard ~300 lines (prefer ~220 FE shells); splits keep public barrels — `mms-structure-naming.mdc`

### Backend API
- [ ] Tenant protected routes use **`authenticateTenant`** — not raw `jwtVerify`
- [ ] Cookie CSRF / Origin on state-changing cookie-auth routes
- [ ] `host` / `x-forwarded-host` tested in `inject()` tests for tenant routes
- [ ] Zod write DTOs (prefer `.strict()`); no parallel Ajv for same shape
- [ ] `rbacService` on writes; admin-only on sync download/upload
- [ ] Drizzle migration + journal via **`mms-schema-migrate`** (no `drizzle-kit push` on shared/prod)
- [ ] Stable error `type` codes; no stack traces in responses

### Frontend API
- [ ] Internal MMS calls use `apiFetch` / `apiJson` — no raw `fetch('/api/...')`
- [ ] `credentials: 'include'` via apiClient (cookie session — no new `mms_token` writes)
- [ ] Query factories / tuple keys — skill **`mms-query-factories`**
- [ ] `enabled: isAuthenticated` on tenant REST hooks
- [ ] Mutations invalidate affected queries (list + count keys; Contacts also messaging resolve)
- [ ] Optimistic updates banned for money / soft-delete / bulk / backup / messaging send
- [ ] No duplicate data path (Query mutations + parallel `saveCollection` for same write)
- [ ] After server `bulkSave` imports (e.g. Google sync), invalidate only — do not re-upsert the same rows
- [ ] REST pages use Query hooks / collection facades — not raw `useLiveCollection` for entity rows
- [ ] Report widgets/visualizer: `useWidgetCollections` / `useReportCollectionRows` — no `getCollection`/`saveCollection` primary for REST entities

### UI / config
- [ ] No hardcoded labels/colours/status maps — `t()` + registries
- [ ] No new `uiStrings` keys outside Contacts module
- [ ] Fields/tabs from config registries
- [ ] Module tier: `work` | `reports` | `setup` (applies to both tenant and platform modules)
- [ ] `ResponsiveAccordionTabs` / `SubTabBar` — no inline tab bars
- [ ] Mobile-first layout: no fixed `w-[Npx]` page widths; no `max-lg:` layout forks; logical CSS for RTL
- [ ] Tables wrapped (`Table` or `overflow-x-auto`); interactive controls ≥ 44×44 (`min-h-11 min-w-11`)
- [ ] Forms: `FormModal` + norms — skill **`mms-form-architecture`** (container queries, ContactConfig options, collection delete persist)
- [ ] Bulk id bodies / contacts list filters: shared schemas (`bulkIdsBodySchema`, `contactsListQuerySchema`) — no forked Messaging flags
- [ ] Contacts `activeCount` = soft-delete-filtered total (not phantom `isActive`)
- [ ] Settings: draft hooks + preview — skill **`mms-settings-i18n`** / **`mms-frontend`**
- [ ] **Platform apex English-only** / **missing tenant hard-redirect** — `mms-auth-security.mdc`

### RBAC (frontend)
- [ ] Module pages use `useModulePermissions(X_MODULE_MANIFEST)` (or `can()`) — not `role ===` / `disabled={role === '…'}`
- [ ] Forbidden actions omitted — not disabled placeholders

### Soft delete (when entity supports it)
- [ ] `DELETE` soft-deletes; `POST :id/restore` restores
- [ ] List supports `includeDeleted`; Work default excludes deleted; BE SQL-filters `deleted_at`
- [ ] Create/update write schemas strip client soft-delete fields
- [ ] FE trash UI or documented intentional hard-delete / manifest variant
- [ ] Soft-delete modules: trash toggle + restore omit Add/messaging in archive mode; drawer uses `WarningCallout` + Restore
- [ ] Work multi-select uses `BulkSelectionBar` + `BulkSelectionActions` (`BulkSelectionDeleteAction` / Restore / Messaging) on list/parent (no forked selection chrome; no toolbar-inline trash)
- [ ] Entity merge (if any) is atomic server endpoint — not FE dual-write

### Gold-standard module parity (`mms-module-architecture.mdc` §7)
- [ ] Bulk PUT upsert-only — no `replaceForWorkspace` / wipe-missing-rows (incl. custom-tabs) on API write paths
- [ ] Forms/setup use `mutateAsync` / await; close only after success
- [ ] Manifest `setupSubTabs` + `softDelete` metadata when applicable
- [ ] Setup gated by `canEditSetup` (or `platformUserCan`); Work shows `ErrorState` on list failure **with hint** (`loadFailedHint` — tenant and platform apex)
- [ ] Directory empties use `EmptyState` (`title` required; `compact` when dense); column gates use `isColumnVisible` (not `show*` fans)
- [ ] Cmd/Ctrl+N create when `canWrite` (or `platformUserCan`) and not in trash
- [ ] Prefer shared Work chrome (`EmptyState` / `FieldErrorMessage` / `WarningCallout` / `BulkSelectionBar` / `WORK_SURFACE` / `FORM_CARD` / `ModuleCommandMetricsGrid` for KPI strips; person-module chrome: `LeadingIconInput`, `DetailSectionTitle`, `FormFooterChip`, `ModuleFilterDropdown`, `DrawerSyncStatusFooter`; `h-chart-*` / `z-modal*` / `max-w-toast` over ad-hoc sizes) — `mms-ui-ux-design.mdc`

### Messaging (when touched)
- [ ] Composer uses `MessagingRecipient` — not contacts schemas
- [ ] Clear-logs soft-archive semantics preserved
- [ ] Session-forced `userId` on BE; no SQL echo; upsert templates/logs
- [ ] Send/campaign idempotency key **bound to body digest** (409 on mismatch); `429`/`Retry-After` surfaced

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
- [ ] When shells/primitives/FormModal change → run skill **`mms-a11y-smoke`** (axe serious/critical + focus-return)
- [ ] Icon buttons `aria-label` from `t()`; Suspense `role="status"`; honor `prefers-reduced-motion`

### Performance / deps / React 19
- [ ] Export artifacts generated via backend BullMQ + Typst/ExcelJS; no client-side DOM canvas/jspdf injection
- [ ] React 19: Prefer `useEffectEvent`, `startTransition`, `useDeferredValue` over `useMemo`/`useCallback` unless referential equality is strictly required.
- [ ] Dependency bumps → skill **`mms-dependency-upgrade`**

### Scope
- [ ] No drive-by refactors
- [ ] No unused imports in changed files

## Severity

- **Critical:** security bypass, missing `authenticateTenant`, cross-tenant leak, bulk wipe PUT, data loss
- **Major:** missing RBAC on writes, raw `fetch('/api')`, dual data paths, broken migration journal, nested `ContactConfigProvider`
- **Minor:** style, optional DRY, residual `role ===` in untouched files

## References

- Rules: `mms-api-interface.mdc`, `mms-data-layer.mdc`, `mms-hooks.mdc`, `mms-ui-ux-design.mdc`, `mms-auth-security.mdc`, `mms-form-architecture.mdc`, `mms-messaging.mdc`, `mms-migration-status.mdc`
- Skills: `mms-frontend`, `mms-backend-api`, `mms-backend-security`, `mms-form-architecture`, `mms-query-factories`, `mms-schema-migrate`, `mms-backup-restore`, `mms-a11y-smoke`, `mms-dependency-upgrade`, `mms-messaging`
