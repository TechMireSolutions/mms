---
name: mms-settings-i18n
description: Governs application-wide settings panels (/settings), settings preview states, sidebar navigation registries, and localization/i18n standards (en/ar/ur/fa). Use when adding or modifying settings, sidebar navigation items, custom localizations, translation files, or RTL/LTR layout mirroring. Do NOT use for per-module setup preferences (use mms-module-setup), full encrypted backup/restore (use mms-backup-restore), or generic BiDi UI tokens (use mms-ui-ux-design).
license: Proprietary
metadata:
  owner: mms-platform
  last-verified: 2026-09-15
---

# MMS Settings, Navigation & Internationalization

**Rule (norms SSOT):** `mms-settings-i18n.mdc` · `mms-ui-ux-design.mdc` · `mms-core.mdc`.
**Workflows:** `/feature-module` · **Manifest:** `.agent/skills-manifest.json`

## Anti-Patterns & Banned Operations

- ❌ **NEVER use fallback strings in `t()`**: Strict ban on `t('key') || 'English Default'`. Register the key in `appTranslationsEn.ts` first.
- ❌ **NEVER use physical directional CSS**: Ban `pl-`, `pr-`, `ml-`, `mr-`, `left-`, `right-`. Use logical CSS (`ps-`, `pe-`, `ms-`, `me-`, `start-`, `end-`).
- ❌ **NEVER add RTL locale packs for platform apex**: Platform administration is strictly English/LTR.
- ❌ **NEVER put module-specific preferences under `/settings`**: Module preferences belong under their respective module Setup tier (`mms-module-setup`).

## Canonical Localization & Directional Pattern

```tsx
import { useTranslation } from '@/lib/i18n';

export function NavigationItem({ labelKey, icon: Icon, href }: { labelKey: string; icon: any; href: string }) {
  const { t, isRtl } = useTranslation();

  return (
    <a
      href={href}
      className="flex items-center gap-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
    >
      <Icon className="h-5 w-5 shrink-0 text-slate-500" />
      <span className="truncate">{t(labelKey)}</span>
      {/* Logical margin spacing automatically mirrors in RTL */}
      <span className="ms-auto text-xs text-slate-400">
        {isRtl ? '←' : '→'}
      </span>
    </a>
  );
}
```

## Verification Checklist

```
- [ ] New keys registered in appTranslationsEn.ts and synced to ar/ur/fa
- [ ] Zero t('key') || 'English' fallback idioms
- [ ] Pure logical CSS properties (ps-, pe-, ms-, me-, start-, end-)
- [ ] Date and currency formatted via formatDate and formatMoney
- [ ] Run: pnpm typecheck && cd apps/frontend && pnpm lint
```
