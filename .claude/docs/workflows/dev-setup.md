---
description: Install dependencies, verify environment, and start MMS dev servers
---

# Workflow: Dev Setup

This workflow guides the process of setting up, verifying, and running the local development environment for the MMS monorepo in strict adherence to the project's infrastructure rules.

## Phase 1: Prerequisites & Environment Verification

- [ ] **Load setup skill**: Invoke the `mms-dev-setup` skill to ensure context for infrastructure.
- [ ] **Review infrastructure rules**: Read `rules/mms-ops-infrastructure.md` and `rules/mms-core.md` to understand port assignments and layering.
- [ ] **Run environment check**: Verify the rigid environment constraints (Node >=24.14, PostgreSQL) using the dedicated script:
  ```bash
  bash .agent/skills/mms-dev-setup/scripts/verify-env.sh
  ```
- [ ] **Validate environment variables**:
  - `VITE_API_URL` (Frontend)
  - `JWT_SECRET` (Backend)
  - `DATABASE_URL` (Backend PostgreSQL connection string)

## Phase 2: Dependency Installation & Health Check

- [ ] **Install dependencies**: Use `pnpm` exclusively (as defined by the `packageManager` field) to install workspace dependencies.
- [ ] **Run typecheck**: Ensure there are no TypeScript compilation errors before attempting to start servers.
  ```bash
  pnpm install && pnpm typecheck
  ```

## Phase 3: Database Preparation

- [ ] **Database sync**: Ensure the local database matches the current schema. Use forward-only migrations; do not use `drizzle-kit push` on shared/production databases (per `mms-schema-migrate`).

## Phase 4: Server Orchestration

- [ ] **Start dev servers**: Run the restart script to orchestrate the backend (Fastify, port 3000) and frontend (Vite, port 5173) servers.
  ```bash
  # Option A: Run in background using GNU screen (default)
  ./restart_servers.sh
  
  # Option B: Run in the foreground of the current terminal
  ./restart_servers.sh --foreground
  ```

## Phase 5: Validation

- [ ] **Confirm backend health**: Verify the Fastify backend is responding on port 3000.
  ```bash
  curl http://localhost:3000/health
  ```
- [ ] **Confirm frontend access**: Verify the React 19 / Vite frontend is accessible at [http://localhost:5173](http://localhost:5173).

---

> [!CAUTION]
> **Strict Versioning**
> The MMS monorepo strictly requires Node.js `>=24.14` and `pnpm`. Failing to use these exact tools will result in execution failures and dependency lockfile drift.
