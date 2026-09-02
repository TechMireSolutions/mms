---
description: Mandatory self-review after code edits — verify, fix bugs, then mark done
---

# MMS Completion Review

After **creating or editing code**, run a completion review **before** marking the task done.

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
| Shell / layout / touch / RTL / tables | Spot-check 375 / 768 / 1440; run responsive specs named in `mms-ui-ux-design.md` §7 when AppLayout, PlatformPageShell, toast layer, or shared table/button primitives change |
| AppLayout / FormModal / Table primitives | Note or run a11y axe smoke from `mms-testing-observability.md` (serious/critical) |

4. **Lint diagnostics** — check edited files; fix new issues you introduced.
5. **Cleanup** — remove unused imports, dead code, and debug logging in the change boundary.
6. **Standards edits** — if you changed `.cursor/rules` or `.agent/skills`, run `bash .agent/scripts/sync-all.sh`.

## Fix before done

| Finding | Action |
|---------|--------|
| Type error | Fix and re-run typecheck |
| ESLint error | Fix in changed files |
| Failing test | Fix or revert — do not ship broken tests |
| Weak assertion in tests | Replace `toBeTruthy()` / `toBeFalsy()` / generic `toBeDefined()` with strict type, regex (`/^\d{4}-\d{2}-\d{2}T/`), or DOM instance (`toBeInstanceOf(...)`) — `mms-testing-observability.md` §1 |
| DB skip latch (`isDbAvailable`) | Replace with in-memory repository mock fixture (`vi.hoisted()`) — `mms-testing-observability.md` §1 |
| Unspied error logs in tests | Spy on `console.error` / `console.warn` during negative tests for silent test output |
| Hardcoded copy | Add `t()` keys — `mms-settings-i18n.md` (ban `t(key) \|\| 'English'`) |
| Work `ErrorState` title-only | Add hint description (`loadFailedHint` pattern) — `mms-module-architecture.md` §7 |
| Manifest `directoryViews: list` with table\|cards UI | Align to `['table','cards']` — `mms-module-architecture.md` §3 |
| Touched file still ≫300 lines with a clean seam | Split by concern behind a stable barrel — `mms-structure-naming.md` |
| Cross-feature import added | Route through `@/tenant/hooks/collections/*` facade or extract to `components/ui` / `lib/` / `@mms/shared` — the FE boundary lint fails otherwise — `mms-dry.md` |
| Banned Node 24 package introduced | Replace with native built-in (`--env-file`, `fetch`, `glob`, `crypto.hash`, `URLPattern`) — `mms-dependencies.md` |
| Unprefixed core module import | Prefix with `node:` (`node:fs`, `node:crypto`, `node:path`, `node:async_hooks`) — `mms-structure-naming.md` |
| Deprecated Node API (`url.parse()`) | Replace with WHATWG `new URL()` — `mms-structure-naming.md` |
| Rule violation in touched code | Fix when inside the change boundary |

## Skip verification only when

- Question-only / review-only with **no** file edits
- Trivial typo in docs with no code impact

## Done means

Changed code reviewed, applicable verification run (or skip reason stated), and all fixable bugs from the review resolved — not deferred unless the user explicitly scoped them out.
