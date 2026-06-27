---
description: Add or extend an MMS module with Work, Reports, and Setup tabs
---

# Workflow: Feature Module

## Steps

1. Load skills: `mms-module-page`, `mms-fields-registry`, `mms-data-sync`
2. Add types/defaults to `packages/shared/src/settingsTypes.ts` if new module settings
3. Create page in `apps/frontend/src/pages/` with three tiers
4. Register lazy route in `App.tsx` + sidebar entry
5. Wire data via `useLiveCollection` / `getCollection`
6. Add `*Settings.tsx` (Fields + Preferences) — reuse in `/settings`
7. Run `pnpm typecheck` and `pnpm lint` (frontend)

## Rules

`rules/mms-ui-ux-design.md`, `rules/mms-settings-i18n.md`, `rules/mms-fields.md`
