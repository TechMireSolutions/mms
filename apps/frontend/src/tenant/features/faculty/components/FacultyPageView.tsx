import React, { Suspense, lazy } from "react";
import { School } from "lucide-react";
import { ModulePageShell } from "@/components/ui/ModulePageShell";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { useTranslation } from "@/hooks/useTranslation";
import { useIndustryTerminology } from "@/tenant/hooks/useIndustryTerminology";
import { FacultyCommandMetrics } from "@/tenant/features/faculty/components/FacultyCommandMetrics";
import { FacultyPageHeaderActions } from "@/tenant/features/faculty/components/FacultyPageHeaderActions";
import { FacultyPageOverlays } from "@/tenant/features/faculty/components/FacultyPageOverlays";
import { FacultyWorkShell } from "@/tenant/features/faculty/components/FacultyWorkShell";
import { AnimatePresence } from "framer-motion";
import RouteStatusFallback from "@/components/routing/RouteStatusFallback";
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

/** Presentational Faculty page shell — Faculties / Reports / Setup + work sub-tabs. */
export function FacultyPageView({
  canWrite,
  canExport,
  visibleTabs,
  workSubTabs,
  activeWorkSubTab,
  setActiveWorkSubTab,
  showWorkHeaderActions,
  metricsTotal,
  activeTab,
  setActiveTab,
  viewingDeleted,
  shownCount,
  openCreateForm,
  openCreateDepartment,
  openCreateDesignation,
  onExportEntity,
  onImportEntity,
  tabPanelProps,
  pageOverlaysProps,
}: FacultyPageViewProps): React.JSX.Element {
  const { t } = useTranslation();
  const terminology = useIndustryTerminology();

  return (
    <ModulePageShell
      seoTitle={`MMS - ${terminology.facultyLabel}`}
      seoDescription={t('page.faculty.subtitle')}
      headerIcon={School}
      headerTitle={terminology.facultyLabel}
      headerSubtitle={t('page.faculty.subtitle')}
      headerActions={
        showWorkHeaderActions ? (
          <FacultyPageHeaderActions
            canExport={canExport}
            canWrite={canWrite}
            viewingDeleted={viewingDeleted}
            staffSingular={terminology.staffSingular}
            onExportEntity={onExportEntity}
            onImportEntity={onImportEntity}
            onAddFaculty={openCreateForm}
            onAddDepartment={openCreateDepartment}
            onAddDesignation={openCreateDesignation}
          />
        ) : undefined
      }
      metricsStrip={
        <FacultyCommandMetrics total={metricsTotal ?? shownCount} shown={shownCount} />
      }
    >
      <ResponsiveAccordionTabs
        tabs={visibleTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        panelIdPrefix="faculty-tab"
      >
        <AnimatePresence mode="wait">
          {activeTab === "work" ? (
            <FacultyWorkShell
              subTabs={workSubTabs}
              activeSubTab={activeWorkSubTab}
              onSubTabChange={setActiveWorkSubTab}
              directoryProps={tabPanelProps.workTierProps}
              onRequestAddDepartment={openCreateDepartment}
              onRequestAddDesignation={openCreateDesignation}
            />
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

export default FacultyPageView;
