import React, { Suspense, lazy } from "react";
import { GraduationCap, UserPlus } from "lucide-react";
import { ModulePageShell } from "@/components/ui/ModulePageShell";
import { ModuleEntityIoToolbar } from "@/components/ui/ModuleEntityIoToolbar";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { StudentsCommandMetrics } from "@/tenant/features/students/components/StudentsCommandMetrics";
import { StudentsPageHeaderActions } from "@/tenant/features/students/components/StudentsPageHeaderActions";
import { StudentsPageOverlays } from "@/tenant/features/students/components/StudentsPageOverlays";
import { AnimatePresence } from "framer-motion";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
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
  metricsSnapshot,
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
        <StudentsCommandMetrics
          total={metricsTotal ?? shownCount}
          shown={shownCount}
          serverMetrics={metricsSnapshot}
        />
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
            <div className="space-y-5">
          {/* NOTE: Export is intentionally reachable from two entry points:
              1. StudentsPageHeaderActions (persistent top-right — always visible regardless of active tab)
              2. ModuleEntityIoToolbar below (tab-level, visible only within the Work tab for contextual proximity)
              Both call the same handleExportCSV action. This is a deliberate UX pattern, not a duplication bug. */}
              <ModuleEntityIoToolbar
                canExport={canExport}
                canWrite={canWrite}
                viewingDeleted={viewingDeleted}
                onExport={() => {
                  void handleExportCSV();
                }}
                onAdd={openCreateForm}
                addLabel={t("action.addStudent")}
                addIcon={UserPlus}
              />
              <StudentsWorkTier {...tabPanelProps.workTierProps} />
            </div>
          ) : activeTab === "reports" ? (
            <ErrorBoundary>
              <Suspense fallback={<RouteStatusFallback />}>
                <StudentsReportsTier />
              </Suspense>
            </ErrorBoundary>
          ) : activeTab === "setup" ? (
            <ErrorBoundary>
              <Suspense fallback={<RouteStatusFallback />}>
                <StudentsSetupTier />
              </Suspense>
            </ErrorBoundary>
          ) : null}
        </AnimatePresence>
      </ResponsiveAccordionTabs>

      <StudentsPageOverlays {...pageOverlaysProps} />
    </ModulePageShell>
  );
}
