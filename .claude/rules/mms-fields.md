---
description: Field/tab registry, system vs custom fields, Setup Fields wiring
paths:
  - "apps/frontend/src/lib/contactFieldsStore.ts"
  - "apps/frontend/src/lib/contacts/useContactConfigTabFields.ts"
  - "apps/frontend/src/components/ui/CustomFieldsBuilder.tsx"
  - "apps/frontend/src/components/ui/CoreFieldEditorList.tsx"
  - "apps/frontend/src/components/ui/ModuleFieldsSetup.tsx"
  - "apps/frontend/src/components/ui/ModuleFieldsSetup*.tsx"
  - "apps/frontend/src/tenant/features/**/*Fields*"
  - "apps/frontend/src/tenant/features/**/*Setup*"
  - "packages/shared/src/contactTypes.ts"
  - "packages/shared/src/contactEnabledTabs.ts"
  - "packages/shared/src/contactColumnRegistrySync.ts"
  - "packages/shared/src/contactFieldDependencies.ts"
  - "packages/shared/src/*Field*"
---

# MMS Fields & Registry Specification

Governs column layouts, field schemas, and Setup Fields configuration across the monorepo.

## 1. System vs custom fields

| Kind | Where | Notes |
|------|-------|--------|
| **System fields** | Typed in `@mms/shared` + Drizzle columns | Preferred for core domain data |
| **Custom fields** | Tenant `custom_data` JSONB + field config registries | Constrained via `CustomFieldsBuilder` — not free-form layout engines |

- Free-form dynamic form compilers / visual schema generators are **banned**.
- Custom **tabs** persist in typed `custom_tabs` (composite PK `(workspace_subdomain, id)` + **FORCE RLS**; Drizzle baseline `0000_init`; data migrate `021_migrate_custom_tabs`) via `/api/custom-tabs`. Bulk PUT **upserts** only — never wipe rows absent from the payload. Do not reintroduce object-only tab SSOT; remaining gap is FE Setup dual-write of `formTabs` via `contact_field_config` (`mms-migration-status.md`).
- Tenant-created form tabs (`custom_*`, `isContactCustomCollectionTab`) persist as **row arrays** on the contact (like phones/emails). Blank rows strip on save via `cleanContactDraft`; emptied arrays must persist — `mms-form-architecture.md` §3.
- Column visibility **and width** prefs: server-side user prefs via module column-preferences PUT — clamp with `clampModuleColumnWidth` from `@mms/shared` when persisting `width`; localStorage merge is cache only (local width may win overlay), not SSOT.

## 2. New / changed field checklist

1. **Shared** — type + Zod in `@mms/shared`
2. **Drizzle** — column or `custom_data` key + migration when needed
3. **REST** — `parseRequest` Zod on BE routes
4. **UI** — bind via registry / form draft; `labelKey` only (no hardcoded labels)
5. **Removal** — call `get*FieldRemovalIssues()` before delete (`mms-module-architecture.md` §4)

## 3. Localization

- Prefer `labelKey: AppTranslationKey` resolved with `t(labelKey)`.
- **Ban** English string fallbacks in form components (`t(key) || 'Label'`).

## 4. Tab enablement SSOT (Contacts reference)

- When `formTabs` exist, their `enabled` flags are authoritative for the form, drawer, export, and BE dynamic validation.
- Use `resolveContactEnabledTabIds` from `@mms/shared` — do **not** blind-union `DEFAULT_ENABLED_TABS` onto active `formTabs` (that made Setup toggles cosmetic).
- Locked always-on tabs: `CONTACT_LOCKED_ENABLED_TABS` (`basic`, `custom`). UI locks + `useModuleSettingsEditor({ lockedEnabledTabs })` must force the same keys on sync/save/`enabledTabs`.
- `DEFAULT_ENABLED_TABS` is the **fallback seed** when `formTabs` are absent — not a permanent override.

## 5. Setup Fields save & column sync

- Fields / Preferences draft locally; **Save disabled until dirty** (structural snapshot vs persisted config). Do not leave Save always enabled on first mount.
- On Fields save: persist `fields` / `formTabs` / `enabledTabs` from the editor; sync `columnRegistry` with field/tab enablement (`syncContactColumnRegistryWithFields` or module equivalent).
- CustomFieldsBuilder lists non-core fields; merges must keep core seed fields intact (do not replace the whole tab map with customs only).
- Field delete: run `get*FieldRemovalIssues()` (prefs + columns + usage) before `handleDeleteField`.

## 6. Form & drawer render parity

- Every **enabled** registry / custom field that validation can require must have a control (form) and a read row (detail drawer).
- Ban hard-coded `switch (field.key)` / allowlists that `return null` for unknown keys while Setup can still enable those fields.
