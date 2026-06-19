---
trigger: always_on
---

# DRY Policy

**Don't Repeat Yourself** — one authoritative definition per concept. `@mms/shared` specifics: `mms-shared-dry.md`.

## Single source of truth

| Concern | Owner | Never duplicate in |
|---------|-------|-------------------|
| Types & DTOs | `@mms/shared` | FE lib copies, inline route types |
| Defaults & settings | `@mms/shared` `DEFAULT_*` + getters | Component literals |
| User-facing copy | `appTranslations` + `t()` | Hardcoded strings (`mms-i18n.md`) |
| Status colours/labels | Registries + `StatusBadge` | Inline hex / Tailwind maps |
| Permission checks | `can()` + `@mms/shared` matrix | `role === 'admin'` |
| Phone normalize | `parsePhoneNumber` (`@mms/shared`) | Local regex |
| Date/number format | Shared formatters + settings | `toLocaleDateString` ad hoc |
| API calls | `apiClient` | Raw `fetch('/api/...')` |
| Validation | Zod schema — share FE/BE shape via `@mms/shared` where possible | Parallel hand-written checks |
| Module tier tabs | `useModuleTierTabs()` | Inline tab arrays per page |

## Extraction threshold

Extract to shared helper/hook/component when **any** is true:

1. Same logic appears **≥2 times** (copy-paste or near-duplicate)
2. Used in **2+ modules** or **frontend + backend**
3. **Business rule** would diverge if edited in one place only
4. **>15 lines** of identical or parametrically identical code

Until threshold met, **inline once** — premature abstraction is banned.

## Layer rules

```
@mms/shared     pure types, constants, formatters, validation shapes
apps/*/services hooks, components, routes — orchestration only
```

| Put in shared | Keep local |
|---------------|------------|
| Pure functions, no I/O | React components |
| Types crossing FE/BE | Route handlers |
| Constants & enums | DB access |
| i18n dictionaries | Browser APIs / DOM |

## Module boundaries

- **No** cross-import between `components/{moduleA}/` and `components/{moduleB}/`
- **Yes** shared UI in `components/ui/`, shared hooks in `hooks/`, shared logic in `@mms/shared`
- Inter-module data: `local-database-update` event or Query invalidation — not imported singletons

## Config-driven UI

Prefer registries over branching (`mms-fields.md`):

```tsx
// ❌ Repeated field lists per form
// ✅ FIELD_REGISTRY + map render
```

## When touching duplication

1. Search codebase for existing owner (`grep` / semantic search)
2. Extend owner — do not fork
3. Delete superseded copies in the same PR
4. Run `pnpm typecheck` after moving symbols

## Anti-patterns

- “Utility” files that re-export unchanged third-party APIs
- Wrapper components that only pass props through with no behaviour
- Duplicate Zod schemas in FE and BE with drift
- Copy-paste tier tab definitions across module pages
