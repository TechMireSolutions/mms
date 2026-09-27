# Frontend Refactor — Evidence and Implementation Backlog

Date: 2026-09-27
Companion to the [architecture plan](frontend-refactor-plan.md).
Status: A1 complete; A2 reset-race fix complete, with broader session-scoping work pending.

## Implementation progress

### A1 completed — command-palette result ownership

Both adapters now supply their filtering function to `useCommandPaletteSearch`. The hook
returns the exact filtered array used by rendering, active descendant IDs, arrow bounds,
and Enter dispatch. Host-specific matching and permission policies remain in their adapters.
Selection is bounded when results shrink; the platform result view accepts readonly items.

The initial six keyboard regressions failed before the fix. Final verification: four test
files / 17 tests passed, including both host adapters, empty results, mouse selection,
permission removal, reopen behavior, and shrinking/reordered hook results. Repository
typecheck, frontend lint, boundary-rule fixtures, code-norm ratchet, and diff checks passed.
The frontend typecheck executed rather than using a Turbo cache hit.

The regression harness uses the actual adapters and shared hook with a simplified modal;
existing static tests exercise the real modal markup. Browser focus trapping/restoration,
responsive layouts, and full accessibility conformance were not verified in this slice.
No modal styling, routing policy, authorization rules, or persistence lifecycle was changed.
Next: A2 cache lifecycle investigation and focused race reproduction (progress below).

### A2 progress — reset races and platform logout

A regression reproduced delayed IndexedDB restoration repopulating tenant records after
`queryClientInstance.clear()`. A shared persistence controller now owns restoration, debounce,
write ordering, and a reset generation. The application's QueryClient clears that controller
before memory, so existing tenant logout, expiry, and host-change clear calls gain the same behavior.
Repeated initialization reuses one subscription and restore operation.

Reset cancels scheduled saves and rejects a prior generation's restore. Persisted removal is
queued after any in-flight write; later saves cannot overtake removal. Storage failures are caught.
Platform logout now clears memory even when the logout HTTP request fails. Platform/auth cache
exclusions apply during both saving and restoration of older payloads. Paused mutations are no
longer serialized or restored; live in-memory reconnect behavior remains unchanged.

Verification: six frontend files / 27 tests passed, including existing tenant AuthContext tests;
two backend platform auth/workspace integration files / eight tests passed. Repository typecheck,
fresh frontend typecheck, frontend lint, code-norm checks, and diff checks passed. Replaced the old
test that duplicated the persistence predicate with tests invoking the actual controller.

Remaining A2 work: gate startup restore on verified session identity; define cache scope for
same-origin account/permission changes; verify multi-tab behavior and reload during pending removal.
Removal is asynchronous, so this fix does not establish a reload-safe revocation boundary.
Existing startup hydration remains automatic; do not treat this slice as complete session isolation.
In-flight mutation callbacks and cross-account reconnect behavior also need dedicated verification.

## 1. Current inventory

Source scan: `.ts`/`.tsx` under `apps/frontend/src`, excluding `.test.*` and `.spec.*`.
This includes declarations and barrels; counts describe files, not independently reusable components.

| Area | Files |
| --- | ---: |
| All frontend production TS/TSX | 2,477 |
| `components/ui` | 477 |
| `components/common` | 43 |
| `tenant` | 1,443 |
| `platform` | 162 |
| `hooks` | 39 |
| `lib` | 226 |
| `providers` | 3 |

The existing `eslint-rules/ui-host-imports-baseline.json` records **57 dependency edges in
55 files**, including **48 report files**. These are accepted exceptions, not 57 newly detected bugs.
The guard is already enabled at error level in `apps/frontend/eslint.config.js`.

Direct import-path scan (not a transitive graph):

| API | Importing production files | Interpretation |
| --- | ---: | --- |
| `AppShell` | 3 | Two host adapters plus the common barrel |
| `CommandPaletteModal` | 2 | Both host palettes already share the modal |
| `useCommandPaletteSearch` | 2 | Both host palettes already share keyboard state |
| `SimplePagination` | 4 | Widgets/drilldown consumers |
| `ListPagination` | 4 | Lists and report grid consumers |
| `ExportToolbar` | 23 | Already serves platform and tenant/report consumers |
| `ExportToolbarCompact` | 1 | Internal child of `ExportToolbar`, not a parallel public API in current callers |
| `createModuleQueryInvalidator` | 3 | Students, contacts, faculty wrappers |

## 2. Reconciliation of previous findings

References F1–F12 refer to `docs/frontend-architecture-audit.md`.

