---
trigger: model_decision
---

# MMS Settings, Navigation & Internationalization

Governs application-wide configuration tabs, live settings preview states, sidebar navigation rules, and localization copy mappings across English, Arabic, Urdu, and Persian.

---

## 1. App-Wide Settings (`/settings` URL Scope)
- **Single URL Structure**: All application-wide settings panels must reside on the `/settings` route. Use in-page active tab tracking (`setActiveTab()` from `SettingsTabContext`) for sidebar jumping. Do not configure individual section routes.
- **Valid Settings Sections**: Only the following five section IDs are registered under `SETTINGS_SECTIONS` on `/settings`:
  1. `global`: System languages, timezone format, date formats, and notifications.
  2. `modules`: System module toggles (`enabledModules` map).
  3. `branding`: Identity parameters (name, tagline, address, logo).
  4. `theme`: Color configurations, display mode, and footer overrides.
  5. `backup`: Backup triggers and database export lists.
- **Module Settings Separation**: Do NOT add module-specific settings panels (e.g., student cutoff times or grading systems) to `/settings`. Place them inside each module's respective **Setup → Preferences** tab.

---

## 2. Systems Modules Navigation Registry
- **Sidebar Integration**: The sidebar layout retrieves navigation links from `NAV_ITEMS` in `navConfig.tsx`.
- **Academics Grouping**: Academics must render as a dropdown submenu containing `students`, `teachers`, `sessions`, `attendance`, `enrollment`, `hasanat`, and `examination`.
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

- **No Hardcoded Strings**: All user-facing UI copy, labels, placeholders, titles, and alert messages must resolve through the translation hook: `t('key')`. Hardcoded UI strings are forbidden.
- **Registry Key Bindings**: Settings, custom fields, and tables must use translation key references (e.g., `labelKey: AppTranslationKey`) and translate them at the render boundary using `t(labelKey)`.
- **Strict Typesafe Interpolation**: All translation keys are compile-time checked. Interpolated parameters in translation values (e.g., `{count}`) must be automatically parsed using template literal types (`ExtractPlaceholders` / `TranslationArgs<K>`) to enforce correct variable passing.
- **Cascading Translation Fallbacks**: Missing translations must fail gracefully. Systems resolve translations using a structured cascade: Farsi (`fa`) falls back to Arabic (`ar`), and all languages fall back to the English (`en`) map, preventing unrendered keys or blank fields.
- **Dynamic Bundle Splitting & Lazy Loading**: To prevent bundle bloat, all non-English language packs must be dynamically loaded (`import()`) in a React `useEffect` inside `TranslationProvider` when requested. Loaded language packs are cached in-memory inside the client translation registry.
- **Logical CSS Properties & RTL Styling**: RTL layouts (`ar`, `ur`, `fa`) must never use hardcoded directional positioning (e.g., `left`, `right`, `ml-*`, `pl-*`). Use CSS logical properties (Tailwind `text-start`, `text-end`, `ms-*`, `me-*`, `ps-*`, `pe-*`, `border-s-*`, `border-e-*`, and `rtl:*` modifiers) to ensure zero-code layout mirroring.
- **Reactive Layout Direction Hook**: Components and UI elements must consume layout direction reactively via `useTranslation()` (`dir: 'ltr' | 'rtl'`, `isRtl: boolean`, `isLoading: boolean`). Avoid reading the DOM dir attributes directly. Use these properties to flip icons, set relative positioning, or align charts dynamically.
- **Locale-Specific Typography & Font Stacking**: Apply language-specific typography stacks on the document root (`html`) when switching languages (`applyDocumentLanguage`). Proper fonts (e.g., Noto Nastaliq Urdu for `ur`, Vazirmatn for `fa`, Noto Sans Arabic for `ar`) must be loaded and applied via CSS variables (`--font-sans`, `--font-display`) to maintain readability and eliminate layout shifts (CLS).
- **Non-Destructive Live Settings Previews**: The system must support immediate in-memory locale/theme switching previews (using `useSettingsDraft` and `applyAppTheme`) in settings panels before persisting the configuration to PostgreSQL or local storage.
- **Settings-Aware Native `Intl` Formatting**: Date, time, and currency formatters must be localized using native browser `Intl` APIs (`Intl.DateTimeFormat`, `Intl.NumberFormat`) tied to the active locale tag (e.g., `ur-PK`, `fa-IR`, `ar-SA`, `en-GB`) to dynamically adapt formats without custom string manipulations.
- **Error Codes Mapping**: Backend APIs return stable error identifier strings (`type: 'forbidden'`), which the frontend maps dynamically to localized translations via `t('errors.{type}')`.

