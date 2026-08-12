---
name: mms-module-setup
description: Implements or modifies module Setup tier per mms-module-architecture.mdc — Fields sub-tab, Preferences sub-tab, field dependency checks, setup audit, prefs cascade. Use when editing ContactsSettingsPanel, CustomFieldsBuilder, module preferences, or Setup sub-tabs.
---

# MMS Module Setup Workflow

**Source:** Rules: `mms-module-architecture.mdc`, `mms-fields.mdc`, `mms-settings-i18n.mdc`

## When to use

- Adding/editing **Setup → Fields** (tabs, custom fields, column registry)
- Adding/editing **Setup → Preferences** (defaults, colours, duplicate rules, workflow)
- Module-specific Setup sub-tabs (e.g. Contacts Sync)
- Field/tab delete guards, setup audit, config cascade

For full module page shell, use skill **`mms-module-page`**. For field types/registry schema, use **`mms-fields-registry`**.

## Setup tier structure

```
Setup (tier id: setup)
├── SubTabBar
│   ├── fields       ← Fields Customization
│   ├── preferences  ← Module Preferences
│   └── {contract.setupSubTabs extras}
```

Register sub-tab ids in `{Module}ModuleManifest.setupSubTabs`.

Drive Setup SubTabBar from the manifest (Hasanat / Examinations / Users pattern) — do not hardcode tab ids in the page.

Gate edits with `canEditSetup`: show SubTabBar even when view-only; use a read-only message (or view-only panels) instead of silently omitting Setup. Prefer `saveSettingsAsync` / awaited mutations for Preferences saves. Contacts lookup option lists (`genders`, labels, `countryCodes`) use **`/api/contacts/lookups`** Query/mutation — await before claiming saved.

## Contacts reference map

| Requirement | Component / file |
|-------------|------------------|
| Setup Audit | `logSetupAudit` → `POST /api/contacts/setup-audit` |
| Fields UI | `ContactsSettingsPanel.tsx` (mode `fields`) |
| Field delete guard | `getContactFieldRemovalIssues()` in `@mms/shared` |
| Preferences UI | `ContactsSettingsPanel.tsx` (mode `preferences`) |
| Countries & dial codes | `ContactsCountryCodesSection.tsx` → `updateCountryCodes` / `PUT /api/contacts/lookups/countryCodes` |
| Option lists (gender/labels/…) | `useContactStandardConfig` (via `createStandardModuleConfigHook`) + `EditableSelect` `onUpdateOptions` → `/api/contacts/lookups/:kind` |
| Default Preferences | `preferencesStorage.ts` + `PUT /api/contacts/preferences` |
| Sync settings extra tab | `ContactSyncPanel.tsx` |
| Config DB store | typed `contact_field_configs` / `contact_module_preferences` / `contact_user_column_prefs` REST; lookups via `/api/contacts/lookups` |
| Config hook | `createStandardModuleConfigHook` → `useContactStandardConfig` (`lib/contacts/useContactStandardConfig.ts`), surfaced via `ContactConfigProvider` in `TenantScopedProviders` (tenant host only) |

## Workflow: add Setup Fields capability

1. Extend schema/types in `@mms/shared` (`customFieldConfigSchema` `.strict()`, `FIELD_TYPES_META`, `buildDynamicValidationSchema`, `createFormCustomFieldHelpers`) per `DFS.md` §3. File paths: `packages/shared/src/schemas/dynamicFormSchemas.ts`, `constants/fieldTypesMeta.ts`, `utils/dynamicSchemaBuilder.ts`.
2. Add UI in `{Module}SettingsPanel` — `CustomFieldEditor` + `@hello-pangea/dnd` Tab & Field Builder (`DFS.md` §5.2/§5.3). All labels via `t()` — no hardcoded strings (en/ar/ur/fa + RTL, `DFS.md` §5.7).
3. Wire visibility cascade: form (`DynamicForm` + `FieldRenderer`), drawer, table columns, reports, export.
4. On save: persist field & tab configurations via Fastify 5 `/api/v2/modules/:module/tabs` API endpoints (`dynamicFormPlugin`, `DFS.md` §4.1). RBAC: `authenticateTenant` + `can(module, 'editSetup')` on writes. Write DTOs: `customFieldConfigSchema.omit({id,tabId})` (create), `updateFieldBodySchema` (PATCH), `reorderFieldsBodySchema` (reorder) — all `.strict()`. Audit via `auditPreHandler`/`auditOnSend` → existing `audit_logs` table.
5. Block delete with dependency helper (`get*FieldRemovalIssues()`) and enforce DFS type locking (`hasData: true` → 422 on `type` change) + uniqueness enforcer (`unique false→true` → 409 if duplicates exist).
6. **Server-side validation**: entity save routes MUST re-validate `customData` via `buildDynamicValidationSchema` + `safeParse` and enforce `unique` fields via `checkValueUniqueness` before persisting — never trust the client (`DFS.md` §4.5). Client validation is UX only.
7. Copy via `t()` — no new `uiStrings`.

## Workflow: add Preferences control

1. Add to module prefs type + `DEFAULT_*` in `@mms/shared` or module prefs storage
2. Bind control in Preferences sub-tab
3. If preference affects Work UI: preview before save (`useSettingsDraft` pattern or `updatePreferences` live preview)
4. Audit on save where applicable

## Workflow: deactivate or remove custom field

1. **Soft-Delete / Deactivation:** Prefer deactivating or hiding fields/tabs in field config registries instead of erasing schema definitions (to preserve historical analytics data) — see `mms-fields.mdc` / `mms-form-architecture.mdc`.
2. **Hard-Delete Check (if requested):** Use dependency checking before removing:
```typescript
const issues = getContactFieldRemovalIssues({
  fieldKey,
  columnRegistry: config.columnRegistry,
  prefs: contextPrefs,
  contacts, // optional — checks record data
});
if (issues.length) { notify.error(t(issues[0].messageKey)); return; }
// then remove from registry state and save
```

Extend checks for: saved reports, filters, templates, automations when module supports them.

## Visibility cascade checklist

After hiding/disabling a tab or field, verify absent from:

- [ ] Create form tabs
- [ ] Detail drawer tabs
- [ ] Work table/card columns
- [ ] Search/filter options
- [ ] CustomReportBuilder / module reports
- [ ] CSV/export columns
- [ ] Mobile views

## Do not

- Mount module Setup under `/settings`
- Auto-save Setup Fields / Preferences without an explicit Save (Contacts-style `ModuleFieldsSetup` drafts locally; Save is dirty-gated). Do not claim live `saveObject` on every field reorder/toggle — `mms-fields.mdc` / `mms-module-architecture.mdc` §4.
- Delete seed/predefined fields without guard
- Branch UI on `isSystem` — metadata only
- Reintroduce Setup `uiStrings` editor
- Expose builder tools to standard users (restrict strictly to Tenant Admins with `setupWrite` permissions)
- Switch into builder mode using nested/double modals (use React 19 concurrent transitions `useTransition` inline)
- Swallow form validation errors or fail to direct the user to the invalid field (intelligently guide users to specific tabs containing validation errors)

## Rules

`mms-module-architecture.mdc`, `mms-fields.mdc`, `mms-settings-i18n.mdc`, `mms-ui-ux-design.mdc`

## Related skills

`mms-module-page`, `mms-fields-registry`, `mms-form-architecture`, `mms-settings-i18n` (via `mms-frontend` for `/settings`)
