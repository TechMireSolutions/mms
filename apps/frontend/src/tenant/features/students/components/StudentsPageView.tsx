import { GraduationCap } from "lucide-react";
import { ModulePageShell } from "@/components/ui/ModulePageShell";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { StudentsCommandMetrics } from "@/tenant/features/students/components/StudentsCommandMetrics";
import { StudentsPageHeaderActions } from "@/tenant/features/students/components/StudentsPageHeaderActions";
import { StudentsPageOverlays } from "@/tenant/features/students/components/StudentsPageOverlays";
import { StudentsPageTabPanel } from "@/tenant/features/students/components/StudentsPageTabPanel";
import { useTranslation } from "@/hooks/useTranslation";
import type { useStudentsPageView } from "@/tenant/features/students/hooks/useStudentsPageView";

type StudentsPageViewProps = ReturnType<typeof useStudentsPageView>;

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
      headerSubtitle={
        metricsTotal != null
          ? `${t("page.students.subtitle")} · ${metricsTotal} ${t("nav.students").toLowerCase()}`
          : t("page.students.subtitle")
      }
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
        <StudentsPageTabPanel {...tabPanelProps} />
      </ResponsiveAccordionTabs>

      <StudentsPageOverlays {...pageOverlaysProps} />
    </ModulePageShell>
  );
}
