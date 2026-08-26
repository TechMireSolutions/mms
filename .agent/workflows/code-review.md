---
description: Review MMS changes against project rules and migration status
---

# Workflow: Code Review

This workflow guides the systematic review of codebase changes (e.g., Pull Requests or local diffs) to ensure strict adherence to MMS project standards and prevent technical debt regression.

## Phase 1: Context & Rule Loading

- [ ] **Load review skill**: Invoke the `mms-code-review` skill to prepare for the review process.
- [ ] **Load always-on rules**: Review the core guidelines by reading `rules/antigravity-global.md`, `rules/mms-core.md`, `rules/mms-migration-status.md`, and `rules/mms-completion-review.md`.
- [ ] **Load scoped rules**: Identify the domain of the changes and load relevant scoped rules (e.g., `rules/mms-dry.md`, `rules/mms-dependencies.md`, `rules/mms-auth-security.md`, `rules/mms-data-layer.md`, `rules/mms-ui-ux-design.md`).

## Phase 2: Automated Checks

- [ ] **Run static analysis**: Execute the following commands to catch low-hanging fruit before manual review:
  ```bash
  pnpm typecheck
  cd apps/frontend && pnpm lint
  cd apps/backend && pnpm lint
  ```
- [ ] **Run tests**: If applicable, run `pnpm test` for the affected packages or apps. Verify backend tests include `inject()` allow+deny authorization checks.

## Phase 3: Diff Analysis & Project Alignment

Audit the diff against the core MMS invariants:

- [ ] **Backend / Data Layer (`mms-backend-api`, `mms-schema-migrate`)**:
  - DDL is forward-only with `FORCE RLS` on new tenant tables.
  - Endpoints enforce `authenticateTenant` / `authenticatePlatform`.
  - Transaction RLS (`SET LOCAL app.current_tenant`) is used appropriately for tenant writes.
  - Zero-trust DTOs validated via `@mms/shared` Zod strict schemas before persistence.
- [ ] **Frontend Architecture (`mms-frontend`, `mms-query-factories`)**:
  - TanStack Query v5 is used for data fetching (no new `useLiveCollection` for REST entities).
  - Cross-feature imports are banned (e.g. importing `@/tenant/features/A` from `B`). Shared logic must reside in `@mms/shared` or `@/tenant/hooks/collections/*` facades.
  - Code splits properly at the ~300-line soft ceiling via stable barrels (`mms-structure-naming.md`).
- [ ] **UI & i18n Parity (`mms-ui-ux-design.md`, `mms-settings-i18n.md`)**:
  - Semantic HTML (`<main>`, `<nav>`, `<section>`), minimum 44x44px touch targets.
  - No hardcoded English strings. All text uses `t()` with keys in `appTranslationsEn.ts` (and ar/ur/fa packs).
  - `ErrorState` implementations include descriptive hints (e.g., `loadFailedHint`), not just titles.
- [ ] **Data Standards & DRY (`mms-dry.md`)**:
  - Money is handled as decimal strings (no IEEE 754 floats).
  - Phone numbers use E.164 via `parsePhoneNumber`.
- [ ] **Node.js 24 Runtime & Modern Practices (`mms-dependencies.md`, `mms-structure-naming.md`, `mms-ops-infrastructure.md`)**:
  - Core module imports use mandatory `node:` protocol prefix (`node:fs/promises`, `node:crypto`, `node:path`, `node:async_hooks`, `node:test`).
  - No banned dependencies introduced (`dotenv`, `axios`, `node-fetch`, `ws` for client communication, `glob`, `fast-glob`, `path-to-regexp`).
  - Native built-ins used: `--env-file`/`process.loadEnvFile()`, global `fetch()`, `FormData`, `WebSocket`, `crypto.hash()`, `URLPattern`, and WHATWG `new URL()` (never `url.parse()`).
  - Scoped resource disposal leverages `using` / `await using` (Explicit Resource Management).
  - Context & trace propagation uses `AsyncLocalStorage` (`AsyncContextFrame`); logs emit structured JSON to stdout (Pino).
  - Test suites use `node:test` + `node:assert/strict` (auto-awaiting subtests); CLI/scripts leverage `--experimental-strip-types`.
- [ ] **Debt Regressions**: Check against `rules/mms-migration-status.md` to ensure "Recently Resolved" items (like raw `role ===` checks) are not reintroduced.

## Phase 4: Report Generation

Format your review output clearly, categorizing findings by severity. Do not output the entire file content; point to specific lines or files.

### Finding Classifications

- **Critical** — Blockers that must be fixed before merge (e.g., build failures, bypassed RLS, type errors).
- **Major** — Significant rule violations that spread debt or architectural flaws (e.g., missing translation keys, cross-feature imports, missing Zod validation).
- **Minor** — Style nits, optional DRY extractions, or minor optimizations.

---

> [!IMPORTANT]
> **Zero-Regression Policy**
> If the review uncovers newly introduced violations of existing standards, flag them as **Major** or **Critical**. Do not let technical debt accumulate in new feature work.
