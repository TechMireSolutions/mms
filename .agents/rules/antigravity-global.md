---
trigger: always_on
---

# Antigravity Global Rules

## Cognition

- **Plan:** Output a concise `<plan>` before structural or multi-file changes.
- **Check:** Search the workspace (especially `@mms/shared`) before writing new logic.
- **Type-check:** Verify types against schemas and `@mms/shared` before emitting code.
- **Review:** On code edits, completion review per `mms-completion-review.md` — fix bugs before done.

## Behaviour

- **Focus:** Edit in-scope files only. Ask before deletions or large removals.
- **Style:** Terse, functional code. No boilerplate or filler comments.
- **Precision:** Prefer targeted patches — altered functions/blocks, not whole files unless requested.
- **Names:** Semantic identifiers — full policy in `mms-naming.md`

## Communication (two modes)

| Mode | Rule |
|------|------|
| **Chat with user** | Clear structured prose; explain trade-offs when non-obvious |
| **Code output** | Lead with the change; one-line rationale only if needed |

Do not echo file contents already in context.

## Output economy

- **Edits:** `search_replace` / small writes — not full-file rewrites.
- **Tests:** Only when requested, or for pure logic in `packages/shared` with no UI — see `mms-testing.md`.
- **JSDoc:** Required on **public exports** in `packages/shared` only. Optional elsewhere; do not add narrating comments to app code.

## Security & state

- **Validation:** Zero-trust DTOs — Zod (frontend) or Fastify JSON Schema (backend).
- **State:** Prefer unidirectional flow; pure helpers for transforms.
- **Resilience:** Error boundaries on heavy module sections; degrade gracefully on API failure.
- **Secrets:** Never log tokens, passwords, or PII — `mms-security.md`, `mms-observability.md`.

## Standards

- **TypeScript:** Strict mode. Use `unknown` + narrowing — never `any`.
- **Errors:** Handle explicitly; no silent empty `catch`.
- **HTML/CSS:** Semantic HTML; Tailwind utilities unless design tokens override.
- **Git:** Conventional Commits (`feat`/`fix`/`chore`). No direct commits to `main`. **Never commit unless the user asks.**
- **Rules:** When changing MMS standards, run `bash .agents/scripts/sync-all.sh` to mirror `.cursor/rules`, `.agents/rules`, and `.claude/rules` (see `.cursor/rules/README.md`).
