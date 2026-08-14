---
name: mms-settings-i18n
description: Governs application-wide settings panels (/settings), settings preview states, sidebar navigation registries, and localization/i18n standards (en/ar/ur/fa). Use when adding or modifying settings, sidebar navigation items, custom localizations, translation files, or RTL/LTR layout mirroring.
---

# MMS Settings, Navigation & Internationalization

**Rule (norms SSOT):** `mms-settings-i18n.mdc` — do not re-author policy here.

Related: `mms-ui-ux-design.mdc` (RTL/a11y), `mms-fields.mdc` (labelKey). Backup wipe-restore workflow → skill **`mms-backup-restore`**.

## Workflow

1. App-wide settings only on `/settings` via `SettingsTabContext` + `SETTINGS_SECTIONS` (`global`, `modules`, `branding`, `theme`, `backup`, `llm`). Module prefs → module Setup → Preferences.
2. Sidebar/nav from `NAV_ITEMS` / `SYSTEM_MODULE_NAV` in `navConfig.tsx` — Academics grouped; no ad-hoc sidebar links.
3. Drafts via `useSettingsDraft` / `useBrandingDraft` / `useThemeSettingsDraft`; `onPreview(draft)`; `revertSettingsPreviews()` on leave.
4. New copy: key in `appTranslationsEn.ts` → ar → ur → fa overrides; render with `t('key')` only (no English `||` fallbacks).
5. Dates/money: `formatDate` / `formatMoney` (+ currency hooks) — never raw locale string math.
6. **Platform apex**: English/LTR always — do not create platform locale packs. Platform UI still uses `t()` but all translations resolve to English (no ar/ur/fa overrides for platform). Unknown-tenant hard-redirect enforced via `TenantBootGate`.
7. Backup UI: two-step + password step-up + validate-before-wipe — details in **`mms-backup-restore`**; copy via `backup.*` keys.

## Checklist

```
- [ ] No module prefs on /settings
- [ ] Nav from registries only
- [ ] Draft + preview; revert on leave
- [ ] t() keys in en (+ ar/ur/fa as needed); labelKey on registries
- [ ] Logical CSS / useTranslation dir for RTL
- [ ] formatDate / formatMoney only
- [ ] Platform English lock + tenant-not-found redirect intact
- [ ] Backup changes follow mms-backup-restore
```

## Do Not

- Hardcode UI strings or directional `left`/`ml-*`
- Open `/settings` on a missing tenant host
- Dual-write backup from browser cache alone
- Add ar/ur/fa locale packs for platform views — platform is English-only

## Done

`mms-completion-review.mdc` — typecheck + FE lint when UI touched.
