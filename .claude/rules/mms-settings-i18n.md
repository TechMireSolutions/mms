---
description: App settings configurations, live preview draft states, sidebar/in-page navigation directories, and localized translation keys (en/ar/ur/fa).
paths:
  - "apps/frontend/src/tenant/features/settings/**"
  - "apps/frontend/src/tenant/features/**/*Settings*"
  - "apps/frontend/src/platform/**"
  - "apps/frontend/src/lib/contexts/TranslationContext.tsx"
  - "apps/frontend/src/platform/lib/themeScope.ts"
  - "apps/frontend/src/lib/config/settings*"
  - "apps/frontend/src/lib/config/routes.ts"
  - "apps/frontend/src/lib/config/navConfig.tsx"
  - "apps/frontend/src/hooks/useTranslation.ts"
  - "packages/shared/src/appTranslations*.ts"
---

# MMS Settings, Navigation & Internationalization

Governs application-wide configuration tabs, live settings preview states, sidebar navigation rules, and localization copy mappings across English, Arabic, Urdu, and Persian.

---

## 1. App-Wide Settings (`/settings` URL Scope)
- **Single URL Structure**: All application-wide settings panels must reside on the `/settings` route. Use in-page active tab tracking (`setActiveTab()` from `SettingsTabContext`) for sidebar jumping. Do not configure individual section routes.
- **Valid Settings Sections**: Only the following section IDs are registered under `SETTINGS_SECTIONS` on `/settings`:
  1. `global`: System languages, timezone format, date formats, and notifications.
  2. `modules`: System module toggles (`enabledModules` map).
  3. `branding`: Identity parameters (name, tagline, address, logo).
  4. `theme`: Color configurations, display mode, and footer overrides.
  5. `backup`: Admin workspace export/import UI (`BackupRestore` + `useBackupRestore*`) — not Postgres ops backups (`scripts/production/backup-postgres.sh`).
  6. `llm`: LLM / AI integration settings.
- **Module Settings Separation**: Do NOT add module-specific settings panels (e.g., student cutoff times or grading systems) to `/settings`. Place them inside each module's respective **Setup → Preferences** tab.
- Settings page entry: `apps/frontend/src/tenant/features/settings/SettingsPage.tsx`.

### Workspace backup & restore (Settings → Backup)
- **Export**: Encrypted `.mmsbak` from server `GET /api/db/backup` → workspace envelope → AES-GCM (`encryptWorkspaceBackup`). Local history may be metadata-only — disable download when `!backup.data`.
- **Restore is two-step**: (1) current-password step-up + mandatory safety backup download (`createSafetyBackup` → `safetyReady`); (2) wipe-restore (`beginRestore`) disabled until `safetyReady`.
- Confirm modal must not close while safety backup or restore is in progress.
- Early-reject encrypted file `subdomain` ≠ current tenant (`backup.workspaceMismatch`) before the decrypt prompt.
- All copy via `backup.*` keys (en/ar/ur/fa). Map HTTP `408` / `backup.syncTimeout` to localized timeout messaging — `mms-data-layer.md` / `mms-auth-security.md` for sync and credential rules.

---

## 2. Systems Modules Navigation Registry
- **Sidebar Integration**: The sidebar layout retrieves navigation links from `NAV_ITEMS` in `navConfig.tsx`.
- **Academics Grouping**: Academics submenu `moduleIds`: `students`, `teachers`, `sessions`, `attendance`, `enrollment`, `hasanat`, `examination`, `questionBank` (match `SYSTEM_MODULE_NAV` / `NAV_ITEMS[].moduleId` — not path plurals or manifest `moduleId` plurals).
- **Registry & Defaults**: Toggles reside in `SystemModulesSettings` which maps the `SYSTEM_MODULE_NAV` configuration. Standalone modules render in pairs, and the Academics group displays as a bordered panel with a `BookOpen` icon.

---

## 3. Live Previews & Settings Drafts
- **In-Memory Drafts**: Panel parameters must remain in component states via `useSettingsDraft` (or `useBrandingDraft` / `useThemeSettingsDraft`) and must not commit to PostgreSQL or local storage until the user clicks an explicit **Save**.
- **Live Preview Trigger**: Call `onPreview(draft)` on draft changes (e.g., locale switch, theme update) to dynamically update the active page surfaces.
- **Cleanup**: Revert preview patches when navigating away from the Settings viewport using `revertSettingsPreviews()`.

---

## 4. Internationalization & Locale Dictionary

