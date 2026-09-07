import React, { Suspense, lazy } from "react";
import { GraduationCap } from "lucide-react";
import { ModulePageShell } from "@/components/ui/ModulePageShell";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { StudentsCommandMetrics } from "@/tenant/features/students/components/StudentsCommandMetrics";
import { StudentsPageHeaderActions } from "@/tenant/features/students/components/StudentsPageHeaderActions";
import { StudentsPageOverlays } from "@/tenant/features/students/components/StudentsPageOverlays";
import { AnimatePresence } from "framer-motion";
import RouteStatusFallback from "@/components/routing/RouteStatusFallback";
import { StudentsWorkTier } from "@/tenant/features/students/components/StudentsWorkTier";
import { useTranslation } from "@/hooks/useTranslation";
import type { useStudentsPageController } from "@/tenant/features/students/hooks/useStudentsPageController";

const StudentsReportsTier = lazy(() =>
  import("@/tenant/features/students/components/StudentsReportsTier").then((m) => ({
    default: m.StudentsReportsTier,
  }))
);
const StudentsSetupTier = lazy(() => import("@/tenant/features/students/components/StudentsSetupTier"));

export type StudentsPageViewProps = ReturnType<typeof useStudentsPageController>;

/** Presentational Students page shell — Work / Reports / Setup + create form. */
export function StudentsPageView({
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
}: StudentsPageViewProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <ModulePageShell
      seoTitle={t("page.students.seoTitle")}
      seoDescription={t("page.students.subtitle")}
      headerIcon={GraduationCap}
      headerTitle={t("nav.students")}
      headerSubtitle={t("page.students.subtitle")}
      headerActions={
        <StudentsPageHeaderActions
          canExport={canExport}
          canWrite={canWrite}
          viewingDeleted={viewingDeleted}
          onExport={() => {
            void handleExportCSV();
          }}
          onAddStudent={openCreateForm}
        />
      }
      metricsStrip={
        <StudentsCommandMetrics total={metricsTotal ?? shownCount} shown={shownCount} />
      }
    >
      <ResponsiveAccordionTabs
        tabs={visibleTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        panelIdPrefix="students-tab"
      >
        <AnimatePresence mode="wait">
          {activeTab === "work" ? (
            <StudentsWorkTier {...tabPanelProps.workTierProps} />
          ) : activeTab === "reports" ? (
            <Suspense fallback={<RouteStatusFallback />}>
              <StudentsReportsTier />
            </Suspense>
          ) : activeTab === "setup" ? (
            <Suspense fallback={<RouteStatusFallback />}>
              <StudentsSetupTier />
            </Suspense>
          ) : null}
        </AnimatePresence>
      </ResponsiveAccordionTabs>

      <StudentsPageOverlays {...pageOverlaysProps} />
    </ModulePageShell>
  );
}
