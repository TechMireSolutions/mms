import { School } from "lucide-react";
import { ModulePageShell } from "@/components/ui/ModulePageShell";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { useTranslation } from "@/hooks/useTranslation";
import { TeachersCommandMetrics } from "@/tenant/features/teachers/components/TeachersCommandMetrics";
import { TeachersPageHeaderActions } from "@/tenant/features/teachers/components/TeachersPageHeaderActions";
import { TeachersPageOverlays } from "@/tenant/features/teachers/components/TeachersPageOverlays";
import { TeachersPageTabPanel } from "@/tenant/features/teachers/components/TeachersPageTabPanel";
import type { useTeachersPageView } from "@/tenant/features/teachers/hooks/useTeachersPageView";

type TeachersPageViewProps = ReturnType<typeof useTeachersPageView>;

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
      headerSubtitle={
        metricsTotal != null
          ? `${t('page.teachers.subtitle')} · ${metricsTotal} ${t('nav.teachers').toLowerCase()}`
          : t('page.teachers.subtitle')
      }
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
        <TeachersPageTabPanel {...tabPanelProps} />
      </ResponsiveAccordionTabs>

      <TeachersPageOverlays {...pageOverlaysProps} />
    </ModulePageShell>
  );
}
