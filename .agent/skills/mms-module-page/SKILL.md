---
name: mms-module-page
description: Creates or modifies MMS module pages per mms-module-architecture.md — operational tabs plus required Reports/Setup, module manifest, ModulePageShell command centre, and settings panels. Use when adding a module page, aligning tab navigation, or aligning an existing module to universal architecture. Do NOT use for isolated form modals (use mms-form-architecture), Work directory tables/drawers (use mms-module-work), or custom field definitions (use mms-fields-registry).
license: Proprietary
metadata:
  owner: mms-platform
  last-verified: 2026-10-04
---

# MMS Module Page Pattern

**Rule (norms SSOT):** `mms-module-architecture.md` · `mms-ui-ux-design.md` §4, §8 · `mms-hooks.md` · `mms-performance.md`.
**Workflows:** `/feature-module` · **Manifest:** `.agent/skills-manifest.json`

## When to use

- Adding a new tenant module page or aligning an existing page to the module tab shell
- Registering module routes / manifests / permission gates at the page level
- Changing `ModulePageShell` tier loading, persisted tab state, or header command centre

## Anti-Patterns & Banned Operations

- ❌ **NEVER omit Reports or Setup** as top-level anchors (omit from DOM only when the user lacks `canViewReports` / `canViewSetup`).
- ❌ **NEVER label the primary operational tab "Work"** in product UI — use the module name (`nav.*` / entity tab key) via `workLabelKey` on `useFilteredModuleTierTabs`.
- ❌ **NEVER ban peer operational tabs** when a module has multiple day-to-day entities (Faculty pattern); keep charts in Reports and config in Setup.
- ❌ **NEVER place the header inside a tab panel**: the `ModulePageShell` header stays anchored above the tier switcher on every tier.
- ❌ **NEVER omit lazy tier loading**: each non-primary operational tier is a `React.lazy()` chunk rendered inside `Suspense` (`ModuleTierMotion` → `ErrorBoundary` → `Suspense`).
- ❌ **NEVER hardcode tier IDs for standard modules**: use `useFilteredModuleTierTabs({ canViewSetup, canViewReports, workLabelKey })`, and drive visibility from `useModulePermissions(MODULE_MANIFEST)`.
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

Derive allowed tabs with `useFilteredModuleTierTabs({ workLabelKey: 'nav.<module>' })` (or explicit peer tabs for multi-ops modules), intersect persisted selection before rendering, and gate Reports/Setup content on capability. A hidden tab label alone does not protect its panel.

## Verification

```
- [ ] Module manifest registered in @mms/shared and passed to useModulePermissions
- [ ] ModulePageShell header command centre stays visible across all tiers
- [ ] Tier list from useFilteredModuleTierTabs with workLabelKey (or Faculty-style peer tabs)
- [ ] Primary operational tab label is the module/entity name — not "Work"
- [ ] Reports + Setup present when permitted; lazy-loaded behind Suspense + ErrorBoundary + ModuleTierMotion
- [ ] Active tier from usePersistedTabState
- [ ] Work directory virtualizes > 30 rows (@tanstack/react-virtual)
- [ ] Trash mode (?view=trash) via useTrashMode, with restore + bulk restore wired
- [ ] i18n keys added to en/ar/ur/fa (pnpm run check:i18n)
- [ ] Verify: pnpm typecheck && pnpm --filter mms-frontend lint
```

## Related skills

`mms-module-work`, `mms-module-setup`, `mms-reports-export`, `mms-fields-registry`, `mms-form-architecture`.
