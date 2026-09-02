import React, { useState } from "react";
import { BarChart2, GitCompare, Wrench, Sparkles, CreditCard, Bookmark } from "lucide-react";

import { useTranslation } from "@/hooks/useTranslation";
import { FormSelect } from "@/components/ui/FormSelect";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import { type SubTab, SubTabBar } from '@/components/ui/SubTabBar';
import { scrollDocumentToTop } from "@/lib/routing/scrollDocumentToTop";
import ReportFilters, { type ReportFilterFields } from "@/components/ui/reports/ReportFilters";
import { type VisualizerConfig } from "@/lib/reports/reportMetadata";
import {
  ModuleReportsToolPanels,
  getInitialReportCollection,
  type ModuleReportCategory,
} from "@/components/ui/reports/ModuleReportsToolPanels";

import StudentReport from "@/components/ui/reports/StudentReport";
import ContactReport from "@/components/ui/reports/ContactReport";
import AttendanceReport from "@/components/ui/reports/AttendanceReport";
import FinancialReport from "@/components/ui/reports/FinancialReport";
import AcademicReport from "@/components/ui/reports/AcademicReport";
import HasanatReport from "@/components/ui/reports/HasanatReport";
import SessionReport from "@/components/ui/reports/SessionReport";
import FacultyReport from "@/components/ui/reports/FacultyReport";
import QuestionBankReport from "@/components/ui/reports/QuestionBankReport";
import { EnrollmentReports } from "@/tenant/features/enrollments/components/EnrollmentReports";
import { useEnrollmentsReportAggregates } from "@/tenant/hooks/collections/enrollments";
import {
  EMPTY_ENROLLMENTS_REPORT_AGGREGATES,
  type EnrollmentsReportAggregates,
} from "@mms/shared";
import { ErrorState } from "@/components/ui/ErrorState";
import { FinancialReports } from "@/tenant/features/accounting/components/FinancialReports";
import { ObligationsSummary } from "@/tenant/features/obligations/components/ObligationsSummary";
import MessagingReport from "@/components/ui/reports/MessagingReport";
import UsersReport from "@/components/ui/reports/UsersReport";

function EnrollmentReportsWrapper({ filters }: { filters: typeof DEFAULT_FILTERS }): React.JSX.Element {
  const { t } = useTranslation();
  const query = useEnrollmentsReportAggregates();

  const rawAggregates =
    query.data?.status === 200
      ? (query.data.body as EnrollmentsReportAggregates)
      : EMPTY_ENROLLMENTS_REPORT_AGGREGATES;

  const aggregates = (() => {
    let bySession = rawAggregates.bySession;
    if (filters.session && filters.session !== "all") {
      bySession = bySession.filter(
        (s) => s.sessionId === filters.session || s.name.toLowerCase() === filters.session.toLowerCase(),
      );
    }
    return {
      ...rawAggregates,
      bySession,
    };
  })() as EnrollmentsReportAggregates;

  if (query.isError) {
    return (
      <ErrorState
        title={t("enrollments.loadFailed")}
        description={t("enrollments.loadFailedHint")}
        onRetry={() => void query.refetch()}
      />
    );
  }

  return <EnrollmentReports aggregates={aggregates} filters={filters} />;
}

type ReportsToolsTab = "dashboard" | "compare" | "builder" | "visualizer" | "cardBuilder" | "saved";

interface ModuleReportsProps {
  category: ModuleReportCategory;
}

const MODULES_WITH_INTERNAL_FILTERS = new Set<ModuleReportCategory>([
  "contacts",
  "accounting",
  "obligations",
  "messaging",
  "users",
]);

const DEFAULT_FILTERS: ReportFilterFields = {
  session: "all",
  class:   "all",
  status:  "all",
  dateFrom: "",
  dateTo:  "",
  student: "",
};

/**
 * Reusable reporting view for specific modules.
 */
