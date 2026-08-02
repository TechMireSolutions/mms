---
name: antigravity-workspace
description: Orients Antigravity agents to the MMS workspace layout — .agent rules, skills, workflows, and parity with Cursor. Use when starting work in Antigravity, loading project context, or unsure where rules and skills live.
---

# Antigravity Workspace — MMS

## Directory layout

```
.agent/
  rules/       # always_on | model_decision triggers
  skills/      # capability modules (this folder)
  workflows/   # slash-command style procedures
```

Cursor equivalent: `.cursor/rules/` + `.cursor/skills/`  
Claude Code equivalent: `.claude/rules/` + `.claude/skills/` + root `CLAUDE.md`

Keep in sync when editing: `bash .agent/scripts/sync-all.sh`

## Always-on rules

| File | Purpose |
|------|---------|
| `rules/antigravity-global.md` | Agent cognition, output, security, React Compiler discipline |
| `rules/mms-core.md` | MMS stack, boundaries, ownership matrix |
| `rules/mms-migration-status.md` | Do not reintroduce + short open-gaps summary |
| `rules/mms-completion-review.md` | Self-review after code edits — verify, then mark done |

Scoped: `mms-dry` (shared/hooks/features), `mms-dependencies` (package/CI/Docker), `mms-structure-naming` (file-size bands + barrels), `mms-hooks` (page controllers).

## Priority skills (daily)

`mms-dev-setup` → `mms-frontend` / `mms-query-factories` / `mms-backend-api` → `mms-module-page` / `mms-module-work` → `mms-code-review` / `mms-a11y-smoke`. Domain: `mms-messaging`, `mms-settings-i18n`, `mms-backup-restore`, `mms-backend-security`. Infra: `mms-dependency-upgrade`, `mms-schema-migrate`.

## Skills index

See `skills/README.md`. Invoke by task keywords or `@skill-name` if your client supports it.

## Quick start

```bash
pnpm install && pnpm typecheck
bash .agent/skills/mms-dev-setup/scripts/verify-env.sh
./restart_servers.sh   # local dev (screen)
```

## Sync policy

When changing standards:

1. Update `.cursor/rules/*.mdc` (Cursor) or `.agent/skills/*/SKILL.md` (skills)
2. Run `bash .agent/scripts/sync-all.sh` to mirror **Antigravity**, **Cursor**, and **Claude Code**

| Target | Path | Frontmatter |
|--------|------|-------------|
| Cursor | `.cursor/rules/*.mdc` | `globs` + `alwaysApply` |
| Antigravity | `.agent/rules/*.md` | `trigger: always_on \| model_decision` |
| Claude Code | `.claude/rules/*.md` | `paths:` (scoped) or none (always-on) |

Skills canonical in `.agent/skills/` → mirrored to `.cursor/skills/` and `.claude/skills/`.

## Project root guide

Read `AGENTS.md` at repo root.
