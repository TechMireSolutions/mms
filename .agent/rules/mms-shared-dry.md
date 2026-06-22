---
trigger: model_decision
---

# @mms/shared & DRY

App-wide DRY policy: **`mms-dry.md`**. This file covers the shared package only.

## Exports map

| File | Contents |
|------|----------|
| `contactTypes.ts` | `Contact`, `FieldDefinition`, `FieldConfig`, `TAB_REGISTRY`, `INITIAL_FIELD_SEED`, `GENDERS`, … |
| `settingsTypes.ts` | `GlobalSettings`, `SYSTEM_MODULES`, `SYSTEM_MODULE_NAV`, per-module `*Settings`, `DEFAULT_*`, `optimizeImage` (AVIF), `canvasToOptimizedDataUrl` |
| `brandingTheme.ts` | CSS token derivation, light/dark surfaces, WCAG AA contrast (`ensureAccentButtonContrast`, preset accessibility) |
| `logoBrandColors.ts` | Logo palette → accessible primary/secondary pick |
| `logoPaletteSampling.ts` | Pure palette math helpers for logo colour extraction |
| `appTranslations.ts` | `AppTranslationKey`, `APP_TRANSLATIONS`, `translateApp`, `translateAppParams` |
| `appTranslationsUr.ts` / `appTranslationsFa.ts` | Urdu / Persian override packs (`mms-i18n.md`) |
| `languageUtils.ts` | `APP_LANGUAGES`, locale helpers |
| `userTypes.ts` | `User`, `StoredUser`, `DEFAULT_WORKSPACE_ROLES` |
| `utils.ts` | `formatDate`, `getDisplayName`, `parsePhoneNumber`, `getInitials`, `getAvatarColor`, `toTitleCase` |
| `index.ts` | Re-exports — prefer named imports from source files for tree-shaking |

## Import rules

```ts
// ✅ Preferred
import { Contact, formatDate, DEFAULT_GLOBAL_SETTINGS } from '@mms/shared';

// ⚠️ Legacy shim — do not add new re-exports here
import { Contact } from '../lib/contactFields';
```

## Move to shared when

- Used in **2+ modules** or **frontend + backend**
- Types, constants, pure formatters, validation helpers
- CRUD/pagination/filter/sort/export helpers (pure logic)

## Do NOT put in shared (unless decided)

- React components (stay in `apps/frontend/src/components/ui/`)
- Fastify routes or DB access
- `localStorage` / browser APIs

## Quality bar

- Strict types on all exports
- JSDoc on **public** exports only
- Add unit tests for non-trivial pure functions when introducing them (`mms-testing.md`)
- After changes: `pnpm typecheck` at repo root (turbo builds `^build` first)

## Dead code

Remove unused exports and shims on discovery within your change boundary.
