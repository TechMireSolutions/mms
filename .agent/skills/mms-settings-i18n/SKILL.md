---
name: mms-settings-i18n
description: Governs application-wide settings panels (/settings), settings preview states, sidebar navigation registries, and localization/i18n standards (en/ar/ur/fa). Use when adding or modifying settings, sidebar navigation items, custom localizations, translation files, or RTL/LTR layout mirroring.
---

# MMS Settings, Navigation & Internationalization

## 1. App-Wide Settings (URL Scope: `/settings`)

App-wide settings reside solely on the `/settings` path and are controlled by in-page active tab tracking via `SettingsTabContext`.

### Registered Sections
Only the following five section IDs are allowed on `/settings`:
1. `global`: System languages, timezone format, date formats, and notifications.
2. `modules`: System module toggles (`enabledModules` map).
3. `branding`: Identity parameters (name, tagline, address, logo).
4. `theme`: Color configurations, display mode, and footer overrides.
5. `backup`: Backup triggers and database export lists.

> [!IMPORTANT]
> **Separation of Concerns**: Never add module-specific preferences (e.g., student cutoff times or grading systems) to `/settings`. Place them in the respective module's **Setup → Preferences** sub-tab.

---

## 2. Systems Modules Navigation Registry

- **Sidebar Integration**: The sidebar layout retrieves navigation links dynamically from `NAV_ITEMS` in `navConfig.tsx`.
- **Academics Dropdown**: Academic features (`students`, `teachers`, `sessions`, `attendance`, `enrollment`, `hasanat`, `examination`) must be grouped inside the Academics submenu.
- **Registry & Defaults**: Toggles reside in `SystemModulesSettings` mapping `SYSTEM_MODULE_NAV`. Standalone modules render in pairs, and the Academics group displays as a bordered panel with a `BookOpen` icon.

---

## 3. Live Previews & Settings Drafts

- **In-Memory Drafts**: Save settings modifications to component states using the draft hooks (`useSettingsDraft`, `useBrandingDraft`, `useThemeSettingsDraft`). Do not commit to local storage or PostgreSQL until the user clicks **Save**.
- **Live Preview Trigger**: Call `onPreview(draft)` on changes to dynamically update the active page surfaces (e.g., localizing UI or changing theme colors instantly).
- **Cleanup**: Call `revertSettingsPreviews()` when navigating away from the Settings viewport to discard unsaved preview configurations.

---

## 4. Localization & i18n Standards

### Locale Support
MMS supports four languages configured in `languageUtils.ts` (`APP_LANGUAGES`):
- **English (`en`)**: Source of truth map in `appTranslationsEn.ts` (determines `AppTranslationKey`).
- **Arabic (`ar`)**: Full Arabic translation object (RTL).
- **Urdu (`ur`)**: Full Urdu translation object in `appTranslationsUr.ts` (RTL).
- **Persian (`fa`)**: Persian override pack in `appTranslationsFa.ts` merging overrides with Farsi fallbacks (`{ ...ar, ...APP_TRANSLATIONS_FA }`).

### Checklist for Adding Copy/Translations
1. **Define in Source (English)**: Add the key and the English string to `packages/shared/src/appTranslationsEn.ts`.
2. **Typesafe Interpolation**:
   - Variables must be enclosed in curly braces: `{userName}`.
   - Placeholders are automatically type-checked by TypeScript using the `ExtractPlaceholders` template utility.
   - Pass params reactively: `t('contacts.deleteConfirm', { name: contact.name })`.
3. **ICU Plural Formatting**: Use the simple ICU select syntax for plurals: `{count, select, one {record} other {records}}`.
4. **Translate Language Packs**: Add matching keys to `appTranslationsAr.ts`, `appTranslationsUr.ts`, and `appTranslationsFa.ts`.
5. **Cascading Fallbacks**: In case of missing keys, Farsi (`fa`) falls back to Arabic (`ar`), and all languages fall back to English (`en`) to prevent unrendered/blank texts.

### Code Splitting & Performance
- Non-English language packs must be dynamically loaded (`import()`) in a React `useEffect` inside `TranslationProvider` when requested.
- Loaded language packs are cached in-memory inside the client translation registry (`TRANSLATION_CACHE`) to enable instant switching.

### UI Direction & Styling
- **No Hardcoded Strings**: Never render hardcoded copy in UI components. Use `t('key')` exclusively.
- **Registry Keys**: Field labels, table headers, and statuses must declare a `labelKey: AppTranslationKey` resolved via `t(labelKey)`.
- **RTL Logical CSS**: Never use hardcoded directional offsets (`left: 0`, `right: 0`, `ml-*`, `pr-*`). Use logical properties to support RTL mirroring:
  - Spacing: `ms-*` (margin start), `me-*` (margin end), `ps-*`, `pe-*`
  - Text: `text-start`, `text-end`
  - Borders: `border-s-*`, `border-e-*`
  - Layout: Use Tailwind `rtl:` modifier where custom mirroring is required (e.g. `rtl:flex-row-reverse`).
- **Reactive layout direction**: Retrieve directionality reactively using `useTranslation()`:
  ```tsx
  const { dir, isRtl, isLoading } = useTranslation();
  ```
  Use these fields to adjust icon orientations (e.g., chevron rotation) or absolute element positions.
- **Typography & Font Stacking**: Language-specific font stacks are applied to the document root element (`<html>`) dynamically (`applyDocumentLanguage`). Ensure standard CSS variables (`--font-sans`, `--font-display`) resolve to appropriate fonts (e.g., Noto Nastaliq Urdu for `ur`) to prevent layout shifts (CLS).

### Settings-Aware Native Formatting
Never format dates, times, numbers, or currencies using raw strings or ad-hoc formatters. Use settings-aware hooks/helpers that wrap browser-native `Intl` APIs:
- **Dates**: Resolves via settings-aware `formatDate()` or `formatDateTime()` helpers using active locale codes (e.g., `ur-PK`, `fa-IR`).
- **Currencies**: Resolves via `formatMoney()` with system-configured currency hooks (`useFinanceCurrency` or `useAccountingCurrency`).

### API Error Handling
API routes must return stable error types (`type: 'forbidden'`), which the frontend resolves dynamically to user-facing translations using `t('errors.{type}')`.
