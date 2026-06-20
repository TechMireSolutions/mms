# MMS — Claude Code

Madrasa Management System monorepo. Full agent guide: [AGENTS.md](AGENTS.md).

## Quick commands

```bash
pnpm install && pnpm typecheck
pnpm install && ./restart_servers.sh   # local dev (screen)
bash .agents/skills/mms-dev-setup/scripts/verify-env.sh
```

## Where standards live

| Tool | Rules | Skills |
|------|-------|--------|
| **Claude Code** (this) | `.claude/rules/*.md` | `.claude/skills/*/SKILL.md` |
| **Cursor** | `.cursor/rules/*.mdc` | `.cursor/skills/` |
| **Antigravity** | `.agents/rules/*.md` (`.agent/` symlink) | `.agents/skills/` |

**Canonical edit flow:** change `.cursor/rules/*.mdc` or `.agents/skills/*/SKILL.md`, then:

```bash
bash .agents/scripts/sync-all.sh
```

## Always-on rules (no `paths` — load every session)

`antigravity-global`, `mms-core`, `mms-migration-status`, `mms-dependencies`, `mms-dry`

Scoped rules load when Claude reads matching paths (see each file's `paths:` frontmatter).

## Skills (15)

Start with **`mms-dev-setup`** for install/run, **`mms-frontend`** for React work (includes `/settings`), **`mms-module-page`** for new modules.

Index: [.claude/skills/README.md](.claude/skills/README.md) · Workflows (reference): [.claude/docs/workflows/](.claude/docs/workflows/)

## Layout

```
apps/frontend/     React 19 + Vite 8
apps/backend/      Fastify 5 + PostgreSQL
packages/shared/   @mms/shared
```

Rule index: [.cursor/rules/README.md](.cursor/rules/README.md)
