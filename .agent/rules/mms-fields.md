---
trigger: model_decision
description: Field/tab registry, system vs custom fields, Setup Fields wiring — applies to tenant and platform
---

# MMS Fields & Registry Specification

**Workflow skills:** registry/types → `mms-fields-registry` · Setup Fields/Preferences UI → `mms-module-setup` · FormModal binding → `mms-form-architecture` · Schema migrations → `mms-schema-migrate` · Backend API → `mms-backend-api`.

## 1. System vs Custom Fields

- **System fields**: Typed in `@mms/shared` + concrete Drizzle columns (core domain attributes in dedicated columns).
- **Custom fields & tabs**: Typed in `@mms/shared` + concrete relational tables / typed columns. Dynamic form compilers and untyped JSONB/EAV blobs are strictly banned.
- Tenant-created custom collections persist via dedicated child/junction tables (addresses, phones, emails). Blank rows strip on save via `cleanContactDraft`; empty arrays are authoritative (`mms-form-architecture.md` §3).
- Column visibility and width preferences follow `mms-module-architecture.md` §3 (local width takes precedence; clamp with `clampModuleColumnWidth`).

## 2. New / Changed Field Checklist

1. **Shared**: Strict type and Zod schema in `@mms/shared` (`FIELD_TYPES_META`, `createFormCustomFieldHelpers`, field configs).
2. **Drizzle**: Dedicated typed column or relational table + forward-only migration via `drizzle-kit generate` (`mms-schema-migrate`).
3. **REST**: `parseRequest` Zod on backend routes; builders driven by registry types (no ad-hoc `typeof` switches).
4. **UI**: Bind via registry/form draft; `labelKey` only (no hardcoded labels).
5. **Removal**: Call `getFieldRemovalIssues()` before delete to check dependency conflicts.
6. **Validation**: Save routes validate via shared Zod schemas (`safeParse`); client validation is UX-only.
7. **Soft-Delete Uniqueness**: Recyclable unique fields (`email`, `phone`, `student_id`) require partial unique indexes `WHERE deleted_at IS NULL` (`mms-soft-delete`).

## 3. Localization

- Field definitions require `labelKey: AppTranslationKey` resolved via `t(labelKey)`. English string fallbacks (`t(key) || 'Label'`) are strictly banned.

## 4. Tab Enablement SSOT (Contacts Reference)

- Active `formTabs.enabled` flags are authoritative for forms, drawers, exports, and backend dynamic validation.
- Resolve tab IDs via `resolveContactEnabledTabIds` from `@mms/shared` (never blind-union `DEFAULT_ENABLED_TABS`).
- `CONTACT_LOCKED_ENABLED_TABS` (`basic` only) must be passed as a stable, memoized reference to prevent infinite re-renders.

## 5. Contact-Linked Module Identity (Students & Faculty)

- Identity fields (contact link, gender, DOB, relationships) are validation/display registry configs; Contacts remains the person data SSOT.
- Dual-writing person profile keys onto `students` or `faculty` tables when `contactId` is set is strictly banned (`mms-data-layer.md`).

## 6. Form & Drawer Render Parity

- Every active system or core field that validation can require must have a form control and a read row in the detail drawer. Ban hardcoded allowlists that return null for active fields.

## 7. Entity Presentation Descriptor Adapter

- Bridge runtime `FieldConfig` into `EntityDescriptor<T>` via `createEntityDescriptorFromFieldConfig` (`@/components/common/entityDescriptorFromFieldConfig`).
- Preserves dynamic field ordering, drawer grouping, and visibility rules. Card metadata components support merge mode (`extraColumns`) to compose descriptor tiles with custom chrome.
