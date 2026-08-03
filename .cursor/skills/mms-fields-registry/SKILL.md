---
name: mms-fields-registry
description: Adds or changes field/tab registries, CustomFieldsBuilder, DraggableFieldList, and Setup Fields UI per mms-fields.mdc. Use when working with custom fields, system tabs, field types, column registries, field delete guards, or useSortedFields.
---

# MMS Field & Tab Registry

**Rule (norms SSOT):** `mms-fields.mdc`. Also `mms-module-architecture.mdc` §4. Full Setup workflow → skill **`mms-module-setup`**. FormModal / Zod / JSONB merge → **`mms-form-architecture`**.

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
@shared type → DEFAULT_* + merge → read (typed REST / Query) → write (typed REST) → UI binding → seeds (if default)
```

| Storage | Write path |
|---------|------------|
| Settings singleton | `getBrandingSettings` / `await saveBrandingSettings`, etc. |
| Lookup option list | Contacts: `/api/contacts/lookups` (typed `contact_lookups`) — **never** `saveCollection` for genders/labels/`countryCodes` |
| REST entity row (Contacts, Students, …) | Query mutations → `/api/{resource}` — **never** `saveCollection('contacts')` |
| Registry definition | Contacts: `/api/contacts/field-config` (typed). Other modules may still use `saveObject('{module}_field_config', …)` until migrated |
| Custom Tabs | Typed `custom_tabs` + `/api/custom-tabs` — Contacts closed; do not dual-write `formTabs` into field-config. Other modules may still lag |

**Reviewer test:** grep the field key — must appear in type, merge, form, and save. Block if only in `useState`.

See `mms-fields.mdc` and `mms-data-layer.mdc`.

## Module field settings

Pattern: `{Module}SettingsPanel` + `CustomFieldsBuilder` + `ContactDraggableFieldList` / `DraggableFieldList`

Storage: Contacts → `/api/contacts/field-config`. Other modules → `{module}_field_config` or contract `configObjectKey` via `saveObject` until migrated.

## Rendering

```ts
const fields = useSortedFields(registry, tabKey);
// Map to FormPrimitives — enabled only, in order
```

Tables: column registry `{ key, label, enabled, order, sortable, width }`.

**Form + drawer parity:** every enabled registry/custom field that validation can require must render a control (form) and a read row (drawer). Ban hard-coded key switches that `return null` for unknown Setup fields.

## Tab enablement SSOT (Contacts)

- Prefer `resolveContactEnabledTabIds` — when `formTabs` exist they win; do not blind-union `DEFAULT_ENABLED_TABS`.
- Locked tabs: `CONTACT_LOCKED_ENABLED_TABS` (`basic`, `custom`) + `useModuleSettingsEditor({ lockedEnabledTabs })` on save/sync.
- Fields Save: dirty-gated; sync `columnRegistry` via `syncContactColumnRegistryWithFields` on Fields save.

## Forms

Entity create/edit uses **static** `FormModal` + shared Zod — **ban** dynamic form compilers / memoized validation compilation. Norms → `mms-form-architecture.mdc` · skill **`mms-form-architecture`**.

## One DraggableFieldList

Canonical: `apps/frontend/src/components/ui/DraggableFieldList.tsx`. Contacts: `ContactDraggableFieldList.tsx`. Do not add a third variant.

## Rules

`mms-fields.mdc`, `mms-module-architecture.mdc`, `mms-ui-ux-design.mdc`

## Related skills

`mms-module-setup`, `mms-form-architecture`, `mms-module-page`