### Locale Support & Coverage
MMS supports four languages configured in `languageUtils.ts` (`APP_LANGUAGES`):
- **English (`en`)**: Source of truth map defined in `appTranslationsEn.ts` (determines `AppTranslationKey`).
- **Arabic (`ar`)**: Full Arabic translation object (RTL).
- **Urdu (`ur`)**: Full Urdu translation object in `appTranslationsUr.ts` (RTL).
- **Persian (`fa`)**: Persian override pack in `appTranslationsFa.ts` merging overrides with Farsi fallbacks (`{ ...ar, ...APP_TRANSLATIONS_FA }`).

### Best Practices & Standards

- **No Hardcoded Strings**: All user-facing UI copy must resolve through `t('key')`. Hardcoded UI strings are forbidden.
- **Ban English fallbacks**: Never `t(key) || 'English label'` — keys must exist in `appTranslationsEn.ts` (type source), then ar/ur; fa as override pack.
- **New keys checklist**: Add to `appTranslationsEn.ts` first → ar → ur → fa overrides as needed.
- **Registry Key Bindings**: Settings, custom fields, and tables use `labelKey: AppTranslationKey` and translate at render with `t(labelKey)`.
- **Strict Typesafe Interpolation**: Interpolated parameters (e.g. `{count}`) must match `ExtractPlaceholders` / `TranslationArgs<K>`. Prefer `Intl` plural rules for count-dependent copy.
- **Cascading Translation Fallbacks**: `fa` → `ar` → `en` — never blank keys.
- **Dynamic Bundle Splitting**: Non-English packs load via dynamic `import()` in `TranslationProvider`; cache in-memory.
- **Logical CSS Properties & RTL**: Never hardcode `left`/`right`/`ml-*`/`pl-*` — use logical Tailwind (`text-start`, `ms-*`, `ps-*`, `border-s-*`, `rtl:*`).
- **Reactive Layout Direction**: Consume `dir` / `isRtl` from `useTranslation()` — do not read DOM `dir` directly.
- **Locale Typography**: Apply language font stacks via `applyDocumentLanguage` / CSS variables to avoid CLS.
- **Non-Destructive Live Previews**: In-memory locale/theme previews via drafts before Save.
- **Settings-Aware `Intl` Formatting**: Dates/money via settings-aware `formatDate` / `formatMoney` (+ `Intl`), not ad-hoc string math.
- **Error Codes Mapping**: Tenant UI maps API `type` to `t('errors.{type}')`. Platform auth/setup/admin surfaces use `mapPlatformAuthError` → `platform.*` keys (`platformAuthErrors.ts`).

### Platform apex = English only
- **Entire platform host** (apex: console, onboarding, account, admins, auth, **tenant-not-found**) is **English + LTR** — never follow tenant `settings.language`.
- Lock via `shouldForcePlatformEnglish()` in `themeScope.ts` + `TranslationProvider` + `applyApexPlatformTheme('en')`.
  - Apex → always English.
  - Tenant host → English when workspace is disabled, missing after settle, or `workspaceLookupFailed`; while `workspaceLoading`, do **not** force English (preserve enabled RTL first paint).
- Do **not** expand `isPlatformEntryPath` / path helpers to “fake” English for the authenticated console — host-level `shouldForcePlatformEnglish` is the SSOT.
- Platform shells (`PlatformPageShell`, onboarding `WizardLayout`) hardcode `dir="ltr"` / `lang="en"`.
- Tenant authenticated app remains multilingual (en/ar/ur/fa).

### Unknown / missing tenant host
- If the browser host is a **non-existent tenant subdomain** (lookup 404 / empty), **never** mount tenant app routes — especially **`/settings`**, login, or modules.
- `TenantBootGate` must **hard-redirect** (`window.location` via `apexUrl` / `RedirectToApex`) to apex `ROUTES.tenantNotFound` — path helper `tenantNotFoundPath(subdomain)` → `/tenant-not-found?subdomain=…`.
- The address bar **must leave** the bad tenant host (e.g. `foo.localhost` → `localhost/tenant-not-found?subdomain=foo`). Do **not** only normalize the path on the same host.
- Apex `TenantNotFoundPage` (`platform/pages/TenantNotFoundPage.tsx`) is a `PLATFORM_ENTRY_PATHS` route: copy via `apex.*` / `entry.*` keys with `t()` (English under host lock) + contact MMS platform administrator only — no Settings, onboarding, workspace-picker, or create-madrasa CTAs.
- Disabled (registered but `enabled === false`) workspaces stay on the tenant host with `WorkspaceDisabledScreen` (path-normalize to `/`; no settings).

