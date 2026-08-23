---
name: mms-shared-package
description: Extends @mms/shared with types, settings defaults, module manifests, translation keys, messaging schemas, and pure utilities shared by frontend and backend. Use when adding shared types, formatDate, formatMoney, parsePhoneNumber, manifests, or moving duplicated logic to packages/shared.
---

# @mms/shared Package Workflow

**Rules (norms SSOT):** `mms-dry.mdc` · formatters / `t()` keys → `mms-settings-i18n.mdc`. Pure helpers only — no React/Fastify/DB/DOM.

## Structure (typical)

```
packages/shared/src/
  index.ts                 # Named barrel only — no subpath imports in apps
  *Types.ts / *Schemas.ts  # Domain models + Zod schemas
  constants/               # Metadata registries and defaults
  createFormCustomFieldHelpers.ts # System-vs-custom field partitioning factory
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

## Shared Contract Standards (`packages/shared/src/...`)

1. **Deterministic Contract Typing**: Route definitions, parameters, write payloads, and response envelopes must be strictly derived from `@ts-rest` contracts.
2. **Strict Validation & Sanitization**: Define write schemas using Zod with `.strict()` enforcement to reject unknown keys. Use a `safeString` Zod transform to prevent Unicode Directional Spoofing (e.g., Right-to-Left Override attacks `U+202E`).
3. **DTO Type Exports**: Export explicit Insert, Update, and Response DTO types inferred from the Zod schemas:
   ```ts
   export const insertEntitySchema = z.object({ ... }).strict();
   export type InsertEntityDto = z.infer<typeof insertEntitySchema>;
   export const updateEntitySchema = insertEntitySchema.partial().strict();
   export type UpdateEntityDto = z.infer<typeof updateEntitySchema>;
   export const entityResponseSchema = z.object({ ... }).strict();
   export type EntityResponseDto = z.infer<typeof entityResponseSchema>;
   ```
4. **1:1 Alignment**: Ensure Zod schemas align 1:1 with Drizzle PostgreSQL table definitions.

## Do / Don't

| Do | Don't |
|----|-------|
| Named barrel exports | Subpath imports |
| Shared Zod DTOs with `.strict()` used by FE + BE | Fork the same shape in both apps |
| Export explicit `Insert*Dto`, `Update*Dto`, `*ResponseDto` | Use untyped `any` or ad-hoc inline payload types |
| `formatDate` / `formatMoney` / `parsePhoneNumber` / `normalizeToE164` | Ad-hoc `toLocale*` / currency prefixes |
| `applyTitleCaseRecursive` for Latin/display names | Title-casing ar/ur/fa / non-Latin / free-form RTL prose — `mms-structure-naming.mdc` |
| Soft-delete strip helpers (`stripContactClientSoftDeleteFields`) | Accepting client `deletedAt` on write DTOs |
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

`mms-completion-review.mdc` · Rules: `mms-dry.mdc`, `mms-settings-i18n.mdc`, `mms-structure-naming.mdc` (Title Case scope).
