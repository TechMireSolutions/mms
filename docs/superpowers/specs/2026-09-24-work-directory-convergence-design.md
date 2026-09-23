# Work Directory Convergence — Design Spec

**Date:** 2026-09-24
**Status:** Approved design (pending written-spec review)
**Scope:** Convergence pass over the nine tenant listing modules (contacts, students, faculty, enrollments, sessions, finance, hasanat, obligations, question-bank) onto the canonical Work-tab design system.

## 1. Background & audit findings

The originating brief assumed tenant listing pages were legacy and fragmented (ad-hoc `<table>` markup, custom list views, manual pagination, disconnected selection). A full audit found the reality is different: **all nine modules already render `ModulePageShell` (→ `ModuleScaffold`)** with the 3-tier Work/Reports/Setup structure, `DetailSheet` drawers, and dual-view table/cards directories. Contacts is the documented gold standard (`.agent/skills/mms-module-work/SKILL.md`), and the rules (`mms-module-architecture.mdc` §3/§7, `mms-ui-ux-design.mdc` §6) already mandate dual-view and column-customizer wiring.

The real fragmentation, which this spec addresses:

1. **Selection SSOT is split.** Five modules (contacts, students, faculty, sessions, enrollments) own selection in the page controller. Four (finance, hasanat, obligations, question-bank) bury selection inside list components (`useInvoiceSelection`, `useDistributionSelection`, `useObligationSelection`, `useQuestionBankSelection`) and expose `selectedCount: 0` / no-op `clearSelection` stubs at page level. Finance works around this with a `selectionResetKey` prop drilled into lists.
2. **Three competing bulk-bar bases.** `ModuleWorkBulkActionBar` (contacts only), `ModuleUniversalBulkActionBar` (students, faculty, sessions, finance, enrollments), `ModuleStandardBulkActionBar` (hasanat, obligations, question-bank).
3. **Hand-rolled desktop `<table>` markup** in several `*ListDesktopTable.tsx` files instead of the shared `WorkBatchTable` (`apps/frontend/src/components/common/work/WorkBatchTable.tsx`). Obligations and question-bank are confirmed; the exact list is finalized during the pilot.
4. **Dead SSOT code.** `useWorkDirectoryController` (`apps/frontend/src/hooks/useWorkDirectoryController.ts`), `ModuleWorkDirectoryShell` (`apps/frontend/src/components/ui/ModuleWorkDirectoryShell.tsx`), and `BulkActionDock` as a direct consumer target are used by zero of the nine modules (tests and one accounting hook only).
5. **Students lacks the `ModuleColumnCustomizer` UI** — `useStudentColumnLayout` exists and feeds the table, but no customizer is wired into the toolbar.
6. **Rule enforcement gap.** The norms exist, but `.cursor/rules/README.md`'s enforcement registry lists tier/UX norms as "advisory — none".
7. **Test asymmetry.** Contacts (67 test files), students (55), faculty (48), enrollments (32) are deeply covered; sessions (7), question-bank (9), finance (10), hasanat (10), obligations (13) are thin with no page-level tests.

## 2. Decisions

- **Scope:** convergence pass on the real gaps only. No cosmetic rewrites of already-standard pages. (User-approved over full-brief rewrite, plan-only, and rules-first options.)
- **Selection architecture:** the contacts pattern — selection owned by the page controller, threaded down to table, cards, select-all bar, and bulk bar — is the single standard. The unused `useWorkDirectoryController` / `ModuleWorkDirectoryShell` stack is retired (folded in only where it is genuinely a base layer; verified during implementation). (User-approved over adopting the unused controller everywhere, and over minimal-fix.)
- **Execution strategy:** shared base → finance pilot → rollout → rules/tests. (User-approved over horizontal gap-by-gap and vertical module-by-module.)

## 3. Design — shared convergence base

### 3a. Bulk-bar unification

`ModuleWorkBulkActionBar` (`apps/frontend/src/components/ui/ModuleWorkBulkActionBar.tsx`) becomes the single bulk-bar primitive. It already handles trash-mode restore/delete switching, messaging channel slots, export, extra actions, and Escape-to-clear.

- Diff `ModuleUniversalBulkActionBar` and `ModuleStandardBulkActionBar` props against it; add missing capabilities to `ModuleWorkBulkActionBar` as new **optional** props only (no breaking API change).
- Re-point the eight non-contacts module wrappers (`StudentsBulkActionBar`, `FinanceBulkActionBar`, etc.) to compose `ModuleWorkBulkActionBar`. Wrappers remain — they own module labels and permission gating — but shrink to pure label/slot adapters.
- Delete `ModuleUniversalBulkActionBar` and `ModuleStandardBulkActionBar` once zero imports remain (no deprecated-alias period). Delete `ModuleWorkDirectoryShell`; migrate or drop its test-only usages.

### 3b. Selection lifting (finance, hasanat, obligations, question-bank)

