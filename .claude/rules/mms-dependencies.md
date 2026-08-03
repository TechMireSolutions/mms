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
---

# Dependencies & Tech Stack

**Workflow skill:** `mms-dependency-upgrade` (catalogs, Dependabot, audits, React Compiler). Day-to-day install/run → `mms-dev-setup`.

Stay current. MMS targets **latest stable** releases across the monorepo — not “good enough” pins.

## Baseline (root `package.json`)

| Tool | Policy |
|------|--------|
| **Node** | Latest LTS or current stable (`engines.node`) — upgrade Homebrew/nvm when behind |
| **pnpm** | Match root `packageManager` — `corepack enable` |
| **Turbo** | Latest compatible major at root |

Stack majors are not frozen — upgrade React, Vite, Fastify, Drizzle, Tailwind, etc. when newer stable releases ship (`mms-core.md` lists current stack; this rule owns **version freshness**).

## Upgrade workflow

Full checklist → skill **`mms-dependency-upgrade`**. Run only on **dedicated upgrade PRs** — not mid-feature.

1. `pnpm outdated -r` at repo root
2. Bump stale workspace deps (direct + transitive risk review)
3. `pnpm install && pnpm typecheck && pnpm test`
4. Per-app lint if FE/BE touched: `cd apps/frontend && pnpm lint` · `cd apps/backend && pnpm lint`
5. `pnpm audit` (or OSV review) — fix/document high+ findings; do not leave known CVEs silent
6. Fix breaking API changes in the same change — no deferred “follow-up” pins

Prefer **one coherent upgrade PR** over scattered partial bumps. Extra caution for native/binary deps when present (CI may still set `PUPPETEER_SKIP_DOWNLOAD`; WhatsApp helper is not a Puppeteer workspace package).

## Pinning rules

| Do | Don't |
|----|-------|
| Exact `packageManager` + `engines` at root | Arbitrary `^` downgrades to avoid upgrading |
| Workspace protocol for `@mms/shared` | Duplicate shared code to dodge a major bump |
| pnpm `catalog:` / `catalogs` for React, Vite, Fastify, Drizzle, Zod, TanStack Query (apps cannot drift majors) | Divergent majors across apps/packages |
| Read upstream migration guides for majors | Silence type errors with `any` or `@ts-ignore` |
| Patch/minor bumps freely within semver | Leave known CVEs unpatched |
| Align CI/Docker Node with `engines.node` | Mismatched CI images |
| `pnpm.onlyBuiltDependencies` (or equivalent) allowlist for native/postinstall scripts | Running arbitrary package `postinstall` / build scripts unreviewed |

## Scope

- **Root:** `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`
- **Apps:** `apps/frontend/package.json`, `apps/backend/package.json`
- **Packages:** `packages/shared/package.json`
- **CI/Docker:** align Node/pnpm images with root engines

## After upgrade

- Remove deprecated API usage — do not wrap obsolete calls indefinitely
- Update skills/rules if commands or ports change (`mms-ops-infrastructure.md`, `mms-dev-setup`)
- Do **not** commit or push unless the user asks

## Supply chain (CI)

Enable Dependabot (or Renovate) + GitHub `dependency-review` on PRs for high/critical advisories; keep `pnpm audit` in upgrade PRs. Prefer `onlyBuiltDependencies` (pnpm) so only reviewed packages may run install scripts — do not silently enable every postinstall. Do not require SBOM/provenance until an ops task adds them — `mms-ops-infrastructure.md`.

## TypeScript strictness (dedicated PR)

Target: `noUncheckedIndexedAccess`; prefer `import type` / `verbatimModuleSyntax` (and `erasableSyntaxOnly` when on TS 5.8+). `exactOptionalPropertyTypes` is opt-in only — high churn; do not enable mid-feature. Strict mode + ban `any` already always-on (`antigravity-global.md`).

## React Compiler (when enabling)

React Compiler is **not** enabled today — do not add `useMemo` / `useCallback` / `React.memo` by default (`antigravity-global.md`).

When enabling in a dedicated PR:
1. Add the official Babel/Vite plugin **only in `apps/frontend` Vite config** (not root); keep React major current.
2. Keep `eslint-plugin-react-hooks`; add `eslint-plugin-react-compiler` diagnostics in the same PR.
3. Run `pnpm typecheck && pnpm test` + FE lint; fix Compiler diagnostics (impure renders, hidden mutations).
4. Prefer deleting ad-hoc memo wrappers that the Compiler covers — do not enable Compiler with memo wrappers left in place.
5. Update `mms-core.md` stack note / this checklist if the enablement path changes.
