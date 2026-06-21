---
trigger: model_decision
---

# MMS Configuration

See also: **`mms-settings-navigation.md`** for `/settings` scope · **`mms-module-setup.md`** for module Setup Preferences (globle2.md §7).

## globle2.md §7 — module preferences (Setup tier)

| § | Requirement | Contacts |
|---|-------------|----------|
| 7.1 Smart defaults | Field `defaultValue` + module prefs; consistent on create/import | `prefsStorage.ts`, registry defaults |
| 7.2 Visual categorisation | Status/stage colours on directory, drawer, reports, mobile; text + colour | Lifecycle colours in prefs, `StatusBadge` |
| 7.3 Workflow rules | Valid statuses, transitions, permissions | `lifecycleStage` REST updates |
| 7.4 Notification rules | Event-triggered notify respecting RBAC | Partial — export/sync/merge toasts |

Module prefs persist via contract `prefsObjectKey` (e.g. `contact_prefs`). App-wide config stays on `/settings`.

## Hierarchy (merge order)

1. `global_settings` — locale, theme, security, **`enabledModules`**
2. `{module}_settings` — per-module preferences
3. Field/tab registries — `contact_field_config`, module field stores

Persist via `db.ts` — not ephemeral React state alone. App-wide singletons use typed helpers (`getBrandingSettings` / `await saveBrandingSettings`, `getGlobalSettings` / `saveGlobalSettings`); see **`mms-data-layer.md`** — never raw `saveObject('branding')` in settings UI.

## UI entry points

All app-wide settings use **single URL `/settings`** with in-page tab ids — not separate routes.

| Config | Key | Tab id | Where |
|--------|-----|--------|-------|
| App-wide | `global_settings` | `global` | `/settings` → Global |
| Module on/off | `global_settings.enabledModules` | `modules` | `/settings` → Modules |
| Institution | branding object (identity fields) | `branding` | `/settings` → Branding |
| Theme | branding object (colours, footer) + `global_settings.theme` | `theme` | `/settings` → Theme |
| Backup | `backups` collection + export files | `backup` | `/settings` → Backup |
| Module prefs | `students_settings`, `attendance_settings`, … | — | Module → **Setup → Preferences** |
| Fields/tabs | `contact_field_config`, … | — | Module → **Setup → Fields** |

**`/settings` does not host per-module Fields/Preferences** — use each module's Setup tab.

## ContactConfigProvider

- **Mount once** in `App.tsx`.
- **Never nest** in module pages or `Settings.tsx`.

## Runtime rules

- Features, fields, columns, tabs: runtime enable/disable — no deploy-to-toggle.
- Changes apply immediately — no full page reload.
- Dropdowns: `EditableSelect` + options registry — no inline `const OPTIONS = [...]`.

## Theme scope (host)

Tenant vs apex hosts → **`mms-tenant.md`**. Summary: tenant uses institution `branding` + live preview; apex uses `DEFAULT_*` via `themeScope.ts` only.

## Live preview before Save (required)

Settings that affect visible UI must **preview on change**; **Save** still persists via typed `db.ts` helpers.

| Layer | Use |
|-------|-----|
| `settingsPreviewStore.ts` | In-memory overlay; `getEffectiveGlobalSettings()` / `getEffectiveBrandingSettings()` |
| `settingsPreview.ts` | `previewGlobalSettings`, `previewBrandingSettings`, `revertSettingsPreviews` |
| `useSettingsDraft` | Standard panel hook: draft + dirty + `onPreview` + `onSave` |
| `useBrandingDraft` / `useThemeSettingsDraft` | Same `branding` record; theme adds display mode from `global_settings.theme` |
| `useSavedFlash` | Shared 2.5s post-save indicator across settings panels |
| `settingsGlobalDraft.ts` | `globalSettingsPreviewPatch`, `mergeGlobalSettingsDraft` for Global tab |
| `settingsModulesDraft.ts` | `previewEnabledModulesDraft`, `saveEnabledModulesDraft`, `resetEnabledModulesToDefaults` |
| `useGlobalSettings` / `useBranding` | Read effective values; listen to `settings-preview-update` |

### Panel rules

1. **Draft in React state** — do not write localStorage/PostgreSQL until explicit Save.
2. **`onPreview(draft)`** on every draft change — theme, language, nav modules, branding chrome, field visibility, etc.
3. **`revertSettingsPreviews()`** when leaving `/settings` without save (`RouterBridge`).
4. **Clear preview** after successful save (`clearGlobalSettingsPreview` / `clearBrandingSettingsPreview` or typed save helpers).
5. Module `*Settings` panels: same pattern via `useSettingsDraft`; wire `onPreview` for any preference that affects Work-tier UI before Save.

## Shared settings panels

`*Settings` / `*SettingsPanel` components have **one implementation** — imported by the module page Setup tab only. Do not fork or re-mount under `/settings`.

## Current vs target

| Topic | Current | Target |
|-------|---------|--------|
| Hardcoded module labels | Some panels | `t()` + registry `labelKey` — `mms-i18n.md` |
| Contact `uiStrings` | Contacts module | Migrate to `appTranslations` |
| `EditableSelect` | Partial | All configurable dropdowns |
| Permissions on tabs/fields | Schema exists | Enforced via `can()` hook — `mms-rbac.md` |
| Config reload | Mostly immediate | 100% without navigation reset |
| Settings audit trail | None | `audit_log` on save — `mms-security.md` |
