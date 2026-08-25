import { School } from "lucide-react";
import { ModulePageShell } from "@/components/ui/ModulePageShell";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { useTranslation } from "@/hooks/useTranslation";
import { TeachersCommandMetrics } from "@/tenant/features/teachers/components/TeachersCommandMetrics";
import { TeachersPageHeaderActions } from "@/tenant/features/teachers/components/TeachersPageHeaderActions";
import { TeachersPageOverlays } from "@/tenant/features/teachers/components/TeachersPageOverlays";
import { AnimatePresence } from "framer-motion";
import { TeachersReportsTier } from "@/tenant/features/teachers/components/TeachersReportsTier";
import { TeachersSetupTier } from "@/tenant/features/teachers/components/TeachersSetupTier";
import { TeachersWorkTier } from "@/tenant/features/teachers/components/TeachersWorkTier";
import type { useTeachersPageController } from "@/tenant/features/teachers/hooks/useTeachersPageController";

type TeachersPageViewProps = ReturnType<typeof useTeachersPageController>;

/** Presentational Teachers page shell — Work / Reports / Setup + create form. */
export function TeachersPageView({
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
}: TeachersPageViewProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <ModulePageShell
      seoTitle={`MMS - ${t('nav.teachers')}`}
      seoDescription={t('page.teachers.subtitle')}
      headerIcon={School}
      headerTitle={t('nav.teachers')}
      headerSubtitle={t('page.teachers.subtitle')}
      headerActions={
        <TeachersPageHeaderActions
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
        <TeachersCommandMetrics total={metricsTotal ?? shownCount} shown={shownCount} />
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
            <TeachersWorkTier {...tabPanelProps.workTierProps} />
          ) : activeTab === "reports" ? (
            <TeachersReportsTier />
          ) : activeTab === "setup" ? (
            <TeachersSetupTier />
          ) : null}
        </AnimatePresence>
      </ResponsiveAccordionTabs>

      <TeachersPageOverlays {...pageOverlaysProps} />
    </ModulePageShell>
  );
}
