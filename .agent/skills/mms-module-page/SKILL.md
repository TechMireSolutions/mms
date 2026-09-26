---
name: mms-module-page
description: Creates or modifies MMS module pages per mms-module-architecture.md — Work, Reports, Setup tiers, module manifest, ModulePageShell command centre, and settings panels. Use when adding a module, three-tier page, or aligning an existing module to universal architecture. Do NOT use for isolated form modals (use mms-form-architecture), Work directory tables/drawers (use mms-module-work), or custom field definitions (use mms-fields-registry).
license: Proprietary
metadata:
  owner: mms-platform
  last-verified: 2026-09-26
---

# MMS Module Page Pattern

**Rule (norms SSOT):** `mms-module-architecture.md` · `mms-ui-ux-design.md` §4, §8 · `mms-hooks.md` · `mms-performance.md`.
**Workflows:** `/feature-module` · **Manifest:** `.agent/skills-manifest.json`

Gold-standard reference implementation: `apps/frontend/src/tenant/features/accounting/AccountingPage.tsx` (Work | Reports | Setup with sub-tabs, trash mode, and persisted tier state).

## Anti-Patterns & Banned Operations

- ❌ **NEVER deviate from 3 tiers**: Top-level module navigation is strictly limited to Work, Reports, and Setup.
- ❌ **NEVER place the header inside a tab panel**: the `ModulePageShell` header stays anchored above the tier switcher on every tier.
- ❌ **NEVER omit lazy tier loading**: each non-Work tier is a `React.lazy()` chunk rendered inside `Suspense` (`ModuleTierMotion` → `ErrorBoundary` → `Suspense`).
- ❌ **NEVER hardcode tier IDs**: always `useFilteredModuleTierTabs({ canViewSetup, canViewReports })`, and drive visibility from `useModulePermissions(MODULE_MANIFEST)`.
- ❌ **NEVER keep tier state in `useState`**: use `usePersistedTabState` so a refresh/reload keeps the user on the same tier.
- ❌ **NEVER hand-roll the header/tab shell**: `ModulePageShell` (→ `ModuleScaffold`) already owns SEO metadata, `PageHeader`, the metrics strip, and `ResponsiveAccordionTabs`.

## Three-tier scaffold workflow

Use `apps/frontend/src/tenant/features/contacts/ContactsPage.tsx` and the module's real manifest as references. `examples/TemplateModulePage.tsx` points to the actual shell contracts instead of exporting fictional manifest symbols.

Advisory review: derive allowed tabs with `useFilteredModuleTierTabs`, intersect persisted selection with those tabs before rendering, and gate Reports/Setup content and queries on the corresponding capability. Apply a safe fallback if permission changed or a tab was removed. A hidden tab label alone does not protect its panel. Preserve the module's existing lazy tier boundaries, header actions and metrics permissions.

Route registration is lazy at the router level too — add the page to `apps/frontend/src/components/routing/HostRoutes.tsx` (tenant) or the equivalent platform routing module. Do not invent an `AppRoutes`/`PlatformRoutes` module; the repo has a single host-aware router.

## Gold-Standard Parity Checklist (§7)

```
- [ ] Module manifest registered in @mms/shared and passed to useModulePermissions
- [ ] ModulePageShell header command centre stays visible across all tiers
- [ ] Tier list from useFilteredModuleTierTabs, active tier from usePersistedTabState
- [ ] Reports/Setup tiers lazy-loaded behind Suspense + ErrorBoundary + ModuleTierMotion
- [ ] Work directory virtualizes > 30 rows (@tanstack/react-virtual)
- [ ] ErrorState carries a retry action and loadFailedHint on fetch error
- [ ] Trash mode (?view=trash) via useTrashMode, with restore + bulk restore wired
- [ ] i18n keys added to en/ar/ur/fa (pnpm run check:i18n)
- [ ] Verify: pnpm typecheck && pnpm --filter mms-frontend lint
```
