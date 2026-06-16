---
trigger: model_decision
---

# MMS CI

Workflow: `.github/workflows/ci.yml` on `push` / `pull_request` to `main`.

## Pipeline

| Step | Command | Scope |
|------|---------|-------|
| Install | `pnpm install --frozen-lockfile` | root |
| Typecheck | `pnpm typecheck` | all packages via turbo |
| Lint | `pnpm lint` | `apps/frontend` + `apps/backend` |
| Test | `pnpm test` | all packages via turbo |

Node **22**, pnpm **11** — match local dev (`mms-ops.md`).

## Agent discipline

After non-trivial changes:

```bash
pnpm typecheck
pnpm test
cd apps/frontend && pnpm lint   # when touching frontend
cd apps/backend && pnpm lint    # when touching backend
```

- Fix CI failures before declaring work complete.
- When `pnpm test` is added to root `package.json`, add the CI step in the same change (`mms-testing.md`).
- Do not disable or skip checks in workflow without explicit user request.
- New packages must register `typecheck` (and `lint` if applicable) in `package.json` + `turbo.json`.

## Common failures

| Failure | Typical fix |
|---------|-------------|
| `AppTranslationKey` error | Missing `en`/`ar`/`ur` key — see `mms-i18n.md` |
| Turbo cache | Do not mutate `turbo.json` outputs impetuously (`mms-core.md`) |
| ESLint in FE | Unused imports, hook deps in changed files |
