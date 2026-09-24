---
name: mms-shared-package
description: Extends @mms/shared with types, settings defaults, module manifests, translation keys, messaging schemas, and pure utilities shared by frontend and backend. Use when adding shared types, formatDate, formatMoney, parsePhoneNumber, manifests, or moving duplicated logic to packages/shared. Do NOT use for DOM/React-specific UI components (use mms-frontend) or Fastify backend-only services (use mms-backend-api).
license: Proprietary
metadata:
  owner: mms-platform
  last-verified: 2026-09-24
---

# @mms/shared Package Workflow

**Rules (norms SSOT):** `mms-dry.mdc` · `mms-performance.mdc` §4 · `mms-settings-i18n.mdc` · `mms-structure-naming.mdc`.

## 1. Architectural Boundaries & Purity

- **Leaf-Package Purity**: Pure TypeScript only. Zero React, DOM (`window`, `document`), Fastify, Drizzle, DB, or Node.js built-ins (`node:*`).
- **Single Barrel Export**: Named exports only via `packages/shared/src/index.ts`. No subpath imports (`@mms/shared/*` is forbidden).
- **Erasable Syntax Only**: Union types and `as const` objects only. Zero `enum` or `namespace`. Use native immutable array methods (`toSorted()`, `toReversed()`).

## 2. Shared Contracts & DTOs

- **Strict Validation**: All write Zod schemas must enforce `.strict()` to reject unknown keys. Sanitize strings against Unicode RTL spoofing (`safeString`).
- **Explicit Inferred DTOs**: Always export paired types: `Insert[Entity]Dto`, `Update[Entity]Dto`, and `[Entity]ResponseDto`.
- **Date Standards**: Use `isoDateSchema` (`YYYY-MM-DD` regex + calendar existence check) or `isoDateOrEmptySchema`. Compare with `compareIsoDates()`.
- **Soft-Delete Contracts**: Use `softDeleteBodySchema`, `bulkIdsBodySchema` (max 500 IDs, `.strict()`), and `isQueryFlagTrue()` for `includeDeleted` query flags. Strip server-owned audit fields from writes via helpers.
- **Manifest Contracts**: Modules define `*ModuleManifest.ts` declaring permissions, routes, and `softDelete` configuration.

## 3. Workflow & Verification

1. Place domain models in `packages/shared/src/*Types.ts` or `*Schemas.ts`.
2. Add pure utilities to `utils.ts` (e.g., `formatDate`, `formatMoney`, `parsePhoneNumber`).
3. Export from `index.ts` with JSDoc on public symbols.
4. Verify leaf-package purity and typing:

```bash
bash scripts/check-shared-exports.sh
pnpm typecheck
```
