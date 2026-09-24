# Work Directory Convergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Converge the nine tenant listing modules onto one Work-directory architecture: controller-owned selection SSOT (shared `useWorkSelection`), a two-layer bulk-action chrome (presentational `ModuleWorkBulkActionBar` + single i18n/manifest adapter), retired dead code, and a CI ratchet that keeps it converged.

**Architecture:** Selection state lifts from list-local hooks into page controllers via a new shared `useWorkSelection` hook; lists become prop-driven. Bulk chrome keeps `ModuleWorkBulkActionBar` as the purely presentational dock while `ModuleUniversalBulkActionBar` absorbs `ModuleStandardBulkActionBar`'s surface (i18n key fallback reconciles the two key conventions). Dead artifacts (`ModuleStandardBulkActionBar`, `ModuleWorkDirectoryShell`, `useWorkDirectoryController`, `QuestionBankTableHeader/Row`) are deleted. A new `scripts/check-work-directory.mjs` ratchet enforces the end state in CI.

**Tech Stack:** React 19, TypeScript, Vite/Vitest (happy-dom), TanStack Query v5, react-i18next, Fastify/Drizzle (untouched), Node 24 for scripts.

**Spec:** `docs/superpowers/specs/2026-09-24-work-directory-convergence-design.md`

## Global Constraints

- Canonical rule edits only in `.cursor/rules/*.mdc` and `.agent/skills/*/SKILL.md`; mirrors regenerate via `bash .agent/scripts/sync-all.sh` and must pass `node scripts/verify-rules-integrity.mjs` — never hand-edit `.agent/rules/`, `.claude/rules/`, `.cursor/skills/`, `.claude/skills/`.
- Frontend gates per task: `pnpm --dir apps/frontend typecheck`, `pnpm --dir apps/frontend test`, `pnpm --dir apps/frontend lint`.
- Design tokens only: no raw hex, no arbitrary pixel values, BiDi logical CSS classes only; file-size ceiling 300 lines is ratcheted (`pnpm run check:code-norms` runs in pre-commit).
- Desktop tables are already `WorkBatchTable`-based (`cfa35a11`) — conformance-check, do not rewrite.
- Out-of-scope modules (accounting, attendance, examinations, users, messaging) are touched ONLY where their bulk-bar wrapper imports the retired `ModuleStandardBulkActionBar` — mechanical re-point, no behavior change.
- Commit per task. Pre-commit runs secrets + code-norm + rules-integrity checks; keep them green.
- Platform-admin and system-configuration pages remain untouched.

---

### Task 1: Unify the bulk-bar adapter (absorb Standard into Universal)

**Files:**
- Modify: `apps/frontend/src/components/ui/ModuleUniversalBulkActionBar.tsx`
- Test: `apps/frontend/src/components/ui/ModuleUniversalBulkActionBar.test.tsx`
- Modify (re-point, mechanical): `apps/frontend/src/tenant/features/obligations/components/ObligationsBulkActionBar.tsx`, `apps/frontend/src/tenant/features/hasanat/components/HasanatBulkActionBar.tsx`, `apps/frontend/src/tenant/features/question-bank/components/QuestionBankBulkActionBar.tsx`, `apps/frontend/src/tenant/features/accounting/components/AccountingBulkActionBar.tsx`, `apps/frontend/src/tenant/features/attendance/components/AttendanceBulkActionBar.tsx`, `apps/frontend/src/tenant/features/examinations/components/ExaminationsBulkActionBar.tsx`
- Delete: `apps/frontend/src/components/ui/ModuleStandardBulkActionBar.tsx`, `apps/frontend/src/components/ui/ModuleStandardBulkActionBar.test.tsx`
- Check for barrel export: `apps/frontend/src/components/ui/` index/barrel files (grep `ModuleStandardBulkActionBar` repo-wide at the end)

**Interfaces:**
- Consumes: existing `ModuleUniversalBulkActionBarProps<T>` (i18n self-service, `bulkActions` gating, `messagingTargets<T>`, status slot, permission gates).
- Produces: extended `ModuleUniversalBulkActionBarProps<T>` with added optional `exportAction?: { label: string; onClick: () => void | Promise<void> }` (Standard-compat pass-through) and dual i18n key fallback — `{ns}.selectedCount` falls back to `{ns}.trash.selected`; `{ns}.bulkRestore` falls back to `{ns}.trash.restore`. All six Standard wrappers keep working after re-point with only prop renames (`showDeleted` → `viewingDeleted`, `onRequestBulkDelete` stays, `exportAction` passes through).

- [x] **Step 1: Write the failing tests**

