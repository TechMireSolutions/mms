# MMS Agent Rules (Antigravity)

Project rules for the Madrasa Management System. Antigravity loads `.md` files from this directory (or `.agent/` symlink).

Mirrors: `.cursor/rules/*.mdc` (Cursor) · `.claude/rules/*.md` (Claude Code)

**Sync:** `bash .agents/scripts/sync-all.sh` after editing `.cursor/rules/*.mdc`

## Always on (`trigger: always_on`) — 6

| Rule | Purpose |
|------|---------|
| `antigravity-global.md` | Cognition, output economy, security, TS/git standards |
| `mms-core.md` | Stack, boundaries, domain, edit discipline — **index only; details in scoped rules** |
| `mms-migration-status.md` | Target vs current gaps + recently resolved — do not regress |
| `mms-dependencies.md` | Latest stable Node, pnpm, and workspace dependency upgrades |
| `mms-dry.md` | DRY — single source of truth, extraction thresholds, duplication bans |

## Model decision (`trigger: model_decision`) — 36 scoped

See `.cursor/rules/README.md` for the full index and canonical ownership table.

Highlights: `mms-module-architecture`, `mms-module-work`, `mms-module-setup`, `mms-module-crosscutting`, `mms-background-jobs`, `mms-settings-navigation`, `mms-config`, `mms-frontend`, `mms-hooks`, `mms-query`, `mms-module-isolation`, `mms-i18n`, `mms-rbac`, `mms-security`, `mms-contacts`.

**42 rule files total** (6 always-on + 36 scoped). **Rename policy:** use `mms-*` everywhere.

## Skills (18)

`.agents/skills/` — mirrored to `.cursor/skills/` and `.claude/skills/`. Index: [../skills/README.md](../skills/README.md). Overview: [../../AGENTS.md](../../AGENTS.md).

## Workflows

`dev-setup`, `feature-module`, `code-review`, `fix-migration-debt` — see [../workflows/](../workflows/). Claude reference copies: `.claude/docs/workflows/`.

## PR / change checklist

- [ ] `pnpm typecheck` && `pnpm test`
- [ ] Frontend lint if touched: `cd apps/frontend && pnpm lint`
- [ ] No new hardcoded labels/colours — see `mms-i18n.md` (en/ar/ur/fa) + registries
- [ ] Module tiers respect `mms-module-isolation.md` + `mms-module-architecture.md`
- [ ] Shared logic in `@mms/shared` if cross-app or 2+ modules
- [ ] No commit unless user requested
- [ ] Run `bash .agents/scripts/sync-all.sh` when changing standards
- [ ] Auth/write routes: `mms-security.md` + `mms-rbac.md`
- [ ] New UI: `mms-a11y.md` keyboard + labels
- [ ] New `@mms/shared` pure helpers: unit test per `mms-testing.md`

## Removed / merged (history)

| Removed | Merged into |
|---------|-------------|
| `mms-ai.md` | `mms-core` + `antigravity-global` |
| Duplicate tier/isolation prose | `mms-module-isolation` (canonical) |
| `reports.md` | `mms-reports.md` |
