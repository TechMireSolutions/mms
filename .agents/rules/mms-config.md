---
trigger: model_decision
---

# MMS Configuration

See also: **`mms-settings-navigation.md`** for `/settings` scope, nav grouping, and `SYSTEM_MODULE_NAV`.

## Hierarchy (merge order)

1. `global_settings` — locale, theme, security, **`enabledModules`**
2. `{module}_settings` — per-module preferences
3. Field/tab registries — `contact_field_config`, module field stores

Persist via `db.ts` — not ephemeral React state alone. App-wide singletons use typed helpers (`getBrandingSettings` / `await saveBrandingSettings`, `getGlobalSettings` / `saveGlobalSettings`); see **`mms-data-layer.md`** — never raw `saveObject('branding')` in settings UI.

## UI entry points

| Config | Key | Where |
|--------|-----|-------|
| App-wide | `global_settings` | `/settings/global` |
| Module on/off | `global_settings.enabledModules` | `/settings/modules` |
| Institution | branding object (identity fields) | `/settings/branding` |
| Theme | branding object (colours, footer) | `/settings/theme` |
| Module prefs | `students_settings`, `attendance_settings`, … | Module → **Setup → Preferences** |
| Fields/tabs | `contact_field_config`, … | Module → **Setup → Fields** |

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
