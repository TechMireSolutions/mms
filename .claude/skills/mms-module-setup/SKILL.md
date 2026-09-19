---
name: mms-module-setup
description: Implements or modifies the module Setup tier per mms-module-architecture.md — the Preferences/setup shell, sub-tab registration, setup audit, and preference cascading. Use when configuring module settings, setup sub-tabs, or module preferences. Do NOT use for the field registry and Setup → Fields field definitions (use mms-fields-registry), global workspace settings under /settings (use mms-settings-i18n), or Work tier tables/drawers (use mms-module-work).
license: Proprietary
metadata:
  owner: mms-platform
  last-verified: 2026-09-15
---

# MMS Module Setup Workflow

**Rule (norms SSOT):** `mms-module-architecture.md` · `mms-settings-i18n.md` (TTL/invalidation for static config reads).
**Ownership:** this skill owns the **Setup tier shell, sub-tabs and Preferences**. Field definitions, field types, delete guards and the Setup → Fields panel belong to **`mms-fields-registry`**.

## When to use

- Adding/editing **Setup → Preferences** (defaults, colours, duplicate rules, workflow)
- Module-specific Setup sub-tabs (e.g. Contacts Sync, Messaging Templates)
- Setup audit, config cascade

For the full module page shell, use skill **`mms-module-page`**.

## Setup tier structure

```
Setup (tier id: setup)
├── Preferences  ← Module Preferences
└── {manifest.setupSubTabs extras}   ← e.g. Fields, Sync
```

Register sub-tab ids in `{Module}ModuleManifest.setupSubTabs`. Default is `['preferences']`; contacts adds `sync` (`DEFAULT_SETTINGS_SUB_TABS` in `packages/shared/src/contactTabRegistry.ts`).

The tier is a **shell**: `SubTabBar` + `useModuleSetupSubTabs` (`apps/frontend/src/lib/setup/useModuleSetupSubTabs.ts`) owns sub-tab state, the fields/prefs/sync dirty-guard, and the discard confirmation; each panel is lazily rendered inside a `Suspense`.

Gate edits with `canEditSetup` — render settings read-only (`SetupReadOnlyMessage`) instead of omitting Setup. Panels that mutate other domains gate on their own permission (Contacts Sync uses `contacts.write`, **not** `canEditSetup`). Prefer awaited mutations for Preferences saves.

## Contacts reference map (verified)

| Requirement | Component / file |
|-------------|------------------|
| Setup tier shell | `ContactsSetupTier.tsx` → `SubTabBar` + `useModuleSetupSubTabs` + lazy panels |
| Preferences UI | `ContactsSetupPanel.tsx` → `ContactsPreferencesSection.tsx`, state in `hooks/useContactsSetupPanelState.ts` |
| Sync sub-tab | `ContactSyncPanel.tsx` (gated on `canWrite`, never `canEditSetup`) |
| Setup audit | `logSetupAudit` → `POST /api/contacts/setup-audit` |
| Option lists (gender/labels/…) | `EditableSelect` `onUpdateOptions` → `PUT /api/contacts/lookups/:kind` |
| Countries & dial codes | `PUT /api/contacts/lookups/countryCodes` (lookups API) |
| Config DB store | typed `contact_field_configs` / `contact_module_preferences` / `contact_user_column_prefs` REST; lookups via `/api/contacts/lookups` |
| Config hook | `createStandardModuleConfigHook` → `useStandardModuleConfig`; Contacts surfaces it through `ContactConfigProvider` in `TenantScopedProviders` (tenant host only) |
| Field definitions, delete guards | skill **`mms-fields-registry`** (`getContactFieldRemovalIssues()` in `@mms/shared`) |

## Workflow: add Setup Fields capability

1. Extend schema/types in `@mms/shared` (`FIELD_TYPES_META`, `createFormCustomFieldHelpers`).
2. Add UI in `{Module}SettingsPanel` — all labels via `t()` — no hardcoded strings (en/ar/ur/fa + RTL).
3. Wire visibility cascade: form, drawer, table columns, reports, export.
4. Block delete with dependency helper (`get*FieldRemovalIssues()`).
5. Server-side validation: entity save routes validate via shared Zod schemas (`safeParse`) — never trust the client. Client validation is UX only.
6. Copy via `t()` — no new `uiStrings`.

## Workflow: add Preferences control

1. Add to module prefs type + `DEFAULT_*` in `@mms/shared` or module prefs storage
2. Bind control in Preferences sub-tab
3. If preference affects Work UI: preview before save (`useSettingsDraft` pattern or `updatePreferences` live preview)
4. Audit on save where applicable

## Workflow: deactivate or remove custom field

1. **Soft-Delete / Deactivation:** Prefer deactivating or hiding fields/tabs in field config registries instead of erasing schema definitions (to preserve historical analytics data) — see `mms-fields.md` / `mms-form-architecture.md`.
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
- Auto-save Setup Fields / Preferences without an explicit Save (Contacts-style `ModuleFieldsSetup` drafts locally; Save is dirty-gated). Do not claim live `saveObject` on every field reorder/toggle — `mms-fields.md` / `mms-module-architecture.md` §4.
- Delete seed/predefined fields without guard
- Branch UI on `isSystem` — metadata only
- Reintroduce Setup `uiStrings` editor
- Expose builder tools to standard users (restrict strictly to Tenant Admins with `setupWrite` permissions)
- Switch into builder mode using nested/double modals (use React 19 concurrent transitions `useTransition` inline)
- Swallow form validation errors or fail to direct the user to the invalid field (intelligently guide users to specific tabs containing validation errors)

## Rules

`mms-module-architecture.md`, `mms-fields.md`, `mms-settings-i18n.md`, `mms-ui-ux-design.md`

## Related skills

`mms-module-page`, `mms-fields-registry`, `mms-form-architecture`, `mms-settings-i18n` (via `mms-frontend` for `/settings`)
