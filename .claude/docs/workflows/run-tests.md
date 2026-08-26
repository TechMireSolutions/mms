---
description: Run all unit, integration, typecheck, lint, and E2E tests across MMS, diagnose failures, and iteratively fix all defects until 100% clean pass state.
---

# Workflow: Run Tests & Resolve Diagnostics

This workflow provides a comprehensive, systematic procedure for executing test suites, type checking, and linting across the MMS monorepo (`apps/frontend`, `apps/backend`, `packages/shared`), diagnosing any failures, and applying root-cause fixes until all checks pass cleanly.

## Phase 1: Environment & Context Gathering

- [ ] **Load core skills**: Review `mms-testing-e2e` for execution diagnosis, `mms-completion-review.md` for post-edit verification, and `mms-testing-observability.md` for testing standards.
- [ ] **Review Verification Matrix**: Identify the necessary commands for your scope:

| Scope | Command | Description |
|---|---|---|
| **Monorepo Typecheck** | `pnpm typecheck` | Strict TS check across `@mms/shared`, `mms-backend`, `mms-frontend`, `e2e-tests` (enforces `noUncheckedIndexedAccess`) |
| **Full Unit/Integration** | `pnpm test` | Vitest execution for shared helpers, backend services, and frontend components |
| **Frontend Lint** | `pnpm --filter mms-frontend lint` | ESLint + React 19 rules + cross-feature import boundary checks (`mms-dry.md`) |
| **Backend Lint** | `pnpm --filter mms-backend lint` | ESLint + Fastify 5 / Node rules |
| **Isolated Test** | `pnpm --filter <app> test <file>` | Rapid Vitest run on a specific file |
| **E2E Playwright** | `pnpm --filter e2e-tests test` | Full browser integration via Playwright + axe-core a11y checks |
| **All-in-One** | `pnpm typecheck && pnpm test && pnpm --filter mms-frontend lint && pnpm --filter mms-backend lint` | Complete single-command monorepo validation pass |

## Phase 2: Ordered Test Suite Execution

- [ ] **Run Type Checking**: Ensure structural correctness first.
  ```bash
  pnpm typecheck
  ```
- [ ] **Run Unit & Integration Tests**: Verify logic across the monorepo (Vitest).
  ```bash
  pnpm test
  ```
- [ ] **Run Lint Diagnostics**: Check style, imports, and React rules.
  ```bash
  pnpm --filter mms-frontend lint
  pnpm --filter mms-backend lint
  ```
- [ ] **Run E2E & A11y (Optional but Recommended)**: Run MSW-backed Playwright tests.
  ```bash
  pnpm --filter e2e-tests test
  ```

> [!IMPORTANT]
> If any command fails, inspect the complete error stack trace immediately before making any code modifications.

## Phase 3: Root Cause Diagnosis & Project Alignment

For any failed test or diagnostic error, follow these steps sequentially:

- [ ] **Read log output in full**: Inspect exact failure traces, file paths, line numbers, and expected vs. actual values. Do not guess without log evidence.
- [ ] **Categorize failures against Project Rules**:
  - **Type Errors (`TSxxxx`)**: Schema mismatches, missing properties, un-narrowed `unknown`. Check `@mms/shared` Zod exports.
  - **Assertion Failures**: Broken logic, invalid normalization. Verify backend tests include `inject()` allow/deny checks.
  - **Mock/Fixture Errors**: Outdated MSW fixtures missing schema fields, missing RBAC context, unhandled async promises.
  - **Lint & Boundaries**: Direct cross-feature imports (banned by `mms-dry.md`), missing `t()` keys, unused variables.
- [ ] **Enforce strict invariants**: Address the root cause in the source logic or update test fixtures to match current `@mms/shared` Zod schemas.

> [!CAUTION]
> **Zero-Tolerance Anti-Patterns**
> ❌ **NEVER** comment out failing assertions or delete failing tests to fake a pass.
> ❌ **NEVER** add `@ts-ignore`, `@ts-nocheck`, or cast to `any` to bypass type errors.
> ❌ **NEVER** swallow errors in empty `catch` blocks or return dummy fallback values.

## Phase 4: Targeted Iterative Fix & Re-test

- [ ] **Isolate & Patch**: Apply targeted fixes to the source file or test definition (e.g. updating a Vitest spec or an MSW handler).
- [ ] **Run fast isolated tests**: Provide rapid feedback loop on the specific file:
  ```bash
  pnpm --filter mms-frontend test <filename>.test.ts
  pnpm --filter mms-backend test <filename>.test.ts
  ```
- [ ] **Verify adjacent scope**: Ensure the patch did not introduce regressions in shared utilities (`packages/shared`), hooks, or database queries.

## Phase 5: Final Clean Pass Verification

- [ ] **Execute full validation**: Re-run the entire suite to guarantee zero regressions across the monorepo.
  ```bash
  pnpm typecheck && pnpm test && pnpm --filter mms-frontend lint && pnpm --filter mms-backend lint
  ```

## Phase 6: Reporting & Summary

- [ ] **Summarize execution results**: Output a clear report in your final message:
  - **Typecheck**: ✅ Passed / ❌ Failed
  - **Unit/Integration Tests**: ✅ Passed (X passed, 0 failed) / ❌ Failed
  - **Frontend & Backend Linting**: ✅ Clean / ❌ Issues remaining
  - **Summary of Root-Cause Fixes**: Concise log of root causes identified and targeted patches applied.
