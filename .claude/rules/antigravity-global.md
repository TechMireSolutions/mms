---
description: Antigravity agent cognition, behaviour, output economy, security, and TS standards
---

# Antigravity Global Rules

**Workflow skills:** orientation / sync → `antigravity-workspace` · PR/self-review index → `mms-code-review`. Rule→skill map → `mms-core.md` Standards index.

## Cognition

- **Plan:** Output a concise `<plan>` before structural or multi-file changes.
- **Check:** Search the workspace (especially `@mms/shared`) before writing new logic — extraction thresholds `mms-dry.md` · skill `mms-shared-package`.
- **Type-check:** Verify types against schemas and `@mms/shared` before emitting code.
- **Review:** On code edits, completion review per `mms-completion-review.md` — skill `mms-code-review`; fix bugs before done.

## Behaviour

- **Focus:** Edit in-scope files only. Ask before deletions or large removals.
- **Style:** Terse, functional code. No boilerplate or filler comments.
- **Precision:** Prefer targeted patches — altered functions/blocks, not whole files unless requested.
- **Names:** Semantic identifiers — `mms-structure-naming.md`.
- **Memo hygiene (Compiler-ready):** Do not add `useMemo` / `useCallback` / `React.memo` by default — React Compiler is not enabled yet. Prefer `startTransition`, `useDeferredValue`, and `useEffectEvent` when appropriate — `mms-hooks.md`, `mms-dependencies.md`.

## Communication (two modes)

| Mode | Rule |
|------|------|
| **Chat with user** | Clear structured prose; explain trade-offs when non-obvious |
| **Code output** | Lead with the change; one-line rationale only if needed |

Do not echo file contents already in context.

## Output economy

- **Edits:** `replace_file_content` / targeted writes — not full-file rewrites.
- **Tests:** Follow `mms-completion-review.md`. Pure `@mms/shared` helpers need unit tests — `mms-testing-observability.md`.
- **JSDoc:** Required on **public exports** in `packages/shared` only. Omit elsewhere.

## Security & state

- **Validation:** Zero-trust DTOs via `@mms/shared` Zod + BE `parseRequest` — `mms-core.md` Validation SSOT, `mms-form-architecture.md`.
- **State:** Prefer unidirectional flow; pure helpers for transforms — Query policy `mms-data-layer.md`.
- **Concurrency & Cancellation:** Pass `AbortSignal` into `apiFetch` / Query `queryFn`; combine signals via `AbortSignal.any()` when combining request and timeout signals; clear timers/observers — `mms-data-layer.md`, `mms-api-interface.md`.
- **Resilience:** Error boundaries on heavy sections and lazy routes — `mms-testing-observability.md`.
- **Secrets / XSS:** Never log tokens/PII; no unsanitized `dangerouslySetInnerHTML`; sanitize and encode all dynamic export contents — `mms-auth-security.md`.

## Standards

- **TypeScript:** Strict mode. Use `unknown` + narrowing — never `any`. Prefer `import type` and `satisfies` operator for literal/config safety without widening. Dedicated-PR targets (`noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `erasableSyntaxOnly` on TS 5.8+) → `mms-dependencies.md`.
- **Errors:** Handle explicitly; zero silent empty `catch` blocks; map to localized translation keys via `t()`.
- **A11y / HTML:** Accessible interactive controls + semantic landmarks (`<main>`, `<nav>`, `<header>`, `<section>`), minimum 44x44px touch targets — `mms-ui-ux-design.md`.
- **Git:** Conventional Commits (`feat`/`fix`/`chore`). No direct commits to `main`. **Never commit unless the user asks. Never push to any remote — the user always handles pushes.**
- **Rules:** When changing MMS standards, run `bash .agent/scripts/sync-all.sh` (see `.cursor/rules/README.md`).
