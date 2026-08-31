# MMS — Claude Code

Madrasa Management System monorepo. Full agent guide: [AGENTS.md](AGENTS.md).

## Quick commands

```bash
pnpm install && pnpm typecheck
pnpm install && ./restart_servers.sh   # local dev (screen)
bash .agent/skills/mms-dev-setup/scripts/verify-env.sh
```

## Where standards live

| Tool | Rules | Skills |
|------|-------|--------|
| **Claude Code** (this) | `.claude/rules/*.md` | `.claude/skills/*/SKILL.md` |
| **Cursor** | `.cursor/rules/*.mdc` | `.cursor/skills/` |
| **Antigravity** | `.agent/rules/*.md` | `.agent/skills/` |

**Canonical edit flow:** change `.cursor/rules/*.mdc` or `.agent/skills/*/SKILL.md`, then:

```bash
bash .agent/scripts/sync-all.sh
```

## Always-on rules (no `paths` — load every session)

`antigravity-global`, `mms-core`, `mms-migration-status`, `mms-completion-review`

Scoped rules load when Claude reads matching paths (see each file's `paths:` frontmatter). Each rule has a **Workflow skill:** line; full rule→skill map in `mms-core` Standards index.

## Skills (28)

Start with **`mms-dev-setup`** for install/run, **`mms-frontend`** / **`mms-query-factories`** for React/Query work, **`mms-module-page`** for new modules.

Index: [.claude/skills/README.md](.claude/skills/README.md) · Workflows (reference): [.claude/docs/workflows/](.claude/docs/workflows/)

## Layout

```
apps/frontend/     React 19 + Vite 8
apps/backend/      Fastify 5 + PostgreSQL
packages/shared/   @mms/shared
```

Rule index: [.cursor/rules/README.md](.cursor/rules/README.md)
