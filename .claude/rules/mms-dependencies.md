---
description: Keep Node, pnpm, and all workspace dependencies on latest stable versions
paths:
  - "package.json"
  - "**/package.json"
  - "pnpm-lock.yaml"
  - "pnpm-workspace.yaml"
  - "turbo.json"
  - "apps/backend/Dockerfile"
  - ".github/workflows/**"
  - ".nvmrc"
  - "apps/frontend/vite.config.ts"
  - "apps/backend/package.json"
  - "apps/frontend/package.json"
  - "packages/shared/package.json"
---

# Dependencies & Tech Stack

**Workflow skill:** `mms-dependency-upgrade` (catalogs, Dependabot, audits, React Compiler). Day-to-day install/run → `mms-dev-setup`.

## 1. Baseline & Workspace Catalogs

- **Runtimes & Tooling:** Node.js `>=24.14.0` (LTS `engines.node`), Corepack `pnpm@11.15.1`, Turborepo `^2.10.9`, TypeScript `~7.0.2` (with `typescript-v6` compatibility alias).
- **Catalogs (`pnpm-workspace.yaml`):** React/React-DOM `^19.2.8`, React Router `^7.18.3`, Vite `^8.3.0`, Fastify `^5.12.1`, Pino `^10.3.1`, Drizzle ORM `^0.45.2`, Zod `^4.4.3`, TanStack Query `^5.101.4`, `@ts-rest/react-query` `3.52.1`. Apps cannot drift majors.
- **E2E & Shared:** Playwright `^1.62.1`, axe-core `^4.13.0`, `@ts-rest/core`. Workspace protocol (`workspace:*`) mandatory for `@mms/shared`.

## 2. Upgrade Workflow

- **Dedicated PRs Only:** Never bump dependencies mid-feature.
- **Procedure:** `pnpm outdated -r` → bump stale deps → `pnpm install && pnpm typecheck && pnpm test` → app lints (`cd apps/frontend && pnpm lint`, `cd apps/backend && pnpm lint`) → `pnpm audit` (fix high+ CVEs) → resolve breaking API changes in the same PR.

## 3. Node 24 Native Built-Ins & Banned Dependencies

- **Configuration:** Use native `--env-file=.env` or `process.loadEnvFile()`. Banned: `dotenv`.
- **Networking:** Use native global `fetch()`, `FormData`, and global `WebSocket`. Banned: `axios`, `node-fetch`.
- **Filesystem:** Use `import { glob } from 'node:fs/promises'`. Banned: `glob`, `fast-glob`.
- **Crypto & Hashing:** Use `crypto.hash()` from `node:crypto`. Banned: verbose `createHash().update().digest()` chains.
- **URLs & Routing:** Use `URLPattern` and WHATWG `new URL()`. Banned: `path-to-regexp`, legacy `url.parse()`.
- **Core Imports:** Mandatory `node:` prefix (`node:fs/promises`, `node:crypto`, `node:path`). Banned: unprefixed core imports.
- **Resource Management:** Use `using` / `await using` for cleanup. Banned: manual `try/finally` connection boilerplate.
- **Request Tracing:** Use `AsyncLocalStorage` via `AsyncContextFrame`. Banned: manual trace context parameter drilling.
- **Testing & Execution:** Use `vitest` everywhere. Banned: `jest`, `mocha`. Use `--experimental-strip-types` for CLI scripts.
- **Pathing & Encodings:** Use `import.meta.dirname`, `Uint8Array.prototype.toBase64()`, and `Uint8Array.fromHex()`. Banned: `fileURLToPath` boilerplate and bespoke base64/hex encoders.

## 4. Pinning & Supply Chain Rules

- **Strict Semver:** Match exact `packageManager` and `engines` across CI/Docker.
- **Script Containment:** Enforce `pnpm.onlyBuiltDependencies` allowlist for native/postinstall scripts. Arbitrary unreviewed postinstalls are banned.
- **Automated Audits:** Enable Dependabot/Renovate + GitHub `dependency-review` on PRs. Do not leave known high+ CVEs unpatched.

## 5. TypeScript Strictness & Erasable Syntax

- **Type Stripping Invariants (`--experimental-strip-types`):**
  - ❌ Banned: `enum` — use string literal unions (`type Status = 'active' | 'archived'`) or `as const` maps.
  - ❌ Banned: `namespace` / `module` declarations.
  - ❌ Banned: Constructor parameter properties (`constructor(public name: string)`).
  - ✅ Required: Explicit class property declarations, `import type`, `verbatimModuleSyntax`, and `erasableSyntaxOnly`.

## 6. React Compiler (When Enabling)

- Add plugin strictly to `apps/frontend/vite.config.ts` (never root).
- Verify with `pnpm typecheck`, `pnpm test`, and FE lint before removing working manual memoization.

## 7. Workflow & Output Speed Rules

- **Zero Output Bloat:** Output surgical diffs or targeted snippets only. Never rewrite entire files unless creating a new file from scratch. Omit conversational filler and post-code recaps.
- **Verification Gates:** Verify with `pnpm typecheck` and scoped tests before marking tasks done. If standards are modified, execute `bash .agent/scripts/sync-all.sh` and verify with `node scripts/verify-rules-integrity.mjs`.
