---
name: mms-fields-registry
description: Adds or changes field/tab registries, CustomFieldsBuilder, DraggableFieldList, and Setup Fields UI per mms-fields.md. Use when working with custom fields, system tabs, field types, column registries, field delete guards, or useSortedFields.
---

# MMS Field & Tab Registry

**Source:** Rules: `mms-fields.md`, `mms-module-architecture.md` · Skill: `mms-module-setup` for full Setup workflow.

## Schemas (`@mms/shared/contactTypes.ts`)

**Field:** `{ key, label, labelKey?, type, enabled, order, options, permissions, defaultValue, required?, unique? }`

**Tab:** `{ key, label, labelKey?, icon, enabled, order, permissions, description, color, isSystem }`

`isSystem` = metadata only. Never branch behaviour on it.

## Fields & Tabs Checklist

| Requirement | Action |
|---|--------|
| Seed fields | Block permanent delete on initial system fields |
| Custom fields | Validate label, type, tab, visibility, permissions, validation |
| Cascading rules | Hide/disable in forms, drawers, reports, exports, filters, search, mobile |
| Tab mapping | Ensure one tab per field; support reordering without data loss |
| Required fields | Enforce in validation and scroll to/focus tab on error |
| Deletions | Check dependencies using `getContactFieldRemovalIssues()` or equivalent before deleting |
## Add a field type

1. Extend schema in `packages/shared/src/contactTypes.ts`
2. Handle render case in `FormPrimitives.tsx` (contacts) or module equivalent
3. Wire **persistence** — registry save + value on entity save (see Field persistence gate below)
4. `pnpm typecheck` at root

## Field delete guard

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

See `mms-fields.md` and `mms-data-layer.md`.

## Module field settings

Pattern: `{Module}SettingsPanel` + `CustomFieldsBuilder` + `ContactDraggableFieldList` / `DraggableFieldList`

Storage: `{module}_field_config` or contract `configObjectKey` via `saveObject`.

## Rendering

```ts
const fields = useSortedFields(registry, tabKey);
// Map to FormPrimitives — enabled only, in order
```

Tables: column registry `{ key, label, enabled, order, sortable, width }`.

## Target Architecture & Form Specification

All custom field configurations, registries, and dynamic form behaviors must conform to the **MMS Dynamic Form Architecture**. Refer to [mms-form-architecture.md](../rules/mms-form-architecture.md) (or the corresponding Cursor rule `mms-form-architecture.md`) for the full specifications on:
- Monorepo package boundaries and ESM isolation.
- Branded types (`FieldId`, `TabId`, etc.) and validation factory patterns.
- Math safeguards and decimal precision handling for numbers and currency.
- Row-Level Security transaction scope and JSONB deep merge operations.
- Client-side memoized validation compilation and uncontrolled React 19 inputs prevention.

## One DraggableFieldList

Canonical: `apps/frontend/src/components/ui/DraggableFieldList.tsx`. Contacts: `ContactDraggableFieldList.tsx`. Do not add a third variant.

## Rules

`mms-fields.md`, `mms-module-architecture.md`, `mms-ui-ux-design.md`

## Related skills

`mms-module-setup`, `mms-form-architecture`, `mms-module-page`
