---
description: Field/tab registry, system vs custom fields, Setup Fields wiring — applies to tenant and platform
paths:
  - "apps/frontend/src/lib/contactFieldsStore.ts"
  - "apps/frontend/src/lib/contacts/useContactConfigTabFields.ts"
  - "apps/frontend/src/components/ui/CustomFieldsBuilder.tsx"
  - "apps/frontend/src/components/ui/CoreFieldEditorList.tsx"
  - "apps/frontend/src/components/ui/ModuleFieldsSetup.tsx"
  - "apps/frontend/src/components/ui/ModuleFieldsSetup*.tsx"
  - "apps/frontend/src/tenant/features/**/*Fields*"
  - "apps/frontend/src/tenant/features/**/*Setup*"
  - "apps/frontend/src/platform/**/*Fields*"
  - "apps/frontend/src/platform/**/*Setup*"
  - "packages/shared/src/contactTypes.ts"
  - "packages/shared/src/contactEnabledTabs.ts"
  - "packages/shared/src/contactColumnRegistrySync.ts"
  - "packages/shared/src/contactFieldDependencies.ts"
  - "packages/shared/src/*Field*"
---

# MMS Fields & Registry Specification

**Workflow skills:** registry/types → `mms-fields-registry` · Setup Fields/Preferences UI → `mms-module-setup` · FormModal binding → `mms-form-architecture` · Schema migrations → `mms-schema-migrate` · Backend API → `mms-backend-api`.

Governs column layouts, field schemas, and Setup Fields configuration across the monorepo.

## 1. System vs custom fields

| Kind | Where | Notes |
|------|-------|--------|
| **System fields** | Typed in `@mms/shared` + Drizzle columns | Core domain attributes in dedicated, typed columns |
| **Custom fields & tabs** | Typed in `@mms/shared` + concrete relational tables / typed columns | Registry-configured and strictly typed — zero untyped JSONB/EAV blobs |

- Free-form dynamic form compilers / visual schema generators and generic EAV key/value stores are **banned** — forms are strictly registry- and shared-schema-driven with concrete typed persistence.
- Tenant-created custom collections persist via **dedicated child/junction tables** (e.g. contact addresses, phones, emails). Blank rows strip on save via `cleanContactDraft`; emptied arrays must persist — `mms-form-architecture.md` §3.
- Column visibility **and width** prefs → **`mms-module-architecture.md` §3** (local width wins; clamp with `clampModuleColumnWidth`).

## 2. New / changed field checklist

1. **Shared** — type + Zod in `@mms/shared` (`FIELD_TYPES_META`, `createFormCustomFieldHelpers`, field config schemas) with `.strict()`
2. **Drizzle** — dedicated typed column or relational child table + forward-only migration generated via `drizzle-kit generate` (`mms-schema-migrate`)
3. **REST** — `parseRequest` Zod on BE routes; field values via shared Zod builders driven by registry type — no ad-hoc `typeof` switches in handlers
4. **UI** — bind via registry / form draft; `labelKey` only (no hardcoded labels)
5. **Removal** — call `getFieldRemovalIssues()` / `get*FieldRemovalIssues()` before delete to check dependency conflicts (`createFieldRemovalIssuesChecker` in `@mms/shared`)
6. **Validation** — entity save routes validate via shared Zod schemas (`safeParse`) — client validation is UX only

## 3. Localization

- Prefer `labelKey: AppTranslationKey` resolved with `t(labelKey)`.
- **Ban** English string fallbacks in form components (`t(key) || 'Label'`).

## 4. Tab enablement SSOT (Contacts reference)

- When `formTabs` exist, their `enabled` flags are authoritative for the form, drawer, export, and BE dynamic validation.
- Use `resolveContactEnabledTabIds` from `@mms/shared` — do **not** blind-union `DEFAULT_ENABLED_TABS` onto active `formTabs` (that made Setup toggles cosmetic).
- Locked always-on tabs: `CONTACT_LOCKED_ENABLED_TABS` (`basic` only). Pass a **stable** `readonly` array/const for `lockedEnabledTabs` (module-level or memoized) — never inline `[...CONST]` / new array literals each render (unstable identity → infinite rehydrate). Retired seed `custom` is not locked — omit unless field-config still has fields under `tabId: "custom"`.
- `DEFAULT_ENABLED_TABS` is the **fallback seed** when `formTabs` are absent — not a permanent override.

## 4b. Contact-linked module Identity (Students & Teachers)

- Identity fields (student/teacher contact link, gender, DOB, relationships) are **validation/display** registry config — person data SSOT remains Contacts.
- Do not treat enabling those fields as permission to dual-write profile keys onto `students` or `teachers` domain rows when `contactId` is set — strip/hydrate rules → `mms-data-layer.md` / `mms-form-architecture.md`.

## 5. Form & drawer render parity

- Every system / core field that validation can require must have a control (form) and a read row (detail drawer).
- Ban hard-coded `switch (field.key)` / allowlists that `return null` for unknown keys for active fields.

