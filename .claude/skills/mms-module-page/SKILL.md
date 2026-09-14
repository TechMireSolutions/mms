---
name: mms-module-page
description: Creates or modifies MMS module pages per mms-module-architecture.md — Work, Reports, Setup tiers, module manifest, PageHeader command centre, and settings panels. Use when adding a module, three-tier page, or aligning an existing module to universal architecture. Do NOT use for isolated form modals (use mms-form-architecture), Work directory tables/drawers (use mms-module-work), or custom field definitions (use mms-fields-registry).
---

# MMS Module Page Pattern

**Rule (norms SSOT):** `mms-module-architecture.md` · `mms-ui-ux-design.md` §7 · `mms-hooks.md` · `mms-performance.md`.
**Workflows:** `/feature-module` · **Manifest:** `.agent/skills-manifest.json`

## Anti-Patterns & Banned Operations

- ❌ **NEVER deviate from 3 tiers**: Top-level module navigation is strictly limited to Work, Reports, and Setup.
- ❌ **NEVER place PageHeader inside tabs**: `PageHeader` must remain anchored at the root of the page above the tier tab switcher.
- ❌ **NEVER omit lazy routing**: Every module page must be dynamically imported via `React.lazy()` with `Suspense` in `AppRoutes.tsx` or `PlatformRoutes.tsx`.
- ❌ **NEVER hardcode tab IDs**: Always use `useFilteredModuleTierTabs({ canViewSetup, canViewReports })`.

## Canonical 3-Tier Scaffold Template

```tsx
import { lazy, Suspense } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ResponsiveAccordionTabs } from '@/components/ui/ResponsiveAccordionTabs';
import { useFilteredModuleTierTabs } from '@/tenant/hooks/useFilteredModuleTierTabs';
import { useTranslation } from '@/lib/i18n';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const WorkTab = lazy(() => import('./tabs/WorkTab'));
const ReportsTab = lazy(() => import('./tabs/ReportsTab'));
const SetupTab = lazy(() => import('./tabs/SetupTab'));

export default function EntityModulePage() {
  const { t } = useTranslation();
  const { activeTab, setActiveTab, visibleTabs } = useFilteredModuleTierTabs({
    canViewSetup: true,
    canViewReports: true,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('entities.moduleTitle')}
        description={t('entities.moduleSubtitle')}
      />

      <ResponsiveAccordionTabs
        tabs={visibleTabs}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <Suspense fallback={<LoadingSpinner />}>
        {activeTab === 'work' && <WorkTab />}
        {activeTab === 'reports' && <ReportsTab />}
        {activeTab === 'setup' && <SetupTab />}
      </Suspense>
    </div>
  );
}
```

## Gold-Standard Parity Checklist (§7)

```
- [ ] Module manifest registered in @mms/shared
- [ ] PageHeader command centre stays visible across all tabs
- [ ] ResponsiveAccordionTabs wired with useFilteredModuleTierTabs
- [ ] Lazy loaded tabs with Suspense boundaries
- [ ] Work directory supports @tanstack/react-virtual for >30 rows
- [ ] ErrorState with retry button and loadFailedHint on fetch error
- [ ] Keyboard shortcut Cmd/Ctrl+N creates record when authorized
- [ ] Run: pnpm typecheck && cd apps/frontend && pnpm lint
```
