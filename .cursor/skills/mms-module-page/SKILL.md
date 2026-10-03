---
name: mms-module-page
description: Creates or modifies MMS module pages per mms-module-architecture.mdc — Work, Reports, Setup tiers, module manifest, ModulePageShell command centre, and settings panels. Use when adding a module, three-tier page, or aligning an existing module to universal architecture. Do NOT use for isolated form modals (use mms-form-architecture), Work directory tables/drawers (use mms-module-work), or custom field definitions (use mms-fields-registry).
license: Proprietary
metadata:
  owner: mms-platform
  last-verified: 2026-10-04
---

# MMS Module Page Pattern

**Rule (norms SSOT):** `mms-module-architecture.mdc` · `mms-ui-ux-design.mdc` §4, §8 · `mms-hooks.mdc` · `mms-performance.mdc`.
**Workflows:** `/feature-module` · **Manifest:** `.agent/skills-manifest.json`

## When to use

- Adding a new tenant module page or aligning an existing page to the three-tier shell
- Registering module routes / manifests / permission gates at the page level
- Changing `ModulePageShell` tier loading, persisted tab state, or header command centre

## Anti-Patterns & Banned Operations

- ❌ **NEVER deviate from 3 tiers**: Top-level module navigation is strictly limited to Work, Reports, and Setup.
- ❌ **NEVER place the header inside a tab panel**: the `ModulePageShell` header stays anchored above the tier switcher on every tier.
- ❌ **NEVER omit lazy tier loading**: each non-Work tier is a `React.lazy()` chunk rendered inside `Suspense` (`ModuleTierMotion` → `ErrorBoundary` → `Suspense`).
- ❌ **NEVER hardcode tier IDs**: always `useFilteredModuleTierTabs({ canViewSetup, canViewReports })`, and drive visibility from `useModulePermissions(MODULE_MANIFEST)`.
- ❌ **NEVER keep tier state in `useState`**: use `usePersistedTabState` so a refresh/reload keeps the user on the same tier.
- ❌ **NEVER hand-roll the header/tab shell**: `ModulePageShell` (→ `ModuleScaffold`) already owns SEO metadata, `PageHeader`, the metrics strip, and `ResponsiveAccordionTabs`.

## Implementation map

| Concern | Path / symbol |
|---------|----------------|
| Gold pages | `apps/frontend/src/tenant/features/accounting/AccountingPage.tsx`, `.../contacts/ContactsPage.tsx` |
| Shell | `apps/frontend/src/components/ui/ModulePageShell.tsx` |
| Tier tabs | `apps/frontend/src/tenant/hooks/useModuleTierTabs.ts` (`useFilteredModuleTierTabs`) |
| Permissions | `apps/frontend/src/tenant/hooks/usePermissions.ts` (`useModulePermissions`) |
| Tab + trash state | `apps/frontend/src/hooks/usePersistedTabState.ts`, `apps/frontend/src/hooks/useTrashMode.ts` |
| Router | `apps/frontend/src/components/routing/HostRoutes.tsx` |
| Policy | `packages/shared/src/moduleAccessPolicy.ts` + `ModuleAccessRoute` |
| Template | `examples/TemplateModulePage.tsx` |

Derive allowed tabs with `useFilteredModuleTierTabs`, intersect persisted selection before rendering, and gate Reports/Setup content on capability. A hidden tab label alone does not protect its panel.

## Verification

```
- [ ] Module manifest registered in @mms/shared and passed to useModulePermissions
- [ ] ModulePageShell header command centre stays visible across all tiers
- [ ] Tier list from useFilteredModuleTierTabs, active tier from usePersistedTabState
- [ ] Reports/Setup tiers lazy-loaded behind Suspense + ErrorBoundary + ModuleTierMotion
- [ ] Work directory virtualizes > 30 rows (@tanstack/react-virtual)
- [ ] Trash mode (?view=trash) via useTrashMode, with restore + bulk restore wired
- [ ] i18n keys added to en/ar/ur/fa (pnpm run check:i18n)
- [ ] Verify: pnpm typecheck && pnpm --filter mms-frontend lint
```

## Related skills

`mms-module-work`, `mms-module-setup`, `mms-reports-export`, `mms-fields-registry`, `mms-form-architecture`.
