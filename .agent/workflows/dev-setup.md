---
description: Install dependencies, verify environment, and start MMS dev servers
---

# Workflow: Dev Setup

This workflow guides the process of setting up, verifying, and running the local development environment for the MMS monorepo.

## Phase 1: Prerequisites & Environment Verification

- [ ] **Load setup skill**: Invoke the `mms-dev-setup` skill to ensure context for infrastructure.
- [ ] **Review infrastructure rules**: Read `rules/mms-ops-infrastructure.md` and `rules/mms-core.md` to understand port assignments and layering.
- [ ] **Run environment check**: Verify Node versions, PostgreSQL, and environment variables using the dedicated script:
  ```bash
  bash .agent/skills/mms-dev-setup/scripts/verify-env.sh
  ```

## Phase 2: Dependency Installation & Health Check

- [ ] **Install dependencies**: Use `pnpm` (the required package manager) to install workspace dependencies.
- [ ] **Run typecheck**: Ensure there are no TypeScript compilation errors before attempting to start servers.
  ```bash
  pnpm install && pnpm typecheck
  ```

## Phase 3: Server Orchestration

- [ ] **Start dev servers**: Run the restart script to orchestrate the backend and frontend servers. 
  ```bash
  # Option A: Run in background using GNU screen (default)
  ./restart_servers.sh
  
  # Option B: Run in the foreground of the current terminal
  ./restart_servers.sh --foreground
  ```

## Phase 4: Validation

- [ ] **Confirm backend health**: Verify the backend is responding on port 3000.
  ```bash
  curl http://localhost:3000/health
  ```
- [ ] **Confirm frontend access**: Verify the frontend is accessible at [http://localhost:5173](http://localhost:5173).

---

> [!IMPORTANT]
> **Database & Env Requirements**
> Ensure your PostgreSQL instance is running and your `.env` files (specifically `VITE_API_URL` for the frontend and `DATABASE_URL` / `JWT_SECRET` for the backend) are correctly configured before running the environment check.
