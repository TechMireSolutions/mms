---
name: mms-fields-registry
description: Adds or changes field/tab registries, CustomFieldsBuilder, DraggableFieldList, and Setup Fields UI per globle.md §6. Use when working with custom fields, system tabs, field types, column registries, field delete guards, or useSortedFields.
---

# MMS Field & Tab Registry

**Source:** [`globle.md`](../../globle.md) §6 · Rules: `mms-fields.mdc`, `mms-module-setup.mdc` · Skill: `mms-module-setup` for full Setup workflow.

## Schemas (`@mms/shared/contactTypes.ts`)

**Field:** `{ key, label, labelKey?, type, enabled, order, options, permissions, defaultValue, required?, unique? }`

**Tab:** `{ key, label, labelKey?, icon, enabled, order, permissions, description, color, isSystem }`

`isSystem` = metadata only. Never branch behaviour on it.

## globle.md §6 checklist

| § | Action |
|---|--------|
| 6.1 | Seed fields (`INITIAL_FIELD_SEED`) — block permanent delete |
| 6.2 | Custom field: label, type, tab, visibility, permissions, validation |
| 6.3 | Cascade hide/disable to form, drawer, reports, export, filter, search, mobile |
| 6.4 | One tab per field; reorder without data loss |
| 6.5 | Required flag → create/edit/import validation + tab focus on error |
| 6.6 | Before delete: `getContactFieldRemovalIssues()` (Contacts) or module equivalent |

## Add a field type

1. Extend schema in `packages/shared/src/contactTypes.ts`
2. Handle render case in `FormPrimitives.tsx` (contacts) or module equivalent
3. Wire **persistence** — registry save + value on entity save (see Field persistence gate below)
4. `pnpm typecheck` at root

## Field delete guard (§6.6)

**Contacts:** `packages/shared/src/contactFieldDependencies.ts`

```typescript
getContactFieldRemovalIssues({ fieldKey, columnRegistry, prefs, contacts })
```

Checks: seed field, enabled column, duplicate-detection prefs, contact data count. Extend for reports/filters/templates in other modules.

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

See `mms-fields.mdc` and `mms-data-layer.mdc`.

## Module field settings

Pattern: `{Module}SettingsPanel` + `CustomFieldsBuilder` + `ContactDraggableFieldList` / `DraggableFieldList`

Storage: `{module}_field_config` or contract `configObjectKey` via `saveObject`.

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

Canonical: `apps/frontend/src/components/ui/DraggableFieldList.tsx`. Contacts: `ContactDraggableFieldList.tsx`. Do not add a third variant.

## Rules

`mms-fields.mdc`, `mms-module-setup.mdc`, `mms-ui-rendering.mdc`

## Related skills

`mms-module-setup`, `mms-contacts`, `mms-module-page`
