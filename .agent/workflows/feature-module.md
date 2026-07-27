---
description: Add or extend an MMS module with Work, Reports, and Setup tabs
---

# Workflow: Feature Module

## Steps

1. Load skills: `mms-module-page`, `mms-module-work`, `mms-module-setup`, `mms-backend-api` (if new REST), `mms-fields-registry` (if registry-driven)
2. Add `{module}ModuleManifest` in `packages/shared` — `tiers`, `setupSubTabs`, `softDelete`, permissions
3. Backend: REST plugin with upsert bulk PUT (never wipe), soft-delete/restore when archives apply
4. Frontend page under `apps/frontend/src/tenant/features/{module}/` — lazy route in `HostRoutes`
5. Wire TanStack Query hooks (`useXxx` / `useXxxMutations`) — not new `useLiveCollection` primary paths
6. Meet gold-standard parity (`mms-module-architecture.md` §7): trash UI, `mutateAsync`, ErrorState, Cmd/Ctrl+N, `canEditSetup`
7. Register nav (`navConfig` + `SYSTEM_MODULES`) + i18n keys (en/ar/ur/fa)
8. Run `pnpm typecheck` and frontend/backend lint as touched

## Rules

`rules/mms-module-architecture.md`, `rules/mms-api-interface.md`, `rules/mms-data-layer.md`, `rules/mms-ui-ux-design.md`, `rules/mms-settings-i18n.md`, `rules/mms-fields.md`
