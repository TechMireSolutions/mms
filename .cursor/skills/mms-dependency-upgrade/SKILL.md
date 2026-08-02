---
name: mms-dependency-upgrade
description: Upgrades MMS workspace dependencies with pnpm catalogs, Dependabot/Renovate + dependency-review, audits, and the React Compiler enablement checklist. Use when bumping Node/pnpm/React/Vite/Fastify/Drizzle/Zod/Query, enabling Dependabot, or turning on React Compiler.
---

# MMS Dependency Upgrade Workflow

**Rule (norms SSOT):** `mms-dependencies.mdc`. Also `mms-ops-infrastructure.mdc` (CI), `antigravity-global.mdc` (memo hygiene), `mms-completion-review.mdc`.

Do **not** use for day-to-day install/run → `mms-dev-setup`. Do **not** use for prod host deploy → `mms-ops-deploy`.

## Workflow

1. Confirm root `packageManager` + `engines.node` match CI/Docker exactly.
2. Prefer pnpm `catalog:` / `catalogs` for React, Vite, Fastify, Drizzle, Zod, TanStack Query — apps must not drift majors.
3. Bump via Dependabot/Renovate PR or a dedicated manual catalog edit (not mid-feature).
4. `pnpm install` then `pnpm audit` (or OSV) — fix/document high+ findings.
5. Read upstream major migration guides before landing breaking API changes.
6. `pnpm typecheck && pnpm test` + FE/BE lint when those apps changed.
7. **React Compiler** (only if enabling): Babel/Vite plugin in `apps/frontend` Vite config only → add `eslint-plugin-react-compiler` → delete redundant `useMemo`/`useCallback`/`React.memo` → update stack note in `mms-core.mdc` / this rule.
8. Keep GitHub `dependency-review` green on the PR.
9. Do not enable `exactOptionalPropertyTypes` mid-feature — dedicated TS-strictness PR only (`mms-dependencies.mdc`).

## Checklist

```
- [ ] Dedicated upgrade PR (not mixed with feature work)
- [ ] catalogs / majors aligned across apps
- [ ] engines + packageManager match CI/Docker
- [ ] audit clean or justified
- [ ] typecheck + test + lint green
- [ ] Compiler not half-enabled (plugin + eslint + memo cleanup together)
```

## Done

`mms-completion-review.mdc`. Sync standards mirrors only if you edited rules/skills.
