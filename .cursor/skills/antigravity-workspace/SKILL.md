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

Cursor equivalent: `.cursor/rules/` + `.cursor/skills/` (keep in sync when editing).

## Always-on rules

| File | Purpose |
|------|---------|
| `rules/antigravity-global.md` | Agent cognition, output, security |
| `rules/mms-core.md` | MMS stack & boundaries |
| `rules/mms-migration-status.md` | Known tech debt — don't fix opportunistically |

## Skills index

See `skills/README.md`. Invoke by task keywords or `@skill-name` if your client supports it.

## Quick start

```bash
pnpm install && pnpm typecheck
bash .agents/skills/mms-dev-setup/scripts/verify-env.sh
pnpm dev   # foreground turbo — prefer ./restart_servers.sh for local dev
```

## Sync policy

When changing standards:

1. Update `.cursor/rules/*.mdc` (Cursor)
2. Mirror `.agents/rules/*.md`
3. Mirror `.agents/skills/*/SKILL.md` with `.cursor/skills/` via `bash .agents/scripts/sync-skills.sh`

## Project root guide

Read `AGENTS.md` at repo root.
