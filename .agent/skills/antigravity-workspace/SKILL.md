---
name: antigravity-workspace
description: Orients Antigravity agents to the MMS workspace layout — .agents rules, skills, workflows, and parity with Cursor. Use when starting work in Antigravity, loading project context, or unsure where rules and skills live.
---

# Antigravity Workspace — MMS

## Directory layout

```
.agent/  → symlink to .agents/   (Antigravity standard path)
.agents/
  rules/       # always_on | model_decision triggers
  skills/      # capability modules (this folder)
  workflows/   # slash-command style procedures
```

Cursor equivalent: `.cursor/rules/` + `.cursor/skills/`  
Claude Code equivalent: `.claude/rules/` + `.claude/skills/` + root `CLAUDE.md`

Keep in sync when editing: `bash .agents/scripts/sync-all.sh`

## Always-on rules

| File | Purpose |
|------|---------|
| `rules/antigravity-global.md` | Agent cognition, output, security |
| `rules/mms-core.md` | MMS stack & boundaries |
| `rules/mms-migration-status.md` | Known tech debt — don't fix opportunistically |
| `rules/mms-dependencies.md` | Node/pnpm/workspace dependency upgrades |
| `rules/mms-dry.md` | DRY policy and extraction thresholds |

## Skills index

See `skills/README.md`. Invoke by task keywords or `@skill-name` if your client supports it.

## Quick start

```bash
pnpm install && pnpm typecheck
bash .agents/skills/mms-dev-setup/scripts/verify-env.sh
./restart_servers.sh   # local dev (screen)
```

## Sync policy

When changing standards:

1. Update `.cursor/rules/*.mdc` (Cursor) or `.agents/skills/*/SKILL.md` (skills)
2. Run `bash .agents/scripts/sync-all.sh` to mirror **Antigravity**, **Cursor**, and **Claude Code**

| Target | Path | Frontmatter |
|--------|------|-------------|
| Cursor | `.cursor/rules/*.mdc` | `globs` + `alwaysApply` |
| Antigravity | `.agents/rules/*.md` | `trigger: always_on \| model_decision` |
| Claude Code | `.claude/rules/*.md` | `paths:` (scoped) or none (always-on) |

Skills canonical in `.agents/skills/` → mirrored to `.cursor/skills/` and `.claude/skills/`.

## Project root guide

Read `AGENTS.md` at repo root.
