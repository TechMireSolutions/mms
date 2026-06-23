---
trigger: model_decision
---

# MMS Fields & Tabs Registry

Setup **Fields** tier behaviour: **`mms-module-setup.md`** (globle.md §6) · persistence: below · workflow: skills `mms-fields-registry`, `mms-module-setup`.

## Universal schemas (in `@mms/shared`)

**Field:** `{ key, label, labelKey?, type, enabled, order, options, permissions, defaultValue }`

**Tab:** `{ key, label, labelKey?, icon, enabled, order, permissions, description, color, isSystem }`

- Prefer **`labelKey: AppTranslationKey`** for new fields/tabs — resolve with `t(labelKey)` at render (`mms-i18n.md`).
- Plain `label` is allowed for seed defaults; user-edited labels persist in registry JSON.

- One schema for default + custom — no parallel contacts-only types.
- `isSystem` = origin metadata only — **never branch behaviour on it**.

## globle.md §6 — fields and tabs (summary)

| § | Rule | Contacts |
|---|------|----------|
| 6.1 | Predefined fields — hide OK, permanent delete banned | `isContactSeedFieldKey()` |
| 6.2 | Custom fields need label, type, tab, visibility, permissions, validation | `CustomFieldsBuilder` |
| 6.3 | Visibility cascade across form, drawer, reports, export, filter, search, mobile | `useVisibleContactFields`, column registry |
| 6.4 | Field belongs to one tab; move without data loss | `DraggableFieldList` reorder |
| 6.5 | Required enforced on create/edit/import/bulk; guide to tab on error | Zod + `ContactForm` |
| 6.6 | Archive preferred; delete only after dependency check | `getContactFieldRemovalIssues()` |

Full detail: **`mms-module-setup.md`**.

## Configuration/Fields tab

- Manages **fields and tabs** together — no separate Tabs screen.
- Multi-table modules: one Fields section per logical table.
- Edits apply immediately to forms, tables, exports.

## Default = custom

Defaults seed through the same pipeline as user-created fields. Fully editable (label, type, order, enabled, options, permissions, defaultValue). No read-only “system” fields in the Fields UI.

## Rendering

```tsx
// Forms: FormPrimitives + useSortedFields
// Tables: column registry — enabled columns in order
// Init: field.defaultValue — not hardcoded useState defaults
```

**Form progress/completeness** must be config-driven: score only **enabled fields in enabled tabs** (via `calculateProfileCompleteness(contact, fieldConfig)`), so an empty new record reads 0% and the denominator follows the registry. Never hardcode a fixed field list/weights for a form progress bar.

**DraggableFieldList:** `components/ui/DraggableFieldList.tsx` (generic) + `components/ui/ContactDraggableFieldList.tsx` (contacts). Do not add a third variant.

## Tab management (target)

Drag-drop reorder · Lucide icon picker · user colour · per-role `permissions` · disabled = hidden but data kept · tab state persisted per session.

## Custom provisioning (target — not fully built)

| Action | Must provision atomically |
|--------|---------------------------|
| Custom field | Column + registry entry + form/table binding |
| Custom tab | Table + Drizzle migration + registry + CRUD routes + tab view |
| Delete field | Dependency check + registry + UI references — **Contacts:** `contactFieldDependencies.ts` |
| Delete tab | Cascade table, data, routes, config |
| Disable | Hide UI only — preserve data |

## Current vs target

| Topic | Current | Target |
|-------|---------|--------|
| Storage | JSON in `collections`/`objects` | Relational columns/tables for custom defs |
| Contact forms | Registry-driven (`FormPrimitives`) | All modules same pattern |
| `DynamicField.tsx` | Deleted | Stay deleted — use FormPrimitives |
| Module field settings | Mix of hardcoded + builder | Full `CustomFieldsBuilder` |

## Field persistence gate (required — create & review)

Any PR that **adds or changes a stored field** must prove the value reaches **SQLite** (via `/api/db/*`), not UI-only or local-only state.

### Checklist (every new/changed field)

| # | Layer | Requirement |
|---|--------|-------------|
| 1 | `@mms/shared` | Field on interface/type or registry schema |
| 2 | Defaults | Present in `DEFAULT_*` and **merge/sanitize** helper (e.g. `mergeBrandingSettings`, `mergeGlobalSettings`) |
| 3 | Read | Loaded via `getObject` / `getCollection` / typed `get*Settings()` / registry — not hardcoded-only in component |
| 4 | Write | Save handler includes the field; persists through `saveObject`, `saveCollection`, or typed `save*Settings()` that syncs to server |
| 5 | UI | Control bound to persisted state (`upd`, registry `key`, `onChange` → save path) — **not** orphaned `useState` |
| 6 | Seeds | Updated in `seeds.json` and frontend seed constants when part of default documents |
| 7 | Backend | `POST /api/db/objects/:key` or collection route receives full shape; merge on write when partial payloads are possible |
| 8 | Review | `rg` field key across type, default, merge, form, save — all must match |

### By storage kind

| Kind | Persist how |
|------|-------------|
| Singleton settings (`branding`, `global_settings`, `{module}_settings`) | Typed get/save in `db.ts`; **await** server on explicit Save — see `mms-data-layer.md` |
| Collection rows (`contacts`, `students`, …) | `saveCollection` / `useLiveCollection` + full row in array write |
| Registry defs (`contact_field_config`, column registry) | `saveObject` on config key; field values live on collection documents |
| Custom field values | Written on parent record save — same collection POST as parent entity |

### Banned

- Field exists in UI/type but **missing from merge helper** (silently dropped on save)
- Field only in React state — never reaches `saveObject` / `saveCollection`
- Settings **Save** shows success without confirmed `POST /api/db/*` response
- New registry field with no path to `contact_field_config` (or module equivalent) + form/table binding

### Reviewer prompt

> “Show me the line where this field is written to the database.”

If none exists, block the change until wired.

## Validation

- Dynamic contact fields: Zod via `ContactConfigContext` / `buildCustomFieldSchema`
- Other modules: Zod or shared pure validators in `@mms/shared` before save (`mms-testing.md` for non-trivial validators)
