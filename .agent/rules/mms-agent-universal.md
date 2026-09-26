---
trigger: always_on
description: Universal agent cognition, behaviour, output economy, security, and TypeScript standards across Cursor, Antigravity, and Claude Code
---

# MMS Agent Universal Standards

**Workflow skills:** orientation / sync → `antigravity-workspace` · PR/self-review index → `mms-code-review`. Ownership matrix → `.cursor/rules/README.md`.

## 1. Cognition & Behaviour

- **Plan**: Emit concise `<plan>` before structural/multi-file edits. Search `@mms/shared` before authoring new logic (`mms-dry.md`).
- **Type-Check**: Validate types against schemas before code generation. Use Context7/official docs over broad web searches for external libraries.
- **Focus & Style**: Edit in-scope files only. Terse, functional, idiomatic code with zero boilerplate or narrating comments.
- **Surgical Edits**: Targeted patches with minimal context; never rewrite whole files unless creating new files.
- **Rendering Hygiene**: Memoize non-trivial operations and stabilize callbacks passed to memoized children; avoid premature memoization (`mms-performance.md`).

## 2. Communication & Output Economy

- **Chat**: Clear, structured prose; explain non-obvious trade-offs.
- **Code Output**: Lead directly with code; 1-line rationale only if needed. Zero conversational preambles, pleasantries, or postambles. Never restate user prompts.
- **Artifacts & Logs**: Provide direct clickable file links with 1-line context; never echo artifact contents in chat. Limit tool inspections (<150 lines) and shell output (`git log -n 5`, `head -n 50`, `--silent`).
- **Tests & JSDoc**: Unit test `@mms/shared` pure helpers (`mms-testing-observability.md`). JSDoc on public exports in `packages/shared` only; omit elsewhere.

## 3. Security, State & Standards

- **Zero-Trust DTOs**: Validate via `@mms/shared` Zod + Fastify `parseRequest` (`mms-api-interface.md`, `mms-core.md`). Unidirectional state flow (`mms-data-layer.md` §4).
- **Concurrency & Signals**: Pass `AbortSignal` into `apiFetch` and `queryFn`; combine via `AbortSignal.any()`. Clear timers and observers.
- **TypeScript**: Strict mode. Use `unknown` + narrowing (never `any`, never `as unknown as T`). Native immutability: use `toSorted()`, `toReversed()`, `toSpliced()`, `Object.groupBy()`. Zero non-erasable syntax (`enum`, `namespace`).
- **Node.js 24**: Native built-ins (`node:` imports, `new URL()`, `using` / `await using`) — details `mms-dependencies.md`.
- **A11y & UI**: Semantic HTML5, Tailwind utilities, semantic landmarks (`<main>`, `<nav>`, `<header>`), minimum 44×44px touch targets (`mms-ui-ux-design.md` §3).
- **Git Boundaries**: Conventional Commits. Protected `main` branch. **NEVER run `git add`, `git commit`, or `git push` (or any equivalent) unless the user explicitly says "commit" in that exact message. Never push to GitHub under any circumstance — the user handles all pushes themselves. Do not stage or commit as a "convenience" after edits. The user owns all git operations.**
- **Shell Commands**: Pass explicit working directory or use single-shot `cd <dir> && <cmd>`. Never leave shell in an un-reset directory.
- **Enforcement Principle**: A norm is either machine-enforced (lint rule, ratchet script, CI check, hook, test) or explicitly labelled advisory. Land the check with the norm. Tool-neutral rule bodies mirrored across `.cursor`, `.agent`, `.claude`.

## 4. Anti-Patterns & Banned Operations

- ❌ **NEVER modify protected zones without explicit logged authorization**: DB migrations, auth middleware/services (`apps/backend/src/middleware/authenticate*.ts`, `apps/backend/src/services/auth/`), CI/CD workflows, Dockerfiles, and root configs (`tsconfig.json`, `tailwind.config.js`, `vite.config.ts`).
- ❌ **NEVER exceed 200 lines in source files (`.ts`, `.tsx`, `.js`)**: Hard cap; decompose into dedicated sub-components, hooks, or services (`mms-structure-naming.md` §3).
- ❌ **NEVER couple presentation with data orchestration**: UI components render state only; fetching and state logic belong in hooks/services.
- ❌ **NEVER bypass validation with type casting**: No `as unknown as T`, `any`, or untyped dictionaries.
- ❌ **NEVER delete files without confirmation**: Request explicit user approval before removing files.
- ❌ **NEVER invent new dependencies**: Check Node 24 built-ins, `@mms/shared`, and `pnpm-workspace.yaml` first.
- ❌ **NEVER restate an owned norm**: Link to owning rule in `.cursor/rules/README.md`.
