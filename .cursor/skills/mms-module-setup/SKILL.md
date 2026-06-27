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

Register sub-tab ids in `{Module}ModuleContract.setupSubTabs`.

## Contacts reference map

| Requirement | Component / file |
|-------------|------------------|
| Setup Audit | `logSetupAudit` → `POST /api/contacts/setup-audit` |
| Fields UI | `ContactsSettingsPanel.tsx` (mode `fields`) |
| Field delete guard | `getContactFieldRemovalIssues()` in `@mms/shared` |
| Preferences UI | `ContactsSettingsPanel.tsx` (mode `preferences`) |
| Default Preferences | `preferencesStorage.ts`, `updatePreferences` |
| Stage/Visual Colours | Lifecycle stage colours in prefs |
| Workflow Prefs | Kanban stage changes → REST update |
| Sync settings extra tab | `ContactSyncPanel.tsx` |
| Config DB store | `contact_field_config`, `contact_preferences` objects |
| Context Provider | `ContactConfigProvider` — **App.tsx only** |

## Workflow: add Setup Fields capability

1. Extend registry schema in `@mms/shared` if new field metadata needed
2. Add UI in `{Module}SettingsPanel` — `CustomFieldsBuilder` + `DraggableFieldList`
3. Wire visibility cascade: form, drawer, table columns, reports, export
4. On save: persist config object + call setup audit mutation
5. Block delete with dependency helper (mirror `contactFieldDependencies.ts`)
6. Copy via `t()` — no new `uiStrings`

## Workflow: add Preferences control

1. Add to module prefs type + `DEFAULT_*` in `@mms/shared` or module prefs storage
2. Bind control in Preferences sub-tab
3. If preference affects Work UI: preview before save (`useSettingsDraft` pattern or `updatePreferences` live preview)
4. Audit on save where applicable

## Workflow: deactivate or remove custom field

1. **Soft-Delete / Deactivation:** Prefer deactivating or hiding fields/tabs in the blueprint configuration instead of erasing schema definitions (to preserve historical analytics data), as detailed in [mms-form-architecture.mdc](../rules/mms-form-architecture.mdc).
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
- Auto-save general Setup preferences or default values without an explicit "Save" action and audit logs. (Form builder mode layout changes must auto-save immediately on change via `/api/db/objects` to sync live).
- Delete seed/predefined fields without guard
- Branch UI on `isSystem` — metadata only
- Reintroduce Setup `uiStrings` editor
- Expose builder tools to standard users (restrict strictly to Tenant Admins with `setupWrite` permissions)
- Switch into builder mode using nested/double modals (use React 19 concurrent transitions `useTransition` inline)
- Swallow form validation errors or fail to direct the user to the invalid field (intelligently guide users to specific tabs containing validation errors)

## Rules

`mms-module-architecture.mdc`, `mms-fields.mdc`, `mms-settings-i18n.mdc`, `mms-module-architecture.mdc`, `mms-module-architecture.mdc`, `mms-ui-ux-design.mdc`

## Related skills

`mms-module-page`, `mms-fields-registry`, `mms-form-architecture`, `mms-settings-i18n` (via `mms-frontend` for `/settings`)