export default function ModuleReports({ category }: ModuleReportsProps) {
  const { t } = useTranslation();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [activeTab, setActiveTab] = useState<ReportsToolsTab>("dashboard");
  const [visualizerEditConfig, setVisualizerEditConfig] = useState<VisualizerConfig | undefined>(undefined);

  const REPORT_TABS = (() => [
      { key: "dashboard", label: t("dashboard.title"), icon: BarChart2 },
      { key: "compare", label: t("reports.moduleTools.compare"), icon: GitCompare },
      { key: "builder", label: t("reports.moduleTools.reportBuilder"), icon: Wrench },
      { key: "visualizer", label: t("reports.moduleTools.visualizerBuilder"), icon: Sparkles },
      { key: "cardBuilder", label: t("reports.moduleTools.cardBuilder"), icon: CreditCard },
      { key: "saved", label: t("reports.saved.title"), icon: Bookmark },
    ])() as readonly SubTab<ReportsToolsTab>[];

  const toolSelectOptions = (() => REPORT_TABS.map((tab) => ({ value: tab.key, label: tab.label })))();

  const handleEditVisual = (config: unknown) => {
    setVisualizerEditConfig(config as VisualizerConfig);
    setActiveTab("visualizer");
    scrollDocumentToTop({ behavior: "smooth" });
  };

  const renderReport = () => {
    switch (category) {
      case "students":     return <StudentReport   filters={filters} onEditVisual={handleEditVisual} />;
      case "teachers":
      case "faculty":      return <FacultyReport filters={filters} onEditVisual={handleEditVisual} />;
      case "contacts":     return <ContactReport onEditVisual={handleEditVisual} />;
      case "attendance":   return <AttendanceReport filters={filters} onEditVisual={handleEditVisual} />;
      case "finance":
      case "financial":    return <FinancialReport  filters={filters} onEditVisual={handleEditVisual} />;
      case "accounting":   return <FinancialReports />;
      case "obligations":  return <ObligationsSummary />;
      case "enrollments":  return <EnrollmentReportsWrapper filters={filters} />;
      case "messaging":    return <MessagingReport />;
      case "users":        return <UsersReport />;
      case "examinations":
        return <AcademicReport filters={filters} onEditVisual={handleEditVisual} />;
      case "questionBank":
        return <QuestionBankReport filters={filters} onEditVisual={handleEditVisual} />;
      case "hasanat":      return <HasanatReport     filters={filters} onEditVisual={handleEditVisual} />;
      case "sessions":     return <SessionReport     filters={filters} onEditVisual={handleEditVisual} />;
      case "saved":        return null;
      default:             return null;
    }
  };

  return (
    <section aria-label={t("reports.aria.root")} className="space-y-6">
      <div className={`${WORK_SURFACE} flex items-center justify-between gap-4 flex-wrap p-4 rounded-3xl print:hidden`}>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
             <h3 className="text-sm font-black text-foreground leading-none tracking-tight">{t("reports.moduleTools.title")}</h3>
             <p className="text-xs text-muted-foreground mt-1 uppercase font-bold tracking-widest">{t("reports.moduleTools.subtitle")}</p>
          </div>
        </div>

        <div className="w-full min-w-0 lg:hidden">
          <FormSelect
            id="reports-tools-mobile"
            value={activeTab}
            onChange={(next) => setActiveTab(next as ReportsToolsTab)}
            options={toolSelectOptions}
            aria-label={t("reports.moduleTools.title")}
          />
        </div>

        <div className="hidden w-full lg:block lg:w-auto">
          <SubTabBar
            tabs={REPORT_TABS}
            value={activeTab}
            onChange={setActiveTab}
            panelIdPrefix="reports-tools"
            className="w-full lg:w-auto"
          />
        </div>
      </div>

      <ModuleReportsToolPanels
        category={category}
        activeTab={activeTab}
        filters={filters}
        visualizerEditConfig={visualizerEditConfig}
        onClosePanel={() => setActiveTab("dashboard")}
        onApplySavedFilters={(appliedFilters) => {
          setFilters((prev) => ({
            ...prev,
            ...(appliedFilters as Partial<ReportFilterFields>),
          }));
          setActiveTab("dashboard");
        }}
        onVisualizerSave={() => {
          setActiveTab("dashboard");
          setVisualizerEditConfig(undefined);
        }}
        onVisualizerClose={() => {
          setActiveTab("dashboard");
          setVisualizerEditConfig(undefined);
        }}
        getInitialCollection={() => getInitialReportCollection(category)}
      />

      <div className="print:hidden">
        {!MODULES_WITH_INTERNAL_FILTERS.has(category) ? (
          <ReportFilters category={category} filters={filters} onChange={setFilters} />
        ) : null}
      </div>

      <div className="w-full">
        {renderReport()}
      </div>
    </section>
  );
}
