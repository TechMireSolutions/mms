---
description: Mandatory self-review after code edits — verify, fix bugs, then mark done
---

# MMS Completion Review

After **creating or editing code**, run a completion review **before** marking the task done.

The **change boundary** is: the files you edited, plus the files that must change with them to stay correct (a DTO and its consumer, a schema and its migration, a rule and its mirror, a test for new behaviour). It does **not** include pre-existing violations elsewhere in those files: fix them when they sit inside the code you touched, and record them as debt (skill `mms-migration-fixes`) when the fix is a separate concern. Never widen a change into an unrelated refactor to satisfy a rule — and never report a task done while leaving a bug you introduced inside the boundary.

**Workflow skills:** checklist index → `mms-code-review` · shell/primitive a11y → `mms-a11y-smoke` · standards sync → `antigravity-workspace`.

## Required steps

1. **Re-read the diff** — logic errors, wrong assumptions, missing edge cases, regressions.
2. **Fix bugs in scope** — do not leave known defects for the user to discover.
3. **Verify** (run what applies; do not skip because the change felt small):

| Scope | Command |
|-------|---------|
| Any non-trivial TS change | `pnpm typecheck` |
| Frontend touched | `cd apps/frontend && pnpm lint` |
| Backend touched | `cd apps/backend && pnpm lint` |
| Shared / hooks / API tests | `pnpm test` (or scoped Vitest path) |
| Auth / tenant / RLS / RBAC touched | Relevant backend `inject()` allow+deny test — or state skip reason |
| New `t()` keys | Add to `appTranslationsEn.ts` then ar/ur/fa packs |
| Shell / layout / touch / RTL / tables | Spot-check 375 / 768 / 1440; run responsive specs named in `mms-ui-ux-design.md` §4 when AppLayout, PlatformPageShell, toast layer, or shared table/button primitives change |
| AppLayout / FormModal / Table primitives | Note or run a11y axe smoke from `mms-testing-observability.md` (serious/critical) |
| Performance refactors | Document baseline bottleneck & quantified resource saved (CPU/RAM/DB/Bundle) — `mms-performance.md` |

4. **Lint diagnostics** — check edited files; fix new issues you introduced.
5. **Cleanup** — remove unused imports, dead code, and debug logging in the change boundary.
6. **Standards edits** — if you changed `.cursor/rules` or `.agent/skills`, run `bash .agent/scripts/sync-all.sh`.

## Fix before done

The per-finding remedies (weak assertions, skip latches, missing partial indexes, wildcard queries, unused `node:` imports, cross-feature imports, and ~20 more) are a lookup table, not a per-task norm: **skill `mms-code-review`, `references/fix-before-done.md`**.

Rule of thumb while finishing: **fix everything you introduced or touched inside the change boundary, and name anything you deliberately left** — never report a task done while a bug you introduced is still there.

Review criteria (reviewable size, elevated-scrutiny areas, evidence expectations) → same reference file, §Review criteria.

## Skip verification only when

- Question-only / review-only with **no** file edits
- Trivial typo in docs with no code impact

## Done means

Changed code reviewed, applicable verification run (or skip reason stated), and all fixable bugs from the review resolved — not deferred unless the user explicitly scoped them out.
