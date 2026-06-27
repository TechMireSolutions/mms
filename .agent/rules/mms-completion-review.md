---
trigger: always_on
---

# MMS Completion Review

After **creating or editing code**, run a completion review **before** marking the task done.

## Required steps

1. **Re-read the diff** — logic errors, wrong assumptions, missing edge cases, regressions.
2. **Fix bugs in scope** — do not leave known defects for the user to discover.
3. **Verify** (run what applies; do not skip because the change felt small):

| Scope | Command |
|-------|---------|
| Any non-trivial TS change | `pnpm typecheck` |
| Frontend touched | `cd apps/frontend && pnpm lint` |
| Shared logic / hooks with tests | `pnpm test` |

4. **Lint diagnostics** — check edited files; fix new issues you introduced.
5. **Cleanup** — remove unused imports, dead code, and debug logging in the change boundary.

## Fix before done

| Finding | Action |
|---------|--------|
| Type error | Fix and re-run typecheck |
| ESLint error | Fix in changed files |
| Failing test | Fix or revert — do not ship broken tests |
| Hardcoded copy | Add `t()` keys — `mms-settings-i18n.md` |
| Rule violation in touched code | Fix when inside the change boundary |

## Skip verification only when

- Question-only / review-only with **no** file edits
- Trivial typo in docs with no code impact

## Done means

Changed code reviewed, applicable verification run (or skip reason stated), and all fixable bugs from the review resolved — not deferred unless the user explicitly scoped them out.
