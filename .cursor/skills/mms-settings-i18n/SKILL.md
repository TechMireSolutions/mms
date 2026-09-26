---
name: mms-settings-i18n
description: Governs application-wide settings panels (/settings), settings preview states, sidebar navigation registries, and localization/i18n standards (en/ar/ur/fa). Use when adding or modifying settings, sidebar navigation items, custom localizations, translation files, or RTL/LTR layout mirroring. Do NOT use for per-module setup preferences (use mms-module-setup), full encrypted backup/restore (use mms-backup-restore), or generic BiDi UI tokens (use mms-ui-ux-design).
license: Proprietary
metadata:
  owner: mms-platform
  last-verified: 2026-09-24
---

# MMS Settings, Navigation & Internationalization

**Rule (norms SSOT):** `mms-settings-i18n.mdc` · `mms-ui-ux-design.mdc` · `mms-core.mdc`.
**Workflows:** `/feature-module` · **Manifest:** `.agent/skills-manifest.json`

## Accounting localization

Advisory: use [exact-money guidance](../mms-finance-accounting/references/ledger-controls.md). Locale controls presentation, not functional currency, fiscal dates, or stored scale. Preserve ISO accounting dates and stable source/account IDs; parse localized input through an explicit validated boundary.

Check debit/credit signs, negative amounts, separators, currency codes, and mixed RTL identifiers in forms, charts, and PDF/CSV/XLSX output. Formatting must not revalue historical amounts or convert missing data into zero. Translate statement labels according to the selected framework, not by assuming every nonprofit uses company terminology.

## Anti-Patterns & Banned Operations

- ❌ **NEVER use fallback strings in `t()`**: Strict ban on `t('key') || 'English Default'`. Register the key in `appTranslationsEn.ts` first.
- ❌ **NEVER use physical directional CSS**: Ban `pl-`, `pr-`, `ml-`, `mr-`, `left-`, `right-`. Use logical CSS (`ps-`, `pe-`, `ms-`, `me-`, `start-`, `end-`).
- ❌ **NEVER add RTL locale packs for platform apex**: Platform administration is strictly English/LTR.
- ❌ **NEVER put module-specific preferences under `/settings`**: Module preferences belong under their respective module Setup tier (`mms-module-setup`).

## Localization and navigation workflow

Use `useTranslation` from `@/hooks/useTranslation`, with `AppTranslationKey` for application-owned labels. Keep user-authored field labels as data. Internal navigation uses the existing React Router/shared navigation component; avoid a raw anchor that reloads the SPA. Use semantic tokens, typed icons and logical spacing.

Advisory: test locale changes while dialogs and queries are active; interpolation, errors and accessible names must update too. Preserve LTR formatting for phone/identifier strings inside RTL text with appropriate isolation. Do not replace theme/font tokens with a copied palette.

## Verification Checklist

```
- [ ] New keys registered in appTranslationsEn.ts and synced to ar/ur/fa
- [ ] Zero t('key') || 'English' fallback idioms
- [ ] Pure logical CSS properties (ps-, pe-, ms-, me-, start-, end-)
- [ ] Date and currency formatted via formatDate and formatMoney
- [ ] Run: pnpm typecheck && cd apps/frontend && pnpm lint
```
