---
description: Universal agent cognition, behaviour, output economy, security, and TypeScript standards across Cursor, Antigravity, and Claude Code
---

# MMS Agent Universal Standards

**Workflow skills:** orientation / sync → `antigravity-workspace` · PR/self-review index → `mms-code-review`. Rule→skill map → `mms-core.md` Standards index.

## Cognition

- **Plan:** Output a concise `<plan>` before structural or multi-file changes.
- **Check:** Search the workspace (especially `@mms/shared`) before writing new logic — extraction thresholds `mms-dry.md` · skill `mms-shared-package`.
- **Type-check:** Verify types against schemas and `@mms/shared` before emitting code.
- **Review:** On code edits, run completion review per `mms-completion-review.md` — skill `mms-code-review`; fix all bugs in scope before marking done.

## Behaviour

- **Focus:** Edit in-scope files only. Ask before deletions or large removals.
- **Style:** Terse, functional code. Zero boilerplate or filler comments.
- **Precision:** Prefer targeted patches — altered functions/blocks, not whole files unless requested.
- **Names:** Semantic identifiers — `mms-structure-naming.md`.
- **Rendering Hygiene:** Memoize non-trivial calculations (`useMemo`) and callback references passed to memoized components (`useCallback`) to avoid render churn; avoid premature memoization on trivial primitive expressions. Complement with React 19 `startTransition`, `useDeferredValue`, and `useEffectEvent` — `mms-performance.md`, `mms-hooks.md`.

## Communication (two modes)

| Mode | Rule |
|------|------|
| **Chat with user** | Clear structured prose; explain trade-offs when non-obvious |
| **Code output** | Lead with the change; one-line rationale only if needed |

Do not echo file contents already in context.

## Output economy

- **Edits:** `replace_file_content` / targeted writes — never full-file rewrites.
- **Tests:** Follow `mms-completion-review.md`. Pure `@mms/shared` helpers need unit tests — `mms-testing-observability.md`.
- **JSDoc:** Required on **public exports** in `packages/shared` only. Omit elsewhere.

## Security & state

- **Validation:** Zero-trust DTOs via `@mms/shared` Zod + BE `parseRequest` — `mms-core.md` Validation SSOT, `mms-form-architecture.md`.
- **State:** Prefer unidirectional flow; pure helpers for transforms — Query policy `mms-data-layer.md`.
- **Concurrency & Cancellation:** Pass `AbortSignal` into `apiFetch` / Query `queryFn`; combine signals via `AbortSignal.any()` when combining request and timeout signals; clear timers/observers — `mms-data-layer.md`, `mms-api-interface.md`.
- **Resilience:** Error boundaries on heavy sections and lazy routes — `mms-testing-observability.md`.
- **Secrets / XSS:** Never log tokens/PII; no unsanitized `dangerouslySetInnerHTML`; sanitize and encode all dynamic export contents — `mms-auth-security.md`.

## Standards

- **Node.js 24 Runtime:** Mandatory `node:` protocol imports (`node:fs/promises`, `node:crypto`, `node:path`, `node:async_hooks`), WHATWG `new URL()`, and native built-ins over 3rd-party packages — details `mms-dependencies.md`.
- **Explicit Resource Management:** Mandatory TC39 `using` / `await using` for database connection checkouts, stream handles, temporary files, and locks to ensure deterministic disposal without manual `finally` boilerplate.
- **TypeScript:** Strict mode. Use `unknown` + narrowing — never `any`. Double type assertions (`as unknown as T`) to bypass validation are strictly forbidden; validate via Zod or type predicates (`is`). Prefer `import type` and `satisfies` operator for literal/config safety without widening. Zero non-erasable syntax (`enum`, `namespace`, constructor parameter properties) for Node 24 native type stripping (`--experimental-strip-types`, TS 5.8+ / TS 7.0 `erasableSyntaxOnly`) — `mms-dependencies.md`.
- **Native Immutability:** Never mutate array state in place (`sort()`, `reverse()`, `splice()`). Use native ECMAScript non-mutating methods (`toSorted()`, `toReversed()`, `toSpliced()`, `with()`, `Object.groupBy()`).
- **Errors:** Handle explicitly; zero silent empty `catch` blocks; map to localized translation keys via `t()`.
- **A11y / HTML:** Accessible interactive controls + semantic landmarks (`<main>`, `<nav>`, `<header>`, `<section>`), minimum 44x44px touch targets — `mms-ui-ux-design.md`.
- **Git:** Conventional Commits (`feat`/`fix`/`chore`). No direct commits to `main`. **Never commit unless the user asks. Never push to any remote — the user always handles pushes.**
- **Rules:** When changing MMS standards, run `bash .agent/scripts/sync-all.sh` (see `.cursor/rules/README.md`).
  - **Always-on set is derived, not declared.** The canonical list is the rules whose `.cursor/rules/*.md` frontmatter says `alwaysApply: true`; `skills-manifest.json`, `AGENTS.md`, and `CLAUDE.md` must all agree with it. `node scripts/verify-rules-integrity.mjs` enforces this (it previously compared against a hardcoded array while never checking the docs, so `CLAUDE.md` silently listed five always-on rules when only three qualified). Run it after any rule add/remove/scope change.

## Anti-Patterns & Banned Operations

- ❌ **NEVER execute `cd` in tool commands:** Specify absolute execution `Cwd` or pass paths directly to scripts.
- ❌ **NEVER use bare unpaged commands:** Limit command output length (e.g. `git log -n 5`, `head -n 50`).
- ❌ **NEVER bypass validation with type casting:** Avoid `as unknown as T` or `any` to force type agreement.
- ❌ **NEVER delete files without confirmation:** Request explicit user approval before removing files.
- ❌ **NEVER invent new dependencies:** Check Node 24 built-ins, `@mms/shared`, and `pnpm-workspace.yaml` first.