| Finding | Current assessment | Action |
| --- | --- | --- |
| F1 domain constants | Accounting duplicates remain. Invoice statuses and open invoice statuses represent different sets. | Derive identical accounting values; preserve the full-status/open-subset distinction. Check payment schema before changing payment methods. |
| F2 invalidation | Three direct factory consumers confirmed; broader invalidation coverage is unmeasured. | Inventory each module's keys and write/live-update paths before adoption. |
| F3 local response types | Audit, image, attachment, and column-preference response types still exist locally. | Compare actual server shapes; derive from an existing shared contract where available. |
| F4 mixed data shims | Still relevant; accounting metadata and domain constants remain mixed. | Separate pure contracts from frontend presentation metadata in bounded slices. |
| F5 command palettes | Modal and keyboard hook already extracted. Their filtered-result contract is inconsistent. | Fix behavioral contract; do not extract another shell. |
| F6 navigation | Navigation transitions already shared; separate domain nav models remain intentional candidates for adapter mapping. | Compare rendered chrome; do not merge permission models. |
| F7 pagination | Both APIs remain, with four direct consumers each. | Share controls if warranted; preserve known-total versus has-more semantics. |
| F8 export toolbar | Public wrapper already has a variant API; compact view has one internal importer. | Treat as composition already achieved; verify behavior only if touched. |
| F9 bulk bars | Earlier recommendation to collapse layers is superseded by work-directory design. Existing convergence check passes. | Keep the presentation dock, universal adapter, and useful feature wrappers. |
| F10 raw palettes | Not fully remeasured. Existing code-norm check reports hex literals, not a complete raw-palette analysis. | Audit class expressions and enforcement coverage before proposing a zero baseline. |
| F11 scaffold tabs | Direct accordion references remain; some can legitimately be nested setup/report tabs. | Classify top-level tier duplication separately from nested tabs. |
| F12 temporary files | No `.tmp` paths found by the current `rg --files` scan, which respects ignore rules. | No deletion planned; ignored-file presence remains unverified and low priority. |

The newer reuse audit's branding boot concern is also stale: `brandingThemeCore.ts` now accepts
explicit settings and imports shared calculations. Recheck its callers, not a nonexistent platform import.
Its proposed boundary ratchet now exists. Report/selector compatibility exports remain migration debt.

## 3. Prioritized implementation slices

### A1 — Correct command-palette keyboard selection (first slice)

Evidence: `components/ui/CommandPalette.tsx` passes `filteredItems("")` into
`useCommandPaletteSearch`, then renders `activeFilteredItems`. The platform adapter passes
`allAvailableItems`, then renders its separate filtered list. The hook handles Enter and arrow
wrapping against its `items` argument. Thus displayed selection and dispatched selection can disagree.
This is a static code finding; the existing tests are not proof that the filtered path works.

Contract: one ordered visible-results array supplies row rendering, active descendant IDs,
keyboard bounds, and Enter dispatch. Keep search matching and permission filtering in host adapters.
Choose one owner for the query value so deferred rendering cannot dispatch against another list.

Files: shared search hook, both palette adapters, and their tests. Add a focused hook test if it
better captures shrinking/reordered results. No new palette framework or dependency.

Acceptance:

- A query excluding the original first item makes Enter activate the first visible result.
- Arrow navigation wraps within visible results; zero results never dispatch an item.
- Results shrinking after permission/data updates cannot leave an invalid active index.
- Mouse selection, Escape, reopen behavior, and active-descendant IDs remain consistent.
- Both host tests cover these behaviors using their actual adapters.

### A2 — Prove and repair cache lifecycle boundaries (early investigation)

Evidence: `lib/queryClient.ts` restores at module initialization and debounces saves by one second.
`AuthContext.logout` clears memory; `useAuthSessionSync` clears on logout storage events/session expiry;
`TenantContext` clears on a detected subdomain change. `idbCachePersister.removeClient` exists but has
no production caller in the inspected source search. Platform query persistence is excluded by the
first key segment; `PlatformAuthContext.platformLogout` itself does not clear the query cache.

These observations warrant regression tests, not a claim of a demonstrated cross-tenant leak.
Browser origins already separate subdomain storage. Same-origin account changes and late restoration
need independent verification, including whether surrounding providers clear platform memory.

Test scenarios: delayed restore finishing after logout; reload before the debounce completes;
account A → logout → account B on the same host; permission reduction; platform reauthentication;
offline/reconnect with pending work. Assert no previous account's data reaches a new session's view.

If a test demonstrates a gap, introduce an explicit persistence lifecycle with cancellation/generation
guards and scoped restore eligibility. Decide which data may be persisted before changing key shape.
Do not alter backend auth or RLS as part of this frontend slice.

### A3 — Strengthen existing boundary enforcement

The current rule handles static imports, re-exports, dynamic literal imports, `require`, alias/relative
paths, and stale exceptions. It checks direct targets; a permitted shared helper can still hide domain
dependencies. Its filename exemption also excludes tests intentionally.

