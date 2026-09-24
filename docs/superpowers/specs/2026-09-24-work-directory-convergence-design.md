# Work Directory Convergence — Design Spec

**Date:** 2026-09-24
**Status:** Approved design (pending written-spec review)
**Scope:** Convergence pass over the nine tenant listing modules (contacts, students, faculty, enrollments, sessions, finance, hasanat, obligations, question-bank) onto the canonical Work-tab design system.

## 1. Background & audit findings

The originating brief assumed tenant listing pages were legacy and fragmented (ad-hoc `<table>` markup, custom list views, manual pagination, disconnected selection). A full audit found the reality is different: **all nine modules already render `ModulePageShell` (→ `ModuleScaffold`)** with the 3-tier Work/Reports/Setup structure, `DetailSheet` drawers, and dual-view table/cards directories. Contacts is the documented gold standard (`.agent/skills/mms-module-work/SKILL.md`), and the rules (`mms-module-architecture.mdc` §3/§7, `mms-ui-ux-design.mdc` §6) already mandate dual-view and column-customizer wiring.

The real fragmentation, which this spec addresses. **Update after detailed extraction:** commit `cfa35a11` ("standardize entity listing pages on canonical Work tier primitives") landed part of this work between the audit and planning — the notes below reflect verified current code.

1. **Selection SSOT is split.** Five modules (contacts, students, faculty, sessions, enrollments) own selection in the page controller. Four (finance, hasanat, obligations, question-bank) bury selection inside list components and leave the controller without it: finance's controller has no selection state at all (lists own `useInvoiceSelection` / raw `useState`, worked around with a drilled `selectionResetKey` prop); hasanat, obligations, and question-bank pass literal `selectedCount: 0` / `clearSelection: () => {}` stubs into `useModuleShortcuts` in their controllers.
2. **Three competing bulk-bar bases.** `ModuleWorkBulkActionBar` (contacts only), `ModuleUniversalBulkActionBar` (students, faculty, sessions, finance, enrollments), `ModuleStandardBulkActionBar` (hasanat, obligations, question-bank).
3. **Desktop tables are already converged** (`cfa35a11`): every module's `*ListDesktopTable.tsx` composes `WorkBatchTable` (`apps/frontend/src/components/common/work/WorkBatchTable.tsx`). Remaining work is conformance-checking plus deleting the now-dead `QuestionBankTableHeader.tsx` / `QuestionBankTableRow.tsx` (zero importers).
4. **Dead SSOT code.** `useWorkDirectoryController` (`apps/frontend/src/hooks/useWorkDirectoryController.ts`), `ModuleWorkDirectoryShell` (`apps/frontend/src/components/ui/ModuleWorkDirectoryShell.tsx`), and `BulkActionDock` as a direct consumer target are used by zero of the nine modules (tests and one accounting hook only).
5. **Enrollments lacks the customizer reset** — students is fully wired end-to-end (controller → `StudentsWorkTier` → `StudentsListFilters` → `WorkTaskToolbar`, including a working `onReset`); the actual gap is `EnrollmentsPage.tsx` not passing `onResetLayout` into its `columnCustomizer` slot, leaving the reset button disabled.
6. **Rule enforcement gap.** The norms exist, but `.cursor/rules/README.md`'s enforcement registry lists tier/UX norms as "advisory — none".
7. **Test asymmetry.** Contacts (67 test files), students (55), faculty (48), enrollments (32) are deeply covered; sessions (7), question-bank (9), finance (10), hasanat (10), obligations (13) are thin with no page-level tests.

## 2. Decisions

