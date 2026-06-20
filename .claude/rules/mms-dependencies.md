---
description: Keep Node, pnpm, and all workspace dependencies on latest stable versions
---

# Dependencies & Tech Stack

Stay current. MMS targets **latest stable** releases across the monorepo — not “good enough” pins.

## Baseline (root `package.json`)

| Tool | Policy |
|------|--------|
| **Node** | Latest LTS or current stable (`engines.node`) — upgrade Homebrew/nvm when behind |
| **pnpm** | Match root `packageManager` — `corepack enable` |
| **Turbo** | Latest compatible major at root |

Stack majors are not frozen — upgrade React, Vite, Fastify, Drizzle, Tailwind, etc. when newer stable releases ship (`mms-core.md` lists current stack; this rule owns **version freshness**).

## Upgrade workflow

1. `pnpm outdated -r` at repo root
2. Bump **all** stale workspace deps (direct + transitive risk review)
3. `pnpm install && pnpm typecheck && pnpm test`
4. Per-app lint if FE/BE touched: `cd apps/frontend && pnpm lint` · `cd apps/backend && pnpm lint`
5. Fix breaking API changes in the same change — no deferred “follow-up” pins

Prefer **one coherent upgrade PR** over scattered partial bumps.

## Pinning rules

| Do | Don't |
|----|-------|
| Exact `packageManager` + `engines` at root | Arbitrary `^` downgrades to avoid upgrading |
| Workspace protocol for `@mms/shared` | Duplicate shared code to dodge a major bump |
| Read upstream migration guides for majors | Silence type errors with `any` or `@ts-ignore` |
| Patch/minor bumps freely within semver | Leave known CVEs unpatched |

## Scope

- **Root:** `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`
- **Apps:** `apps/frontend/package.json`, `apps/backend/package.json`
- **Packages:** `packages/shared/package.json`
- **CI/Docker:** align Node/pnpm images with root engines

## After upgrade

- Remove deprecated API usage — do not wrap obsolete calls indefinitely
- Update skills/rules if commands or ports change (`mms-ops.md`, `mms-dev-setup`)
- Do **not** commit or push unless the user asks
