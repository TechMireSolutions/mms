---
name: mms-fields-registry
description: Adds or changes field/tab registries, CustomFieldsBuilder, DraggableFieldList, and Configuration/Fields UI across MMS modules. Use when working with custom fields, system tabs, field types, column registries, or useSortedFields.
---

# MMS Field & Tab Registry

## Schemas (`@mms/shared/contactTypes.ts`)

**Field:** `{ key, label, type, enabled, order, options, permissions, defaultValue }`

**Tab:** `{ key, label, icon, enabled, order, permissions, description, color, isSystem }`

`isSystem` = metadata only. Never branch behaviour on it.

## Add a field type

1. Extend schema in `packages/shared/src/contactTypes.ts`
2. Handle render case in `FormPrimitives.tsx` (contacts) or module equivalent
3. Wire **persistence** — registry save + value on entity save (see Field persistence gate below)
4. `pnpm typecheck` at root

## Field persistence gate (create & review)

Before merging any new/changed field, complete all layers:

```
@shared type → DEFAULT_* + merge → read (getObject/getCollection) → write (save* + /api/db) → UI binding → seeds (if default)
```

| Storage | Write path |
|---------|------------|
| Settings singleton | `getBrandingSettings` / `await saveBrandingSettings`, etc. |
| Collection entity | `saveCollection` with full row object |
| Registry definition | `saveObject('{module}_field_config', …)` |

**Reviewer test:** grep the field key — must appear in type, merge, form, and save. Block if only in `useState`.

See `.cursor/rules/mms-fields.mdc` and `mms-data-layer.mdc`.

## Module field settings

Pattern: `{Module}Settings.tsx` + `CustomFieldsBuilder` + `ui/DraggableFieldList.tsx`

Storage: `{module}_field_config` or module-specific object key via `saveObject`.

## Rendering

```ts
const fields = useSortedFields(registry, tabKey);
// Map to FormPrimitives — enabled only, in order
```

Tables: column registry `{ key, label, enabled, order, sortable, width }`.

## Target (not fully built)

Custom tab → atomic: pgTable + drizzle migration + registry + CRUD routes + tab view.

Current: values live in JSON `collections`/`objects`.

## One DraggableFieldList

Canonical: `apps/frontend/src/components/ui/DraggableFieldList.tsx`. Merge contacts copy when editing either.

## Rules

`.cursor/rules/mms-fields.mdc`, `mms-ui-rendering.mdc`
