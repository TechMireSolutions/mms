---
name: mms-shared-package
description: Extends @mms/shared with types, settings defaults, contact schemas, and pure utilities shared by frontend and backend. Use when adding shared types, formatDate, formatMoney, parsePhoneNumber, settings interfaces, or moving duplicated logic to packages/shared.
---

# @mms/shared Package Workflow

## Structure

```
packages/shared/src/
  index.ts              # Re-exports
  contactTypes.ts       # Contact, FieldDefinition, TAB_REGISTRY, …
  settingsTypes.ts      # GlobalSettings, SYSTEM_MODULES, SYSTEM_MODULE_NAV, DEFAULT_*, image optimize
  brandingTheme.ts      # CSS token derivation, light/dark surfaces, WCAG AA contrast
  logoBrandColors.ts    # Accessible primary/secondary from logo palette
  logoPaletteSampling.ts
  utils.ts              # formatDate, formatMoney, parsePhoneNumber, toTitleCase, applyTitleCaseRecursive, …
```

Unit tests: `brandingTheme.test.ts`, `logoBrandColors.test.ts` — add tests for new pure helpers.

## Add export

1. Add to appropriate file (or new file + export from `index.ts`)
2. JSDoc on **public** exports only
3. `pnpm typecheck` from repo root (turbo builds shared first)
4. Import in apps: `import { X } from '@mms/shared'`

## Move logic from app

If used in 2+ modules OR frontend + backend:

1. Extract pure function (no React, no Fastify, no localStorage)
2. Add to `utils.ts` or new typed module
3. Replace duplicates in apps
4. Remove legacy shim if `contactFields.ts` only re-exported

## Do not add to shared

- React components (stay in `apps/frontend/src/components/ui/`)
- DB access, route handlers
- Browser-only APIs without abstraction

## Build order

`@mms/shared` must build before apps (`dependsOn: ["^build"]` in turbo.json).

## Rules

`.cursor/rules/mms-dry.md`
