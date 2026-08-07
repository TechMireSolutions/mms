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
  serverCount,
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
      seoTitle={`MMS - ${t("nav.students")}`}
      seoDescription={t("page.students.subtitle")}
      headerIcon={GraduationCap}
      headerTitle={t("nav.students")}
      headerSubtitle={
        serverCount != null
          ? `${t("page.students.subtitle")} · ${serverCount} ${t("nav.students").toLowerCase()}`
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
        <StudentsCommandMetrics total={serverCount ?? shownCount} shown={shownCount} />
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
