---
description: Run all unit, integration, typecheck, lint, and E2E tests across MMS, diagnose failures, and iteratively fix all defects until 100% clean pass state.
---

# Workflow: Run Tests & Resolve Diagnostics

This workflow provides a comprehensive, systematic procedure for executing test suites, type checking, and linting across the MMS monorepo (`apps/frontend`, `apps/backend`, `packages/shared`), diagnosing any failures, and applying root-cause fixes until all checks pass cleanly.

---

## Phase 1: Environment & Verification Command SSOT

The MMS monorepo uses **pnpm** and **Turbo** to manage dependencies and execution across packages.

### Verification Matrix

| Scope | Command | Description |
|---|---|---|
| **Monorepo Typecheck** | `pnpm typecheck` | Strict TypeScript check across `@mms/shared`, `mms-backend`, `mms-frontend`, `e2e-tests` |
| **Full Unit & Integration Suite** | `pnpm test` | Vitest execution for shared helpers, backend services, and frontend components |
| **Frontend Lint** | `cd apps/frontend && pnpm lint` | ESLint + React 19 rules + cross-feature import boundary checks |
| **Backend Lint** | `cd apps/backend && pnpm lint` | ESLint + Fastify 5 / Node rules |
| **Targeted Frontend Test** | `pnpm --filter mms-frontend test <file>` | Rapid isolated test run on specific frontend file |
| **Targeted Backend Test** | `pnpm --filter mms-backend test <file>` | Rapid isolated test run on specific backend service/route file |
| **Targeted Shared Test** | `pnpm --filter @mms/shared test <file>` | Rapid test run for shared schemas and helpers |

---

## Phase 2: Ordered Test Suite Execution

Execute verification steps in logical sequence—from fast structural type checking to unit/integration test suites and ESLint diagnostics:

```bash
# Step 1: Type Checking (Monorepo)
pnpm typecheck

# Step 2: Unit & Integration Tests (Monorepo)
pnpm test

# Step 3: Lint Diagnostics (Frontend & Backend)
cd apps/frontend && pnpm lint
cd apps/backend && pnpm lint
```

> [!IMPORTANT]
> If any command fails, inspect the complete error stack trace immediately before making any code modifications.

---

## Phase 3: Root Cause Diagnosis & Non-Negotiable Invariants

For any failed test or diagnostic error:

1. **Read Log Output in Full**:
   - Inspect exact failure trace, file path, line numbers, and expected vs. actual values.
   - Do not guess or hypothesize without log evidence.

2. **Categorize Failures**:
   - **Type Errors (`TSxxxx`)**: Schema mismatches, missing required properties, un-narrowed `unknown` types.
   - **Assertion Failures**: Broken business logic, invalid normalization, missing `customData` fields.
   - **Mock / Fixture Errors**: Outdated test fixtures missing schema fields, missing RBAC context, or unhandled async promises.
   - **Lint & Boundary Violations**: Direct cross-feature imports, unused variables, missing translation keys.

3. **Strict Invariants (Zero-Tolerance Rules)**:
   - ❌ **NEVER** comment out failing assertions or delete failing tests to fake a pass.
   - ❌ **NEVER** add `@ts-ignore`, `@ts-nocheck`, or cast to `any` to bypass type errors.
   - ❌ **NEVER** swallow errors in empty `catch` blocks or return dummy fallback values.
   - ✅ **ALWAYS** resolve the root cause in source logic or update test fixtures to match current `@mms/shared` Zod schemas.

---

## Phase 4: Targeted Iterative Fix & Re-test

1. **Isolate & Patch**:
   - Apply targeted fixes to the source file or test definition.
   - Run isolated Vitest execution for fast feedback:
     ```bash
     pnpm --filter mms-frontend test <filename>.test.ts
     pnpm --filter mms-backend test <filename>.test.ts
     ```

2. **Verify Adjacent Scope**:
   - Ensure the patch did not introduce regressions in shared utilities (`packages/shared`), hooks, or database queries.

---

## Phase 5: Final Clean Pass Verification

Re-run full verification suite to guarantee zero regressions across the monorepo:

```bash
pnpm typecheck && pnpm test
cd apps/frontend && pnpm lint
cd apps/backend && pnpm lint
```

---

## Phase 6: Reporting & Summary

Summarize test execution results clearly:

- **Typecheck**: ✅ Passed / ❌ Failed (0 errors)
- **Unit/Integration Tests**: ✅ Passed (X passed, 0 failed) / ❌ Failed
- **Frontend & Backend Linting**: ✅ Clean / ❌ Issues remaining
- **Summary of Root-Cause Fixes**: Concise log of root causes identified and targeted patches applied.