- **Scope:** convergence pass on the real gaps only. No cosmetic rewrites of already-standard pages. (User-approved over full-brief rewrite, plan-only, and rules-first options.)
- **Selection architecture:** the contacts pattern — selection owned by the page controller, threaded down to table, cards, select-all bar, and bulk bar — is the single standard. The unused `useWorkDirectoryController` / `ModuleWorkDirectoryShell` stack is retired (folded in only where it is genuinely a base layer; verified during implementation). (User-approved over adopting the unused controller everywhere, and over minimal-fix.)
- **Execution strategy:** shared base → finance pilot → rollout → rules/tests. (User-approved over horizontal gap-by-gap and vertical module-by-module.)
- **Bulk-bar end state (revised after extraction, user-approved):** two layers — `ModuleWorkBulkActionBar` as the purely presentational dock, plus ONE i18n/manifest adapter (`ModuleUniversalBulkActionBar` absorbing Standard's surface). Only `ModuleStandardBulkActionBar` is deleted. (Supersedes the original "absorb everything into the base, delete both adapters" decision, which would have duplicated i18n/gating logic across 12+ wrappers.)

## 3. Design — shared convergence base

### 3a. Bulk-bar unification

**Decision (revised after extraction, user-approved): two layers, one adapter.** Both `ModuleUniversalBulkActionBar` and `ModuleStandardBulkActionBar` are already thin adapters *over* `ModuleWorkBulkActionBar`, and Universal carries shared logic worth keeping (i18n label derivation, manifest `bulkActions` gating, permission gates, generic `messagingTargets<T>` dispatch, status-action slot). Deleting both would push that logic into 12+ wrappers — a DRY regression. The end state:

- **`ModuleWorkBulkActionBar`** (`apps/frontend/src/components/ui/ModuleWorkBulkActionBar.tsx`) stays the purely presentational dock (trash-mode restore/delete switching, messaging/export/extra slots, Escape-to-clear via `BulkActionDock`). No i18n or manifest coupling added.
- **`ModuleUniversalBulkActionBar` becomes the single adapter**: absorb Standard's `exportAction` pass-through and reconcile the two conflicting i18n key conventions (`{ns}.selectedCount`/`{ns}.bulkRestore` vs `{ns}.trash.selected`/`{ns}.trash.restore`) via i18next array-key fallback, so no locale-file churn is required.
- Re-point the six Standard-base wrappers (accounting, obligations, attendance, hasanat, question-bank, examinations — including the four out-of-scope modules, whose wrappers change mechanically) to the unified adapter. Delete `ModuleStandardBulkActionBar` once zero imports remain.
- Module wrappers (`StudentsBulkActionBar`, `FinanceBulkActionBar`, …) remain — they own module manifests, permission gating, and module-specific slots.
- Delete `ModuleWorkDirectoryShell` and `useWorkDirectoryController` (zero feature importers; only the `components/common/work` barrel and their own tests reference them) plus their barrel exports and rule/doc mentions.

### 3b. Selection lifting (finance, hasanat, obligations, question-bank)

- Move `selectedIds`, `handleSelectOne`, `handleSelectAll`, `clearSelection`, `selectionState` from the list-local hooks into each page controller.
- Controllers reset selection on page/sort/search/trash-toggle change, mirroring `useContactsDirectoryFilters`. This replaces finance's `selectionResetKey` prop-drilling.
- Table, cards, `DirectoryCardsSelectAllBar`, and the bulk bar all read from the controller — one source, no synchronization code.
- The four list-local selection hooks are deleted; their tests move up to controller level.

### 3c. Desktop table conformance

All `*ListDesktopTable.tsx` already compose `WorkBatchTable` (`cfa35a11`). This phase is a **conformance check only** against the contract: `selection` prop shape, `sort`, `columnResize` via `useModuleColumnLayout` (`getColumnWidth`/`setColumnWidth`), auto-virtualization above 30 rows, `ModuleTableFooterCount`. Deviations get fixed in place; dead `QuestionBankTableHeader.tsx` / `QuestionBankTableRow.tsx` are deleted.

### 3d. Enrollments customizer reset

Pass `onResetLayout: columnLayout.resetColumnLayout` into the `columnCustomizer` slot in `EnrollmentsPage.tsx` (the layout hook already exposes `resetColumnLayout`; only the wiring is missing). Students is already fully wired — no work needed there.

## 4. Rollout plan

| Phase | Target | Work items |
|---|---|---|
| 0 | Shared base | Merge Standard adapter into Universal (single i18n/manifest adapter over the presentational `ModuleWorkBulkActionBar`); re-point 6 Standard wrappers; retire `ModuleStandardBulkActionBar`, `ModuleWorkDirectoryShell`, `useWorkDirectoryController` |
| 1 | **finance** (pilot) | Selection lift × 2 sub-lists (invoices/payments) into `useFinancePageController`, remove `selectionResetKey` + `useInvoiceSelection`, wire `useModuleShortcuts`, thread props, page-level test |
| 2 | **hasanat** | Selection lift (`useDistributionSelection` → `useHasanatCardsPageController`), real shortcut values, thread through `DistributionsList`, page-level test |
| 3 | **obligations** | Selection lift (`useObligationSelection` → controller, migrate its test), real shortcut values, swap raw `motion.div` → `ModuleTierMotion` in `ObligationsPage.tsx`, page-level test |
| 4 | **question-bank** | Selection lift (`useQuestionBankSelection` → controller), real shortcut values, delete dead `QuestionBankTableHeader/Row`, page-level test |
| 5 | **enrollments** | Wire `onResetLayout` into the `columnCustomizer` slot + test |
| 6 | Conformance sweep | contacts, faculty, sessions, enrollments (+ the four lifted modules): checklist verification (controller selection, single bulk-bar adapter, `WorkBatchTable` contract, customizer wired incl. reset); fix deviations only; page-level test for sessions |
| 7 | Rules & enforcement | See §5 |

(Phases 0–5 each end with the regression gates in §6c. Former "retire dead code" phase folded into Phase 0 — the dead-code inventory is confirmed: zero feature importers for all three retiring artifacts.)

## 5. Rules & enforcement

Canonical edits only (mirrors regenerate via sync script):

- `.cursor/rules/mms-module-architecture.mdc` — §3/§7: name controller-owned selection as the standard (list-local selection state banned); the two-layer bulk-bar structure (`ModuleWorkBulkActionBar` presentational dock + single i18n/manifest adapter) as the standard; `WorkBatchTable` as the mandatory desktop table.
- `.cursor/rules/mms-dry.mdc` — add anti-patterns: per-module bulk-bar adapter forks; duplicated per-list selection hooks.
- `.cursor/rules/README.md` — update ownership matrix rows and the enforcement registry (new rows inserted **before** the final `advisory` row; the registry header requires same-change updates).
- `.agent/skills/mms-module-work/SKILL.md` — update the Work checklist (and its "Do Not" section) to match.
- **New ratchet:** `scripts/check-work-directory.mjs` (styled on `scripts/check-code-norms.mjs`), wired as `pnpm run check:work-directory` in root `package.json` and as a step in the `lint-and-typecheck` job of `.github/workflows/ci.yml` (after "Code-norm ratchets", matching the existing comment style). Fails CI on:
  1. imports of `ModuleStandardBulkActionBar` (retired adapter);
  2. imports of `useWorkDirectoryController` / `ModuleWorkDirectoryShell` in feature code (belt-and-braces after deletion);
  3. CSS dual-render (`md:hidden` / `md:block` sibling branches in `*List.tsx` files);
  4. `selectedCount: 0` stubs passed to `useModuleShortcuts` in page controllers.

After edits: `bash .agent/scripts/sync-all.sh` then `node scripts/verify-rules-integrity.mjs`. Mirrors (`.agent/rules/`, `.claude/rules/`, `.cursor/skills/`, `.claude/skills/`) are never hand-edited.

## 6. Testing & verification

### 6a. New page-level integration tests

Vitest + React Testing Library (happy-dom, setup at `apps/frontend/src/test/setup.ts`), following existing conventions: page-level smoke tests mock the controller hook and stub the view (`ContactsPage.test.tsx` pattern); view-mode-dependent tests mock `@/hooks/useWorkDirectoryViewMode` (pattern in `EnrollmentsList.test.tsx:12-17`). New coverage for the modules lacking page tests: **finance, hasanat, obligations, question-bank, sessions** (plus enrollments customizer-reset coverage). Each covers:

- Shell: `ModulePageShell` renders; Work tier default; trash toggle switches bulk-bar restore/delete modes.
- Dual view: cards default below `md`, table at `md+` (mocked `useMediaQuery`); `WorkViewModeToggle` switches; exactly one of table/cards in the DOM (no CSS dual-render).
- Selection SSOT: row select in table → bulk dock count → switch to cards → same selection → select-all bar indeterminate/total → Escape clears.
- Column customizer: toggle hides column in table header AND card metadata; reorder persists via `useUiStateStore` (debounced PATCH payload shape); width clamps 80–640px.
- `DetailSheet`: `onView` opens; close returns focus; archive banner + restore in trash mode.
- Edge cases: empty state, error state with retry, loading skeleton, partial selection across pages, long-text truncation.

### 6b. Migrated-component tests

The four list-local selection hook tests move to controller level. Finance selection must not leak across the invoices/payments sub-tab switch. Bulk-bar wrapper tests shrink to label/slot assertions; behavior coverage lives on the shared base.

### 6c. Regression gates (per phase)

```bash
pnpm --dir apps/frontend typecheck        # tsc -p ./tsconfig.json
pnpm --dir apps/frontend test             # vitest run (full suite at minimum at phase end)
pnpm --dir apps/frontend lint             # eslint . --quiet
node scripts/verify-rules-integrity.mjs   # after the rules phase
pnpm run check:work-directory             # once it lands
```

If the full frontend suite is too slow per phase, affected-module tests run per phase and the full suite at the end — reported explicitly, never claimed otherwise.

## 7. Out of scope

- Platform-admin pages and system configuration pages (untouched, per the brief).
- Backend API changes.
- Attendance, messaging, users, examinations, accounting modules — not in the brief's list; flagged as follow-up candidates in the delivery report.
- Visual redesign; design tokens and existing chrome stay as-is.

## 8. Deliverable report contents

1. Implementation plan summary (this spec + phase outcomes).
2. Audit & migration matrix: per module — legacy components removed, standardized components introduced, column-customizer status.
3. Architecture notes: controller selection SSOT, unified bulk-bar composition, responsive view switching.
4. Updated rules/skills list across `.cursor/rules/`, `.agent/rules/`, `.claude/rules/`.
5. Test results: actual command outputs for the gates in §6c.