In `ModuleUniversalBulkActionBar.test.tsx` (existing file mocks `useTranslation` as `key:count`), add cases:

```tsx
it("falls back to trash-scoped i18n keys when primary keys are missing", () => {
  // mock t to return "" for "hasanat.selectedCount" but "hasanat.trash.selected:5" for the fallback
  const html = renderToStaticMarkup(
    <ModuleUniversalBulkActionBar
      selectedCount={5}
      viewingDeleted={false}
      canDelete
      leadingIcon={StubIcon}
      i18nNamespace="hasanat"
      onClearSelection={() => {}}
      onRequestBulkDelete={() => {}}
      onRequestBulkRestore={() => {}}
    />,
  );
  expect(html).toContain("hasanat.trash.selected:5");
});

it("renders exportAction pass-through with its explicit label", () => {
  const html = renderToStaticMarkup(
    <ModuleUniversalBulkActionBar
      {...baseProps}
      exportAction={{ label: "Export CSV", onClick: () => {} }}
    />,
  );
  expect(html).toContain("Export CSV");
});
```

- [x] **Step 2: Run tests to verify they fail**

Run: `pnpm --dir apps/frontend vitest run src/components/ui/ModuleUniversalBulkActionBar.test.tsx`
Expected: FAIL — no fallback, no `exportAction` prop.

- [x] **Step 3: Implement the adapter changes**

In `ModuleUniversalBulkActionBar.tsx`:

```tsx
// label resolution — replace single-key t() calls with i18next array fallback:
const countLabel = t(
  [`${i18nNamespace}.selectedCount`, `${i18nNamespace}.trash.selected`],
  { count: selectedCount },
);
const restoreLabelResolved = t(
  [`${i18nNamespace}.bulkRestore`, `${i18nNamespace}.trash.restore`],
);

// new prop (added to ModuleUniversalBulkActionBarProps<T>):
exportAction?: { label: string; onClick: () => void | Promise<void> };

// in the ModuleWorkBulkActionBar composition, prefer the explicit pass-through:
exportAction={
  exportAction
    ? { label: exportAction.label, onClick: exportAction.onClick }
    : canExport && onBulkExport
      ? { label: exportLabelResolved, onClick: onBulkExport }
      : undefined
}
```

