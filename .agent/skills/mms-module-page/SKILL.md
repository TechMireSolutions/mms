---
name: mms-module-page
description: Creates or modifies MMS module pages per mms-module-architecture.md — Work, Reports, Setup tiers, module manifest, ModulePageShell command centre, and settings panels. Use when adding a module, three-tier page, or aligning an existing module to universal architecture. Do NOT use for isolated form modals (use mms-form-architecture), Work directory tables/drawers (use mms-module-work), or custom field definitions (use mms-fields-registry).
license: Proprietary
metadata:
  owner: mms-platform
  last-verified: 2026-09-15
---

# MMS Module Page Pattern

**Rule (norms SSOT):** `mms-module-architecture.md` · `mms-ui-ux-design.md` §4 · `mms-hooks.md` · `mms-performance.md`.
**Workflows:** `/feature-module` · **Manifest:** `.agent/skills-manifest.json`

Gold-standard reference implementation: `apps/frontend/src/tenant/features/accounting/AccountingPage.tsx` (Work | Reports | Setup with sub-tabs, trash mode, and persisted tier state).

## Anti-Patterns & Banned Operations

- ❌ **NEVER deviate from 3 tiers**: Top-level module navigation is strictly limited to Work, Reports, and Setup.
- ❌ **NEVER place the header inside a tab panel**: the `ModulePageShell` header stays anchored above the tier switcher on every tier.
- ❌ **NEVER omit lazy tier loading**: each non-Work tier is a `React.lazy()` chunk rendered inside `Suspense` (`ModuleTierMotion` → `ErrorBoundary` → `Suspense`).
- ❌ **NEVER hardcode tier IDs**: always `useFilteredModuleTierTabs({ canViewSetup, canViewReports })`, and drive visibility from `useModulePermissions(MODULE_MANIFEST)`.
- ❌ **NEVER keep tier state in `useState`**: use `usePersistedTabState` so a refresh/reload keeps the user on the same tier.
- ❌ **NEVER hand-roll the header/tab shell**: `ModulePageShell` (→ `ModuleScaffold`) already owns SEO metadata, `PageHeader`, the metrics strip, and `ResponsiveAccordionTabs`.

## Canonical 3-Tier Scaffold Template

```tsx
import React, { Suspense } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { usePersistedTabState } from '@/hooks/usePersistedTabState';
import { useTrashMode } from '@/hooks/useTrashMode';
import { useModulePermissions } from '@/tenant/hooks/usePermissions';
import { useFilteredModuleTierTabs } from '@/tenant/hooks/useModuleTierTabs';
import { ModulePageShell } from '@/components/ui/ModulePageShell';
import { ModuleTierMotion } from '@/components/ui/ModuleTierMotion';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import RouteStatusFallback from '@/components/routing/RouteStatusFallback';
import { ENTITY_MODULE_MANIFEST } from '@mms/shared';
import { EntityCommandMetrics } from './components/EntityCommandMetrics';

// One lazy chunk per non-Work tier (named exports → default mapping).
const EntityWorkTier = React.lazy(() =>
  import('./components/EntityWorkTier').then((m) => ({ default: m.EntityWorkTier })),
);
const EntityReportsTier = React.lazy(() =>
  import('./components/EntityReportsTier').then((m) => ({ default: m.EntityReportsTier })),
);
const EntitySetupTier = React.lazy(() =>
  import('./components/EntitySetupTier').then((m) => ({ default: m.EntitySetupTier })),
);

export default function EntityPage() {
  const { t } = useTranslation();
  const { canWrite, canDelete, canReports: canViewReports, canViewSetup } =
    useModulePermissions(ENTITY_MODULE_MANIFEST);

  // Returns ModuleTierTab[] — the tab list, NOT the active-tab state.
  const tierTabs = useFilteredModuleTierTabs({ canViewSetup, canViewReports });
  const [activeTab, setActiveTab] = usePersistedTabState<string>('entity_active_tab', 'work');
  const [showDeleted, setShowDeleted] = useTrashMode();

  return (
    <ModulePageShell
      seoTitle={`MMS - ${t('nav.entities')}`}
      seoDescription={t('page.entities.subtitle')}
      headerTitle={t('nav.entities')}
      headerSubtitle={t('page.entities.subtitle')}
      metricsStrip={<EntityCommandMetrics />}
      tabs={tierTabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      panelIdPrefix="entity-tier"
    >
      <ErrorBoundary>
        <ModuleTierMotion tier={activeTab} className="space-y-4">
          <Suspense fallback={<RouteStatusFallback />}>
            {activeTab === 'work' && (
              <EntityWorkTier
                canWrite={canWrite}
                canDelete={canDelete}
                showDeleted={showDeleted}
                onShowDeletedChange={() => setShowDeleted((prev) => !prev)}
              />
            )}
            {activeTab === 'reports' && <EntityReportsTier />}
            {activeTab === 'setup' && <EntitySetupTier />}
          </Suspense>
        </ModuleTierMotion>
      </ErrorBoundary>
    </ModulePageShell>
  );
}
```

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