Work: generate a resolved module graph using the installed TS tooling; classify runtime/type-only edges;
trace from shared entry points to domain endpoints; inspect barrels and cycles; add exact fixtures for
extension and index resolution. Keep the current lint rule as the fast direct guard. Decide whether a
separate graph check is justified by actual bypasses before adding it.

Acceptance: newly introduced forbidden paths fail; resolved exceptions fail until removed from the
baseline; valid adapter-to-view imports pass. Attach a rationale and retirement slice to every retained
exception. Protected CI integration, if needed, is a later explicit approval step.

### A4 — Remove date-picker settings coupling

Evidence: `components/ui/useDatePickerState.ts` reads `tenant/hooks/useGlobalSettings` only to resolve
date format. That hook responds to saved settings, storage, and preview events.

Proposed API: make the shared state hook take a resolved `DateFormatId`; wire the value through a
host-neutral formatting adapter/provider or explicit component prop after enumerating DatePicker callers.
Prefer the smallest option that preserves live preview without repeated per-field subscriptions.
Do not default every caller silently and lose configured formatting.

Acceptance: existing date/year/flexible modes, bounds, typing, blur, clearing, value changes, and live
format changes remain correct. The shared hook no longer imports tenant settings; remove its exception.

### A5 — Migrate compatibility exports by family

Begin with two selector shims, then the 48 report exception files. Count actual consumers before moving
imports. Tenant-only consumers should use tenant adapters; truly shared consumers receive typed views.
Do not promote report fetching into shared UI or route feature-to-feature imports around existing rules.
Keep useful public aliases temporarily; any removal follows the repository deletion requirement.

Acceptance per family: no new forbidden edge, fewer baseline entries, preserved consumer behavior,
and shared views render without tenant/auth providers. A moved file alone is not evidence of reuse.

### A6 — Consolidate genuine pure-contract duplication

Start with accounting account types. Inspect shared exports and server responses for the four local
response envelopes. Distinguish domain DTOs from frontend view models; preserve subtype metadata and
frontend labels/icons in frontend ownership. Add pure-helper/schema tests when shared logic changes.

### A7 — Token and remaining composition audit

Map CSS tokens → shared branding generation → DOM application → component styles → chart/print adapters.
Document each override/reset point and preview lifetime. Measure raw palette usage and repeated layout
values. Check actual locale fonts and contrast before proposing visual changes.

Review pagination and sidebar chrome after A1–A6. Keep domain semantics in wrappers; never fabricate
record totals to adapt a page-count API. Reuse existing scaffold, bulk-action, and export compositions.

## 4. Dependency order and review boundaries

Recommended order: A1 → A2 investigation → A3 → A4 → A5/A6 → A7.
A proven account-boundary defect takes priority over cosmetic consolidation. A5 and A6 are independent
work streams, but no delegation is required. Each slice includes consumer migration and regression tests.

Before each slice: confirm working-tree state and applicable rules, document preserved behavior,
write meaningful failing coverage for defects, implement, then run scoped checks plus required gates.
Do not expand a passing slice into unrelated file-size cleanup or dependency upgrades.

## 5. Verification scope and outstanding Phase 0 work

| Check run in this continuation | Result |
| --- | --- |
| `pnpm typecheck` | Passed, five Turbo tasks served from cache |
| Direct frontend `tsc -p tsconfig.json` | Passed independently of the Turbo task cache |
| `pnpm --filter mms-frontend lint` | Passed |
| Boundary rule fixture file via `node --test` | Passed; one runner file containing RuleTester cases |
| Focused Vitest: both palettes, DatePicker, navigation state, query client, branding theme | Six files, 45 tests passed |
| `pnpm check:work-directory` | Passed; four reported prohibited patterns at zero |
| `pnpm check:code-norms` | Passed existing baselines: 46 explicit-any occurrences, 30 raw-hex occurrences, 61 files over its 300-line threshold |

Passing ratchets does not mean the underlying debt is absent. The file-size check's 300-line
threshold differs from the documented 200-line cap; capture that enforcement gap in A3 rather than
silently claiming the stricter rule is verified. No full frontend suite or production build was run.

Completed: source inventory, direct consumer counts, existing-rule inspection, old-finding reconciliation,
targeted state-lifecycle trace, and the first actionable component contract defect.

Still required for Phase 0 completion: fully resolved/transitive import graph; exhaustive token and
invalidation maps; broader duplicate-family classification; production bundle baseline; authenticated
responsive/locale/a11y baseline; cache race reproduction. This document does not mark Phase 0 complete.

E2E caution is concrete: `e2e/helpers/tenantBootstrap.ts` calls a platform-user reset script.
Use an isolated disposable database for those flows. No seeded E2E suite was run during this planning pass.
