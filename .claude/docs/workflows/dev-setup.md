---
description: Install dependencies, verify environment, and start MMS dev servers
---

# Workflow: Dev Setup

## Steps

1. Load skill: `mms-dev-setup`
2. Run environment check:
   ```bash
   bash .agent/skills/mms-dev-setup/scripts/verify-env.sh
   ```
3. Install and typecheck:
   ```bash
   pnpm install && pnpm typecheck
   ```
4. Start servers:
   ```bash
   ./restart_servers.sh              # GNU screen (default)
   ./restart_servers.sh --foreground # or this terminal
   ```
5. Confirm:
   - Backend: `curl http://localhost:3000/health`
   - Frontend: http://localhost:5173

## Rules

`rules/mms-ops-infrastructure.md`, `rules/mms-core.md`
