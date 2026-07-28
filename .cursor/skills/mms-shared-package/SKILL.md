---
name: mms-shared-package
description: Extends @mms/shared with types, settings defaults, module manifests, translation keys, messaging schemas, and pure utilities shared by frontend and backend. Use when adding shared types, formatDate, formatMoney, parsePhoneNumber, manifests, or moving duplicated logic to packages/shared.
---

# @mms/shared Package Workflow

## Structure (typical)

```
packages/shared/src/
  index.ts                 # Named barrel only — no subpath imports in apps
  *Types.ts / *Schemas.ts  # Domain models + Zod
  *ModuleManifest.ts       # Module contracts / permissions metadata
  appTranslations*.ts      # en (SSOT keys) + ar/ur/fa
  messagingSchemas.ts
  brandingTheme.ts / logoBrandColors.ts
  utils.ts                 # formatDate, formatMoney, parsePhoneNumber, …
```

## Add export

1. Add to the right module (or new file) + export from `index.ts`
2. JSDoc on **public** exports only
3. Unit test for non-trivial pure helpers
4. `pnpm typecheck` from repo root
5. Import: `import { X } from '@mms/shared'`

## Do / Don't

| Do | Don't |
|----|-------|
| Named barrel exports | Subpath imports |
| Shared Zod DTOs used by FE + BE | Fork the same shape in both apps |
| `formatDate` / `formatMoney` / `parsePhoneNumber` | Ad-hoc `toLocale*` / currency prefixes |
| Pure functions only | React, Fastify, DB, `localStorage`, DOM |

## Move logic from app

If used in 2+ modules OR FE+BE → extract pure helper → replace duplicates → delete shims.

## Checklist

```
- [ ] Named export from package root
- [ ] JSDoc on public API
- [ ] Unit test for non-trivial pure logic
- [ ] No React/Fastify/browser APIs
- [ ] pnpm typecheck
```

## Done

`mms-completion-review.mdc` · Rules: `mms-dry.mdc`, `mms-settings-i18n.mdc`.
