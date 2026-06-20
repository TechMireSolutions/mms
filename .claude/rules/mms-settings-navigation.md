---
description: App navigation, Settings page scope, system modules registry, per-module Setup tab
paths:
  - "apps/frontend/src/pages/Settings.tsx"
  - "apps/frontend/src/components/settings/**"
  - "apps/frontend/src/hooks/useBackupRestore.ts"
  - "apps/frontend/src/hooks/useSettingsDraft.ts"
  - "apps/frontend/src/hooks/useBrandingDraft.ts"
  - "apps/frontend/src/hooks/useThemeSettingsDraft.ts"
  - "apps/frontend/src/lib/config/navConfig.tsx"
  - "apps/frontend/src/lib/config/routes.ts"
  - "apps/frontend/src/lib/config/settingsNavConfig.ts"
  - "apps/frontend/src/lib/config/settingsSectionComponents.tsx"
  - "apps/frontend/src/lib/config/moduleIcons.ts"
  - "apps/frontend/src/lib/settingsGlobalDraft.ts"
  - "apps/frontend/src/lib/settingsModulesDraft.ts"
  - "apps/frontend/src/lib/backup/**"
  - "packages/shared/src/settingsTypes.ts"
---

# MMS Settings & Navigation

Authoritative split between **app-wide settings** (`/settings`) and **per-module setup** (each module's **Setup** tab, id `configuration`). Navigation and the System Modules page share one registry in `@mms/shared`.

## App navigation (`lib/config/navConfig.tsx`)

`NAV_ITEMS` is the sidebar/mobile nav source of truth.

```
Dashboard
Contacts
Academics ▾
  Students · Teachers · Sessions · Attendance · Enrollments · Hasanat Cards · Examinations
Finance
Accounting
Obligations   (moduleId: finance — not a separate toggle)
Users
Settings      (always available — not in SYSTEM_MODULE_NAV)
```

- **Academics** is a group (`subItems`) — not a single module.
- Every routable feature exposes a `moduleId` used by `enabledModules` filtering in `Sidebar` / `MobileSidebar` / `Dashboard`.

## `/settings` — app-wide only (single URL)

All sections live at **`/settings`** only. Tab state is in-page (`usePersistedTabState` + `SettingsTabContext`) — **no per-section routes**.

| Section id | Component | Scope |
|------------|-----------|-------|
| `global` | `GlobalSettings` | Language, timezone, date format, notifications, security |
| `modules` | `SystemModulesSettings` | Enable/disable modules (`enabledModules`) |
| `branding` | `BrandingSettings` | Name, logo, contact, address, social |
| `theme` | `ThemeSettings` | Display mode (light/dark/system), brand colours, footer |
| `backup` | `BackupRestore` | Data backup |

`SETTINGS_SECTIONS` in `lib/config/routes.ts` lists **only** these five ids. Legacy `/settings/:section` redirects to `/settings`. Use `setActiveTab()` from `SettingsTabContext` for cross-panel jumps (e.g. Theme → Institution).

### Settings page architecture

| Layer | Owner | Role |
|-------|-------|------|
| Tab shell | `pages/Settings.tsx` | `SETTINGS_NAV` sidebar + lazy section mount |
| Nav config | `lib/config/settingsNavConfig.ts` | Order, icons, i18n keys — runtime check vs `SETTINGS_SECTIONS` |
| Section registry | `lib/config/settingsSectionComponents.tsx` | `SETTINGS_SECTION_COMPONENTS` — lazy map keyed by `SettingsSection` |
| Panel shell | `components/ui/SettingsShell.tsx` | `SettingsPanel`, callouts, badges |
| Actions | `components/ui/SettingsFormActions.tsx` | Save/Reset footer — all labels via `t()` |
| Draft hooks | `useSettingsDraft`, `useBrandingDraft`, `useThemeSettingsDraft` | Draft + dirty + preview + save |
| Draft helpers | `lib/settingsGlobalDraft.ts`, `lib/settingsModulesDraft.ts` | Preview patch / merge for Global + Modules panels |
| Module grid | `components/settings/modules/ModuleSettingsNavGrid.tsx` | Renders `SYSTEM_MODULE_NAV` with toggles |
| Module icons | `lib/config/moduleIcons.ts` | `resolveModuleIcon()` for `SYSTEM_MODULES.icon` strings |
| Backup | `hooks/useBackupRestore.ts` + `lib/backup/*` + `components/settings/backup/*` | Logic in hook; UI split into export/import/history sections |

**Banned:** resurrecting `SettingsShared.tsx` or monolithic panel files — extract hooks + section components when a panel exceeds ~300 lines.

### Banned on `/settings`

Do **not** add per-module Fields/Preferences panels to `Settings.tsx`:

- Contacts, Students, Sessions, Attendance, Enrollments, Hasanat, Examinations, Finance, Accounting, Users module settings

Module-specific prefs (currency, academic year, cutoff times, grading, etc.) belong in that module's **Setup → Preferences** — never on Global Settings or a central module-settings nav.

## Per-module configuration

- Tier layout and **content scope** → `mms-module-isolation.md`; tab shell → `mms-ui-tabs.md`.
- Reuse `*Settings` / `*SettingsPanel` — **single implementation**, module **Setup** tab only.
- `ContactConfigProvider`: `App.tsx` only (`mms-config.md`).

## System Modules registry (`@mms/shared`)

| Export | Purpose |
|--------|---------|
| `SYSTEM_MODULES` | All toggleable modules — `id`, `label`, `description`, `icon`, `required?` |
| `SYSTEM_MODULES_BY_ID` | Lookup map by module id |
| `SYSTEM_MODULE_NAV` | Settings-page layout — mirrors `NAV_ITEMS` grouping |
| `DEFAULT_GLOBAL_SETTINGS.enabledModules` | Default on/off map — keys must match `moduleId` |

### `moduleId` alignment (required)

Sidebar `moduleId`, `enabledModules` key, and `SYSTEM_MODULES[].id` **must match**:

| Nav label | moduleId |
|-----------|----------|
| Dashboard | `dashboard` |
| Contacts | `contacts` |
| Students | `students` |
| Sessions | `sessions` |
| Attendance | `attendance` |
| Enrollments | `enrollment` |
| Hasanat Cards | `hasanat` |
| Examinations | `examination` |
| Finance | `finance` |
| Accounting | `accounting` |
| Users | `users` |

### `SYSTEM_MODULE_NAV` layout

Mirrors sidebar grouping for `/settings/modules`:

1. Standalone: `dashboard`, `contacts`
2. **Group `Academics`**: `students`, `sessions`, `attendance`, `enrollment`, `hasanat`, `examination`
3. Standalone: `finance`, `accounting`, `users`

`SystemModulesSettings` delegates layout to **`ModuleSettingsNavGrid`** — standalone entries in pairs (2-col grid) and Academics as a nested bordered panel with a group header (`BookOpen`).

### Not in `SYSTEM_MODULE_NAV`

| Item | Reason |
|------|--------|
| Settings | Always available; not toggleable |
| Obligations | Shares `finance` `moduleId` — toggling Finance covers it |

Required modules (`dashboard`, `contacts`, `students`, `users`) show a **Required** badge — no disable toggle.

## Adding or moving a module (checklist)

1. **Nav** — add to `NAV_ITEMS` in `lib/config/navConfig.tsx` (standalone or Academics `subItems`); set `moduleId`.
2. **Registry** — add entry to `SYSTEM_MODULES` in `settingsTypes.ts`.
3. **Layout** — add to `SYSTEM_MODULE_NAV` (standalone or Academics `moduleIds`).
4. **Defaults** — add key to `DEFAULT_GLOBAL_SETTINGS.enabledModules`.
5. **Page** — module page with Work | Reports | Setup; wire `*Settings` in Setup tab.
6. **Do not** add a new section to `Settings.tsx` or `SETTINGS_SECTIONS`.

When renaming or regrouping nav items, update `SYSTEM_MODULE_NAV` in the same change — keep settings UI and sidebar in sync.

## Persistence

| Data | Storage key | Where edited |
|------|-------------|--------------|
| App locale, security | `global_settings` | `/settings` → Global tab |
| Display mode, brand colours, footer | `global_settings.theme` + `branding` | `/settings` → Theme tab |
| Module enable/disable | `global_settings.enabledModules` | `/settings` → Modules tab (`saveEnabledModulesDraft`) |
| Module fields/prefs | `{module}_settings`, field registries | Module → Setup |

Module toggles persist via `saveEnabledModulesDraft` in `settingsModulesDraft.ts` — not raw `saveObject`.

## Anti-patterns

```tsx
// ❌ Module settings on central Settings page
{ id: "students", label: "Students Settings", ... }  // in Settings.tsx NAV

// ❌ Module-specific fields on Global Settings
<select>Currency</select>  // belongs in Finance → Setup

// ❌ Flat module grid ignoring Academics grouping
SYSTEM_MODULES.map(...)  // use SYSTEM_MODULE_NAV for layout

// ❌ Mismatched ids
moduleId: "enrollments"  // nav uses "enrollment"

// ✅ Module config only on module page
{activeTab === "configuration" && <StudentsSettings mode={subTab} />}
```
