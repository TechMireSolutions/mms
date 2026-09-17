import React, { Suspense, lazy } from "react";
import { School } from "lucide-react";
import { ModulePageShell } from "@/components/ui/ModulePageShell";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { useTranslation } from "@/hooks/useTranslation";
import { FacultyCommandMetrics } from "@/tenant/features/faculty/components/FacultyCommandMetrics";
import { FacultyPageHeaderActions } from "@/tenant/features/faculty/components/FacultyPageHeaderActions";
import { FacultyPageOverlays } from "@/tenant/features/faculty/components/FacultyPageOverlays";
import { AnimatePresence } from "framer-motion";
import RouteStatusFallback from "@/components/routing/RouteStatusFallback";
import { FacultyWorkTier } from "@/tenant/features/faculty/components/FacultyWorkTier";
import type { useFacultyPageController } from "@/tenant/features/faculty/hooks/useFacultyPageController";

const FacultyReportsTier = lazy(() =>
  import("@/tenant/features/faculty/components/FacultyReportsTier").then((m) => ({
    default: m.FacultyReportsTier,
  }))
);
const FacultySetupTier = lazy(() =>
  import("@/tenant/features/faculty/components/FacultySetupTier").then((m) => ({
    default: m.FacultySetupTier,
  }))
);

export type FacultyPageViewProps = ReturnType<typeof useFacultyPageController>;
export type TeachersPageViewProps = FacultyPageViewProps;

/** Presentational Faculty page shell — Work / Reports / Setup + create form. */
export function FacultyPageView({
  canWrite,
  canExport,
  visibleTabs,
  metricsTotal,
  activeTab,
  setActiveTab,
  viewingDeleted,
  shownCount,
  openCreateForm,
  handleExportCSV,
  tabPanelProps,
  pageOverlaysProps,
}: FacultyPageViewProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <ModulePageShell
      seoTitle={`MMS - ${t('nav.faculty')}`}
      seoDescription={t('page.teachers.subtitle')}
      headerIcon={School}
      headerTitle={t('nav.faculty')}
      headerSubtitle={t('page.teachers.subtitle')}
      headerActions={
        <FacultyPageHeaderActions
          canExport={canExport}
          canWrite={canWrite}
          viewingDeleted={viewingDeleted}
          onExport={() => {
            void handleExportCSV();
          }}
          onAddTeacher={openCreateForm}
        />
      }
      metricsStrip={
        <FacultyCommandMetrics total={metricsTotal ?? shownCount} shown={shownCount} />
      }
    >
      <ResponsiveAccordionTabs
        tabs={visibleTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        panelIdPrefix="teachers-tab"
      >
        <AnimatePresence mode="wait">
          {activeTab === "work" ? (
            <FacultyWorkTier {...tabPanelProps.workTierProps} />
          ) : activeTab === "reports" ? (
            <Suspense fallback={<RouteStatusFallback />}>
              <FacultyReportsTier />
            </Suspense>
          ) : activeTab === "setup" ? (
            <Suspense fallback={<RouteStatusFallback />}>
              <FacultySetupTier />
            </Suspense>
          ) : null}
        </AnimatePresence>
      </ResponsiveAccordionTabs>

      <FacultyPageOverlays {...pageOverlaysProps} />
    </ModulePageShell>
  );
}

export const TeachersPageView = FacultyPageView;
export default FacultyPageView;