(Verify `t` accepts key arrays — the app uses react-i18next, which does; if the project's `useTranslation` wrapper narrows the type, cast the array `as unknown as string` with a comment, or resolve via `i18n.exists()`.)

- [x] **Step 4: Run tests to verify they pass**

Run: `pnpm --dir apps/frontend vitest run src/components/ui/ModuleUniversalBulkActionBar.test.tsx`
Expected: PASS (old + new cases).

- [x] **Step 5: Re-point the six Standard wrappers**

For each of the six wrapper files: change the import from `@/components/ui/ModuleStandardBulkActionBar` to `@/components/ui/ModuleUniversalBulkActionBar`, rename prop `showDeleted` → `viewingDeleted`, keep `i18nNamespace` / `leadingIcon` / `bulkActions` / `extraActions` unchanged, map Standard's `exportAction` straight through to the new prop, and add the permission props Universal expects (`canWrite`, `canExport`, `canWriteMessaging`) from the wrapper's existing props or manifest where already available — default `canExport` to `true` when the wrapper previously passed `exportAction` unconditionally. Example (hasanat, the simplest):

```tsx
import { ModuleUniversalBulkActionBar } from "@/components/ui/ModuleUniversalBulkActionBar";
// ...
<ModuleUniversalBulkActionBar
  selectedCount={selectedCount}
  viewingDeleted={showDeleted}
  canDelete={canDelete}
  leadingIcon={HandCoins}
  i18nNamespace="hasanat"
  bulkActions={bulkActions}
  onClearSelection={onClearSelection}
  onRequestBulkDelete={onRequestBulkDelete}
  onRequestBulkRestore={onRequestBulkRestore}
/>
```

Note the wrappers' own public props stay identical — callers don't change.

- [x] **Step 6: Delete the retired adapter and run gates**

Delete `ModuleStandardBulkActionBar.tsx` and `ModuleStandardBulkActionBar.test.tsx`. Grep `ModuleStandardBulkActionBar` across the repo — only the spec/plan docs and the ratchet script (Task 11) may reference it.

Run: `pnpm --dir apps/frontend typecheck && pnpm --dir apps/frontend lint && pnpm --dir apps/frontend test`
Expected: all green (wrapper tests for examinations/attendance/etc. assert translated keys via their own mocks — adjust mocks only if a wrapper test pinned the old Standard key convention).

- [ ] **Step 7: Commit**

```bash
git add apps/frontend/src/components/ui/ModuleUniversalBulkActionBar.tsx \
        apps/frontend/src/components/ui/ModuleUniversalBulkActionBar.test.tsx \
        apps/frontend/src/tenant/features/*/components/*BulkActionBar.tsx
git rm apps/frontend/src/components/ui/ModuleStandardBulkActionBar.tsx \
       apps/frontend/src/components/ui/ModuleStandardBulkActionBar.test.tsx
git commit -m "refactor(ui): unify bulk-action adapter — absorb Standard into Universal"
```

---

### Task 2: Retire `ModuleWorkDirectoryShell` and `useWorkDirectoryController`

**Files:**
- Delete: `apps/frontend/src/components/ui/ModuleWorkDirectoryShell.tsx`, `apps/frontend/src/components/ui/ModuleWorkDirectoryShell.test.tsx`, `apps/frontend/src/hooks/useWorkDirectoryController.ts`, `apps/frontend/src/hooks/useWorkDirectoryController.test.tsx`
- Modify: `apps/frontend/src/components/common/work/index.ts` (drop barrel re-exports at lines 32–35 and 38–41)
- Modify (comment-only): `apps/frontend/src/tenant/features/accounting/components/journalEntriesControllerFilters.ts:34`, `apps/frontend/src/hooks/useWorkCardAction.ts:66`

**Interfaces:**
- Consumes: nothing (zero feature importers — verified by grep).
- Produces: nothing; `components/common/work` barrel no longer exports `ModuleWorkDirectoryShell`, `ModuleWorkDirectoryShellProps`, `ModuleWorkDirectoryShellConfirmDialogsProps`, `useWorkDirectoryController`, `UseWorkDirectoryControllerOptions`, `PendingDeleteState`.

- [x] **Step 1: Confirm zero importers**

Run: `grep -rn "ModuleWorkDirectoryShell\|useWorkDirectoryController" apps/frontend/src --include="*.ts" --include="*.tsx" | grep -v ".test." | grep -v "common/work/index.ts"`
Expected: only the two comment mentions listed above.

- [x] **Step 2: Delete files, drop barrel exports, fix comments**

Remove the two export blocks in `apps/frontend/src/components/common/work/index.ts`. Update the accounting comment to `/** Mirrors the repo's directory controllers (contacts/students pattern). */` and the `useWorkCardAction.ts` comment to reference `@/hooks/useWorkSelection` (created in Task 3 — if doing Task 2 first, leave the comment generic: "the module's controller-owned selection").

- [x] **Step 3: Run gates**

Run: `pnpm --dir apps/frontend typecheck && pnpm --dir apps/frontend test && pnpm --dir apps/frontend lint`
Expected: green.

- [ ] **Step 4: Commit**

```bash
git rm apps/frontend/src/components/ui/ModuleWorkDirectoryShell.tsx \
       apps/frontend/src/components/ui/ModuleWorkDirectoryShell.test.tsx \
       apps/frontend/src/hooks/useWorkDirectoryController.ts \
       apps/frontend/src/hooks/useWorkDirectoryController.test.tsx
git add apps/frontend/src/components/common/work/index.ts \
        apps/frontend/src/tenant/features/accounting/components/journalEntriesControllerFilters.ts \
        apps/frontend/src/hooks/useWorkCardAction.ts
git commit -m "refactor(ui): retire unused ModuleWorkDirectoryShell and useWorkDirectoryController"
```

---

### Task 3: Shared `useWorkSelection` hook

**Files:**
- Create: `apps/frontend/src/hooks/useWorkSelection.ts`
- Test: `apps/frontend/src/hooks/useWorkSelection.test.ts`

**Interfaces:**
- Consumes: nothing (React only). Deliberately does NOT consume `@/lib/directorySelection` helpers — those take `(string|number)[]` and power the contacts pattern; this hook matches the checked/unchecked semantics of the four retiring list-local hooks so list call-sites change minimally.
- Produces:

```ts
export function useWorkSelection<T extends string | number = string>(): {
  selectedIds: T[];
  setSelectedIds: Dispatch<SetStateAction<T[]>>;
  toggleSelected: (id: T, checked: boolean) => void;
  toggleSelectAll: (checked: boolean, visibleIds: T[]) => void;
  clearSelection: () => void;
};
```

Used by page controllers (Tasks 4–7). Lists receive `selectedIds` + callbacks as props and derive `allVisibleSelected` / `someVisibleSelected` from their visible rows.

- [x] **Step 1: Write the failing test**

```ts
// apps/frontend/src/hooks/useWorkSelection.test.ts
import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useWorkSelection } from "./useWorkSelection";

describe("useWorkSelection", () => {
  it("toggles a single id on and off", () => {
    const { result } = renderHook(() => useWorkSelection<string>());
    act(() => result.current.toggleSelected("a", true));
    expect(result.current.selectedIds).toEqual(["a"]);
    act(() => result.current.toggleSelected("a", true)); // idempotent
    expect(result.current.selectedIds).toEqual(["a"]);
    act(() => result.current.toggleSelected("a", false));
    expect(result.current.selectedIds).toEqual([]);
  });

  it("select-all adds visible ids and keeps selections from other pages", () => {
    const { result } = renderHook(() => useWorkSelection<string>());
    act(() => result.current.toggleSelected("other-page", true));
    act(() => result.current.toggleSelectAll(true, ["a", "b"]));
    expect(result.current.selectedIds).toEqual(["other-page", "a", "b"]);
    act(() => result.current.toggleSelectAll(false, ["a", "b"]));
    expect(result.current.selectedIds).toEqual(["other-page"]);
  });

  it("clearSelection empties and returns a stable reference", () => {
    const { result, rerender } = renderHook(() => useWorkSelection<string>());
    const first = result.current.clearSelection;
    act(() => result.current.toggleSelected("a", true));
    rerender();
    expect(result.current.clearSelection).toBe(first);
    act(() => result.current.clearSelection());
    expect(result.current.selectedIds).toEqual([]);
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `pnpm --dir apps/frontend vitest run src/hooks/useWorkSelection.test.ts`
Expected: FAIL — module not found.

- [x] **Step 3: Implement the hook**

```ts
// apps/frontend/src/hooks/useWorkSelection.ts
import { useCallback, useState, type Dispatch, type SetStateAction } from "react";

/**
 * Controller-owned Work directory row selection SSOT.
 * Lists supply their visible ids for select-all and derive
 * all/some-visible flags from the returned selectedIds.
 */
export function useWorkSelection<T extends string | number = string>() {
  const [selectedIds, setSelectedIds] = useState<T[]>([]);

  const toggleSelected = useCallback((id: T, checked: boolean) => {
    setSelectedIds((current) =>
      checked
        ? current.includes(id)
          ? current
          : [...current, id]
        : current.filter((selectedId) => selectedId !== id),
    );
  }, []);

  const toggleSelectAll = useCallback((checked: boolean, visibleIds: T[]) => {
    setSelectedIds((current) => {
      const visibleSet = new Set(visibleIds);
      return checked
        ? [...new Set([...current, ...visibleIds])]
        : current.filter((id) => !visibleSet.has(id));
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds((current) => (current.length === 0 ? current : []));
  }, []);

  return { selectedIds, setSelectedIds, toggleSelected, toggleSelectAll, clearSelection };
}

export type WorkSelection<T extends string | number = string> = ReturnType<
  typeof useWorkSelection<T>
>;
export type { Dispatch, SetStateAction };
```

- [x] **Step 4: Run test to verify it passes**

Run: `pnpm --dir apps/frontend vitest run src/hooks/useWorkSelection.test.ts`
Expected: PASS (3 cases).

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/hooks/useWorkSelection.ts apps/frontend/src/hooks/useWorkSelection.test.ts
git commit -m "feat(hooks): add shared useWorkSelection for controller-owned directory selection"
```

---

### Task 4: Finance pilot — lift selection into `useFinancePageController`

**Files:**
- Modify: `apps/frontend/src/tenant/features/finance/hooks/useFinancePageController.ts`
- Test: `apps/frontend/src/tenant/features/finance/hooks/useFinancePageController.test.tsx` (create)
- Modify: `apps/frontend/src/tenant/features/finance/FinancePage.tsx` (remove `selectionResetKey` at lines 158 & 184; pass selection props)
- Modify: `apps/frontend/src/tenant/features/finance/components/InvoicesList.tsx` (remove hook at lines 90–98, reset effect at 100, duplicate closure at 119–123; accept props)
- Modify: `apps/frontend/src/tenant/features/finance/components/PaymentsList.tsx` (remove `useState` at 56, reset effect at 59, inline toggles at 114–115; accept props)
- Delete: `apps/frontend/src/tenant/features/finance/hooks/useInvoiceSelection.ts`

**Interfaces:**
- Consumes: `useWorkSelection` from `@/hooks/useWorkSelection` (Task 3).
- Produces (new on `FinancePageController`):

```ts
invoiceSelection: WorkSelection<string>;   // { selectedIds, setSelectedIds, toggleSelected, toggleSelectAll, clearSelection }
paymentSelection: WorkSelection<string>;
```

New props on `InvoicesListProps` (replacing `selectionResetKey`):
`selectedIds: string[]; onToggleSelectedInvoice: (id: string, checked: boolean) => void; onToggleSelectAll: (checked: boolean, visibleIds: string[]) => void; onClearSelection: () => void;`
New props on `PaymentsListProps`: same four, named `selectedIds / onTogglePayment / onToggleSelectAll / onClearSelection`.

- [x] **Step 1: Write the failing controller test**

The controller file's imports name its api/query dependencies — mock those modules with `vi.mock` using the exact import paths from the top of `useFinancePageController.ts` (e.g. `@/tenant/features/finance/hooks/useFinanceApi` providing `useFinanceInvoicesPaginated` / `useFinancePaymentsPaginated`, plus `useTrashMode`, column-layout hooks, and mutation hooks; each mocked to return inert defaults: empty arrays, `mutateAsync: vi.fn()`, `refetch: vi.fn()`).

```tsx
// apps/frontend/src/tenant/features/finance/hooks/useFinancePageController.test.tsx
import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
// vi.mock(...) blocks mirroring the controller's imports — see note above
import { useFinancePageController } from "./useFinancePageController";

describe("useFinancePageController selection", () => {
  it("owns invoice selection and clears it on sub-tab switch", () => {
    const { result } = renderHook(() => useFinancePageController());
    act(() => result.current.invoiceSelection.toggleSelected("INV-1", true));
    expect(result.current.invoiceSelection.selectedIds).toEqual(["INV-1"]);
    act(() => result.current.setActiveSubTab("payments"));
    expect(result.current.invoiceSelection.selectedIds).toEqual([]);
  });

  it("clears both selections on trash toggle", () => {
    const { result } = renderHook(() => useFinancePageController());
    act(() => {
      result.current.invoiceSelection.toggleSelected("INV-1", true);
      result.current.paymentSelection.toggleSelected("PAY-1", true);
    });
    act(() => result.current.setShowDeleted(true)); // or the controller's trash toggle API
    expect(result.current.invoiceSelection.selectedIds).toEqual([]);
    expect(result.current.paymentSelection.selectedIds).toEqual([]);
  });

  it("exposes a real selectedCount to module shortcuts (no stub)", () => {
    const { result } = renderHook(() => useFinancePageController());
    expect(result.current.invoiceSelection.selectedIds).toEqual([]);
    act(() => result.current.paymentSelection.toggleSelectAll(true, ["PAY-1", "PAY-2"]));
    expect(result.current.paymentSelection.selectedIds).toHaveLength(2);
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `pnpm --dir apps/frontend vitest run src/tenant/features/finance/hooks/useFinancePageController.test.tsx`
Expected: FAIL — `invoiceSelection` is not defined on the controller.

- [x] **Step 3: Implement the lift**

In `useFinancePageController.ts`:

```ts
import { useWorkSelection } from "@/hooks/useWorkSelection";
// ...
const invoiceSelection = useWorkSelection<string>();
const paymentSelection = useWorkSelection<string>();

// reset policy — identical to the old `${activeSubTab}:${showDeleted}` reset key:
const { clearSelection: clearInvoiceSelection } = invoiceSelection;
const { clearSelection: clearPaymentSelection } = paymentSelection;
useEffect(() => {
  clearInvoiceSelection();
  clearPaymentSelection();
}, [activeSubTab, showDeleted, clearInvoiceSelection, clearPaymentSelection]);
```

Wire the existing `useModuleShortcuts` block (lines 77–81) so its `clearSelection` calls both clear functions, and its `selectedCount` is `invoiceSelection.selectedIds.length + paymentSelection.selectedIds.length`. After successful `bulkDeleteInvoices` / `bulkRestoreInvoices` / `bulkDeletePayments` / `bulkRestorePayments` (`handleBulkResult`), clear the corresponding selection (mirrors `useContactsPageDeleteActions`). Return `invoiceSelection` and `paymentSelection`.

- [x] **Step 4: Convert the lists to props**

`InvoicesList.tsx`: delete the `useInvoiceSelection` import/call, the reset `useEffect`, and the duplicate `toggleSelected` closure. Add the four new props; derive visibility flags where the hook previously did:

```tsx
const selectedSet = new Set(selectedIds);
const allVisibleSelected = filtered.length > 0 && filtered.every((inv) => selectedSet.has(inv.id));
const someVisibleSelected = selectedSet.size > 0 && filtered.some((inv) => selectedSet.has(inv.id));
```

Pass `onToggleSelectAll(checked, filtered.map((inv) => inv.id))` where the old `toggleSelectAll(checked)` was called; pass `onToggleSelectedInvoice` straight through to `InvoicesListContent` (its `InvoicesListContentProps` in `invoicesListShared.ts` already declare these shapes — update that interface only if names differ). `FinanceBulkActionBar`'s `selectedCount={selectedIds.length}` and `onClearSelection={onClearSelection}` now read from props. `onBulkPrintReceipts` still resolves against `filtered`. Remove `selectionResetKey` from `InvoicesListProps`.

`PaymentsList.tsx`: same surgery — replace `useState` with the four props, derive `allSelected` from `payments` + `selectedIds`, remove `selectionResetKey` from `PaymentsListProps`.

- [x] **Step 5: Convert the page and delete the old hook**

`FinancePage.tsx`: delete both `selectionResetKey={...}` props; pass `selectedIds={c.invoiceSelection.selectedIds}`, `onToggleSelectedInvoice={c.invoiceSelection.toggleSelected}`, `onToggleSelectAll={c.invoiceSelection.toggleSelectAll}`, `onClearSelection={c.invoiceSelection.clearSelection}` into `InvoicesList`, and the payment equivalents into `PaymentsList`. Delete `useInvoiceSelection.ts`. Grep `selectionResetKey` and `useInvoiceSelection` — expect zero hits outside docs.

- [x] **Step 6: Run gates**

Run: `pnpm --dir apps/frontend vitest run src/tenant/features/finance && pnpm --dir apps/frontend typecheck && pnpm --dir apps/frontend lint`
Expected: PASS. The prop-driven card tests (`InvoicesListCards.test.tsx`, `PaymentsListCards.test.tsx`) are unaffected.

- [ ] **Step 7: Commit**

```bash
git add apps/frontend/src/tenant/features/finance
git rm apps/frontend/src/tenant/features/finance/hooks/useInvoiceSelection.ts
git commit -m "refactor(finance): lift row selection into page controller via useWorkSelection"
```

---

### Task 5: Hasanat — lift selection into `useHasanatCardsPageController`

**Files:**
- Modify: `apps/frontend/src/tenant/features/hasanat/hooks/useHasanatCardsPageController.ts` (stub at lines 128–142)
- Test: `apps/frontend/src/tenant/features/hasanat/hooks/useHasanatCardsPageController.test.tsx` (create)
- Modify: `apps/frontend/src/tenant/features/hasanat/components/DistributionsList.tsx` (hook at 112, reset effect at 114–116, props interface at 17–38)
- Modify: `apps/frontend/src/tenant/features/hasanat/components/HasanatWorkTier.tsx` (thread selection props)
- Modify: `apps/frontend/src/tenant/features/hasanat/HasanatCardsPage.tsx` (pass controller selection to work tier)
- Delete: `apps/frontend/src/tenant/features/hasanat/hooks/useDistributionSelection.ts`

**Interfaces:**
- Consumes: `useWorkSelection` (Task 3).
- Produces: `distributionSelection: WorkSelection<string>` on the controller return. New `DistributionsListProps` entries: `selectedIds: string[]; onToggleSelectedDistribution: (id: string, checked: boolean) => void; onToggleSelectAll: (checked: boolean, visibleIds: string[]) => void; onClearSelection: () => void;` (`distributionsListShared.ts` content props already use these names — unchanged).

- [x] **Step 1: Write the failing controller test**

Create the test file mocking the controller's api hook imports (exact paths from the file header — `useHasanatApi` family) with inert defaults, then:

```tsx
it("owns distribution selection and wires real values into shortcuts", () => {
  const { result } = renderHook(() => useHasanatCardsPageController());
  act(() => result.current.distributionSelection.toggleSelected("dist-1", true));
  expect(result.current.distributionSelection.selectedIds).toEqual(["dist-1"]);
  act(() => result.current.setShowDeleted(true));
  expect(result.current.distributionSelection.selectedIds).toEqual([]);
});

it("select-all keeps ids outside the visible page", () => {
  const { result } = renderHook(() => useHasanatCardsPageController());
  act(() => result.current.distributionSelection.toggleSelected("other", true));
  act(() => result.current.distributionSelection.toggleSelectAll(true, ["a", "b"]));
  expect(result.current.distributionSelection.selectedIds).toEqual(["other", "a", "b"]);
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `pnpm --dir apps/frontend vitest run src/tenant/features/hasanat/hooks/useHasanatCardsPageController.test.tsx`
Expected: FAIL — `distributionSelection` undefined.

- [x] **Step 3: Implement the lift**

In the controller: `const distributionSelection = useWorkSelection<string>();` plus a reset effect on `[showDeleted]` (the list previously reset on `[showDeleted, listPage, search, filterStatus]` — paging/search/filter are list-local, so the list keeps a slimmer reset effect calling `onClearSelection` on `[listPage, search, filterStatus]`; the controller owns the trash-toggle reset). Replace the `useModuleShortcuts` stub values: `selectedCount: distributionSelection.selectedIds.length`, `clearSelection: distributionSelection.clearSelection`. Clear selection after `handleBulkDelete` / `handleBulkRestore`. Return `distributionSelection`.

In `DistributionsList.tsx`: remove the `useDistributionSelection` call; take the four new props; derive `allVisibleSelected` / `someVisibleSelected` from `pageDistributions` + `selectedIds`; call `onToggleSelectAll(checked, pageDistributions.map((d) => d.id))`; keep the list-local reset effect but call `onClearSelection()` instead of `setSelectedIds([])`; `HasanatBulkActionBar` and `HasanatTrashDialogs` keep reading `selectedIds.length` — now from props.

Thread through `HasanatWorkTier.tsx` and `HasanatCardsPage.tsx` (`c.distributionSelection.*`).

- [x] **Step 4: Delete the old hook, run gates, commit**

Delete `useDistributionSelection.ts`; grep for it (zero hits). Run: `pnpm --dir apps/frontend vitest run src/tenant/features/hasanat && pnpm --dir apps/frontend typecheck && pnpm --dir apps/frontend lint` — expect green (`DistributionsListCards.test.tsx` and `HasanatTrashDialogs.test.tsx` are prop-driven, unaffected).

```bash
git add apps/frontend/src/tenant/features/hasanat
git rm apps/frontend/src/tenant/features/hasanat/hooks/useDistributionSelection.ts
git commit -m "refactor(hasanat): lift distribution selection into page controller"
```

---

### Task 6: Obligations — lift selection + `ModuleTierMotion` swap

**Files:**
- Modify: `apps/frontend/src/tenant/features/obligations/hooks/useObligationsPageController.ts` (stub at lines 118–131)
- Modify & move: `apps/frontend/src/tenant/features/obligations/hooks/useObligationSelection.test.ts` → assertions merged into new `useObligationsPageController.test.tsx`
- Modify: `apps/frontend/src/tenant/features/obligations/components/ObligationCollectionsList.tsx` (hook at 167–174, reset effect at 176–178, props at 23–44)
- Modify: `apps/frontend/src/tenant/features/obligations/components/ObligationsWorkTier.tsx` (thread selection)
- Modify: `apps/frontend/src/tenant/features/obligations/ObligationsPage.tsx` (pass selection; swap `motion.div` at lines 54–62 & 114 for `ModuleTierMotion`; drop `motion` import at line 2)
- Delete: `apps/frontend/src/tenant/features/obligations/hooks/useObligationSelection.ts`, `apps/frontend/src/tenant/features/obligations/hooks/useObligationSelection.test.ts`

**Interfaces:**
- Consumes: `useWorkSelection` (Task 3); `ModuleTierMotion` from `@/components/ui/ModuleTierMotion`.
- Produces: `collectionSelection: WorkSelection<string>` on the controller. New `ObligationCollectionListProps` entries: `selectedIds / onToggleSelectedCollection / onToggleSelectAll(checked, visibleIds) / onClearSelection` (content props in `obligationCollectionListContentShared.ts` already match these names).

- [x] **Step 1: Write the failing controller test (migrating the old hook test's assertions)**

Create `useObligationsPageController.test.tsx` mocking the controller's api imports (paths from the file header). Port the old test's three assertions — toggle semantics, select-all keeping other-page ids, stable `clearSelection` reference — against `result.current.collectionSelection`, plus a new case: selection clears on `setShowDeleted(true)` and `useModuleShortcuts` receives the real count (assert indirectly: `collectionSelection.selectedIds` is the same array the shortcuts closure reads — verified by the stub-removal grep in Step 4).

- [x] **Step 2: Run test to verify it fails**

Run: `pnpm --dir apps/frontend vitest run src/tenant/features/obligations/hooks/useObligationsPageController.test.tsx`
Expected: FAIL — `collectionSelection` undefined.

- [x] **Step 3: Implement the lift and the motion swap**

Controller: `const collectionSelection = useWorkSelection<string>();`; reset effect on `[showDeleted]`; real `selectedCount` / `clearSelection` in the `useModuleShortcuts` call; clear after `handleBulkDelete` / `handleBulkRestore`; return `collectionSelection`.

`ObligationCollectionsList.tsx`: props in, hook out; derive flags from `filtered` + `selectedIds`; the list keeps filtering/search local, so keep a reset effect on its search/type-filter state calling `onClearSelection()`.

`ObligationsPage.tsx` motion swap (prop-for-prop identical):

```tsx
<AnimatePresence mode="wait">
  <ModuleTierMotion
    tier={c.effectiveTab + '-' + (c.effectiveTab === 'setup' ? c.effectiveConfigTab : String(c.showDeleted))}
    className="space-y-4"
  >
    {/* ...unchanged children... */}
  </ModuleTierMotion>
</AnimatePresence>
```

Remove `motion` from the `framer-motion` import (keep `AnimatePresence`); add `import { ModuleTierMotion } from "@/components/ui/ModuleTierMotion";`.

- [x] **Step 4: Delete the old hook + its test, run gates, commit**

Grep `useObligationSelection` — zero hits outside docs. Run: `pnpm --dir apps/frontend vitest run src/tenant/features/obligations && pnpm --dir apps/frontend typecheck && pnpm --dir apps/frontend lint` — expect green.

```bash
git add apps/frontend/src/tenant/features/obligations
git rm apps/frontend/src/tenant/features/obligations/hooks/useObligationSelection.ts \
       apps/frontend/src/tenant/features/obligations/hooks/useObligationSelection.test.ts
git commit -m "refactor(obligations): lift selection into controller; use ModuleTierMotion"
```

---

### Task 7: Question Bank — lift selection + delete dead table files

**Files:**
- Modify: `apps/frontend/src/tenant/features/question-bank/hooks/useQuestionBankPageController.ts` (stub at lines 140–150)
- Test: `apps/frontend/src/tenant/features/question-bank/hooks/useQuestionBankPageController.test.tsx` (create)
- Modify: `apps/frontend/src/tenant/features/question-bank/components/QuestionBank.tsx` (hook at 91–99, reset effect at 104–106, props at 23–45)
- Modify: `apps/frontend/src/tenant/features/question-bank/components/QuestionBankWorkTier.tsx` (thread selection)
- Modify: `apps/frontend/src/tenant/features/question-bank/QuestionBankPage.tsx` (pass selection)
- Delete: `apps/frontend/src/tenant/features/question-bank/hooks/useQuestionBankSelection.ts`, `apps/frontend/src/tenant/features/question-bank/components/QuestionBankTableHeader.tsx`, `apps/frontend/src/tenant/features/question-bank/components/QuestionBankTableRow.tsx`

**Interfaces:**
- Consumes: `useWorkSelection` (Task 3).
- Produces: `questionSelection: WorkSelection<string>` on the controller. New `QuestionBank` (QuestionsPanel) props: `selectedIds / onToggleSelectedQuestion / onToggleSelectAll(checked, visibleIds) / onClearSelection` (`QuestionsListProps` already matches).

- [x] **Step 1: Write the failing controller test**

Same shape as Task 5 Step 1: mock the controller's api imports, assert `questionSelection` toggle/select-all semantics and trash-toggle reset. The shortcuts stub is enabled only when `effectiveTab === 'work' && effectiveSubTab === 'questions'` — keep that guard; only the values become real.

- [x] **Step 2: Run test to verify it fails**

Run: `pnpm --dir apps/frontend vitest run src/tenant/features/question-bank/hooks/useQuestionBankPageController.test.tsx`
Expected: FAIL — `questionSelection` undefined.

- [x] **Step 3: Implement the lift**

Controller: `const questionSelection = useWorkSelection<string>();`; reset effect on `[showDeleted]`; real `selectedCount` / `clearSelection` in `useModuleShortcuts`; clear after `handleBulkDelete` / `handleBulkRestore`; return `questionSelection`.

`QuestionBank.tsx`: props in, hook out; derive flags from `pageQuestions` + `selectedIds`; list keeps its reset effect on `[listPage, search, filterCats, filterDiff]` calling `onClearSelection()`; `QuestionBankBulkActionBar` / `QuestionBankTrashDialogs` read `selectedIds.length` from props. Thread through `QuestionBankWorkTier.tsx` and `QuestionBankPage.tsx`.

- [x] **Step 4: Delete dead files, run gates, commit**

Delete the three files (the two table files have zero importers — confirm by grep first). Run: `pnpm --dir apps/frontend vitest run src/tenant/features/question-bank && pnpm --dir apps/frontend typecheck && pnpm --dir apps/frontend lint` — expect green.

```bash
git add apps/frontend/src/tenant/features/question-bank
git rm apps/frontend/src/tenant/features/question-bank/hooks/useQuestionBankSelection.ts \
       apps/frontend/src/tenant/features/question-bank/components/QuestionBankTableHeader.tsx \
       apps/frontend/src/tenant/features/question-bank/components/QuestionBankTableRow.tsx
git commit -m "refactor(question-bank): lift selection into controller; drop dead table components"
```

---
