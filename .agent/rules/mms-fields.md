---
trigger: model_decision
---

# MMS Fields & Registry Specification

Governs column layouts, field schemas, and Setup Fields configuration across the monorepo.

## 1. System vs custom fields

| Kind | Where | Notes |
|------|-------|--------|
| **System fields** | Typed in `@mms/shared` + Drizzle columns | Preferred for core domain data |
| **Custom fields** | Tenant `custom_data` JSONB + field config registries | Constrained via `CustomFieldsBuilder` — not free-form layout engines |

- Free-form dynamic form compilers / visual schema generators are **banned**.
- Custom **tabs** remain JSON-document store until table+CRUD ships (`mms-migration-status.md`).
- Column visibility prefs: server-side user prefs — not per-component localStorage SSOT.

## 2. New / changed field checklist

1. **Shared** — type + Zod in `@mms/shared`
2. **Drizzle** — column or `custom_data` key + migration when needed
3. **REST** — `parseRequest` Zod on BE routes
4. **UI** — bind via registry / form draft; `labelKey` only (no hardcoded labels)
5. **Removal** — call `get*FieldRemovalIssues()` before delete (`mms-module-architecture.md` §4)

## 3. Localization

- Prefer `labelKey: AppTranslationKey` resolved with `t(labelKey)`.
- **Ban** English string fallbacks in form components (`t(key) || 'Label'`).