- Move `selectedIds`, `handleSelectOne`, `handleSelectAll`, `clearSelection`, `selectionState` from the list-local hooks into each page controller.
- Controllers reset selection on page/sort/search/trash-toggle change, mirroring `useContactsDirectoryFilters`. This replaces finance's `selectionResetKey` prop-drilling.
- Table, cards, `DirectoryCardsSelectAllBar`, and the bulk bar all read from the controller — one source, no synchronization code.
- The four list-local selection hooks are deleted; their tests move up to controller level.

### 3c. Desktop table conformance

Each `*ListDesktopTable.tsx` is audited against the `WorkBatchTable` contract: `selection` prop shape, `sort`, `columnResize` via `useModuleColumnLayout` (`getColumnWidth`/`setColumnWidth`), virtualization above 30 rows, `ModuleTableFooterCount`. Modules already on `WorkBatchTable` get a conformance check only; hand-rolled ones (obligations, question-bank at minimum) become thin adapters in the `ContactsListDesktopTable.tsx` style (column config → `WorkBatchTableColumn<T>`, cell render delegation).

### 3d. Students column customizer

Wire `ModuleColumnCustomizer` into the students Work toolbar using the existing `useStudentColumnLayout` registry (`registry`/`onUpdate`/`onReset` slots of `ModuleWorkToolbar`). UI wiring plus tests only — the layout hook already exists.

## 4. Rollout plan

| Phase | Target | Work items |
|---|---|---|
| 0 | Shared base | Bulk-bar capability diff + unification; selection-lift pattern established; dead-code inventory confirmed |
| 1 | **finance** (pilot) | Selection lift × 2 sub-lists (invoices/payments), remove `selectionResetKey`, bulk-bar re-point, `WorkBatchTable` conformance, page-level test |
| 2 | **hasanat** | Selection lift (`useDistributionSelection` → controller), bulk-bar re-point, table conformance, page-level test |
| 3 | **obligations** | Selection lift, bulk-bar re-point, migrate hand-rolled `<table>` → `WorkBatchTable`, replace raw `motion.div` with `ModuleTierMotion`, page-level test |
| 4 | **question-bank** | Selection lift, bulk-bar re-point, migrate `QuestionBankTableHeader/Row` → `WorkBatchTable`, page-level test |
| 5 | **students** | `ModuleColumnCustomizer` toolbar wiring + test |
| 6 | Conformance sweep | contacts, faculty, sessions, enrollments: checklist verification (controller selection, unified bulk bar, `WorkBatchTable`, customizer wired); fix deviations only; page-level tests for sessions (and any of the five lacking one) |
| 7 | Rules & enforcement | See §5 |
| 8 | Retire dead code | Delete the two old bulk-bar bases, `ModuleWorkDirectoryShell`, and (if fully unused after the pass) `useWorkDirectoryController` |

Each phase is independently reviewable and revertible, and ends with the regression gates in §6c.

## 5. Rules & enforcement

Canonical edits only (mirrors regenerate via sync script):

- `.cursor/rules/mms-module-architecture.mdc` — §3/§7: name controller-owned selection as the standard (list-local selection state banned); `ModuleWorkBulkActionBar` as the single bulk-bar base; `WorkBatchTable` as the mandatory desktop table.
- `.cursor/rules/mms-dry.mdc` — add anti-patterns: per-module bulk-bar bases; duplicated per-list selection hooks.
- `.cursor/rules/README.md` — update ownership matrix rows and the enforcement registry (the new check below converts "advisory — none" to enforced).
- `.agent/skills/mms-module-work/SKILL.md` — update the Work checklist to match.
- **New ratchet:** `scripts/check-work-directory.mjs` (styled on existing `scripts/check-*.mjs` gates), failing CI on:
  1. imports of `ModuleUniversalBulkActionBar` / `ModuleStandardBulkActionBar`;
  2. imports of `useWorkDirectoryController` / `ModuleWorkDirectoryShell` in feature code;
  3. CSS dual-render (`md:hidden` / `md:block` sibling branches in `*List.tsx` files);
  4. `selectedCount: 0` stubs in page controllers.
  Registered in the `lint-and-typecheck` job of `.github/workflows/ci.yml`.

After edits: `bash .agent/scripts/sync-all.sh` then `node scripts/verify-rules-integrity.mjs`. Mirrors (`.agent/rules/`, `.claude/rules/`, `.cursor/skills/`, `.claude/skills/`) are never hand-edited.

## 6. Testing & verification

### 6a. New page-level integration tests

Vitest + React Testing Library, following `ContactsPage.test.tsx` / `EnrollmentsPage.test.tsx` conventions, for the modules lacking page tests: **finance, hasanat, obligations, question-bank, sessions** (plus students customizer coverage). Each covers:

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
pnpm --filter @mms/frontend typecheck
pnpm --filter @mms/frontend test          # full suite at minimum at phase end
pnpm lint
node scripts/verify-rules-integrity.mjs   # after the rules phase
node scripts/check-work-directory.mjs     # once it lands
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
