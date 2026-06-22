---
name: mms-module-setup
description: Implements or modifies module Setup tier per globle.md — Fields sub-tab, Preferences sub-tab, field dependency checks, setup audit, prefs cascade. Use when editing ContactsSettingsPanel, CustomFieldsBuilder, module preferences, or Setup sub-tabs.
---

# MMS Module Setup Workflow

**Source:** [`globle.md`](../../globle.md) §5–§7, §13 · Rules: `mms-module-setup.mdc`, `mms-fields.mdc`, `mms-config.mdc`

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
│   ├── fields       ← §6 globle.md
│   ├── preferences  ← §7 globle.md
│   └── {contract.setupSubTabs extras}
```

Register sub-tab ids in `{Module}ModuleContract.setupSubTabs`.

## Contacts reference map

| globle.md | Component / file |
|-----------|------------------|
| §5 audit | `logSetupAudit` → `POST /api/contacts/setup-audit` |
| §6 Fields | `ContactsSettingsPanel.tsx` (mode `fields`) |
| §6.6 delete guard | `getContactFieldRemovalIssues()` in `@mms/shared` |
| §7 Preferences | `ContactsSettingsPanel.tsx` (mode `preferences`) |
| §7.1 defaults | `prefsStorage.ts`, `updatePrefs` |
| §7.2 visual | Lifecycle stage colours in prefs |
| §7.3 workflow | Kanban stage changes → REST update |
| Sync extra tab | `ContactSyncPanel.tsx` |
| Config store | `contact_field_config`, `contact_prefs` objects |
| Provider | `ContactConfigProvider` — **App.tsx only** |

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
3. If pref affects Work UI: preview before save (`useSettingsDraft` pattern or `updatePrefs` live preview)
4. Audit on save where applicable

## Workflow: remove custom field (§6.6)

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
- Auto-save structural field config without audit
- Delete seed/predefined fields without guard
- Branch UI on `isSystem` — metadata only
- Reintroduce Setup `uiStrings` editor

## Rules

`mms-module-setup.mdc`, `mms-fields.mdc`, `mms-config.mdc`, `mms-module-architecture.mdc`, `mms-contacts.mdc`

## Related skills

`mms-module-page`, `mms-fields-registry`, `mms-contacts`, `mms-config` (via `mms-frontend` for `/settings`)
