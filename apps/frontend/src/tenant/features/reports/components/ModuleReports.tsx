import React, { useState, useMemo } from "react";
import { BarChart2, GitCompare, Wrench, LayoutDashboard, Sparkles, CreditCard, Bookmark } from "lucide-react";

import { useTranslation } from "@/hooks/useTranslation";
import { Card } from "@/components/ui/card";
import { FormSelect } from "@/components/ui/FormSelect";
import { SubTabBar, type SubTab } from "@/components/ui/SubTabBar";
import { scrollDocumentToTop } from "@/lib/routing/scrollDocumentToTop";
import ReportFilters from "@/tenant/features/reports/components/ReportFilters";
import { VisualizerConfig } from "@/tenant/features/reports/components/reportMetadata";
import {
  ModuleReportsToolPanels,
  getInitialReportCollection,
} from "@/tenant/features/reports/components/ModuleReportsToolPanels";

import StudentReport from "@/tenant/features/reports/components/StudentReport";
import ContactReport from "@/tenant/features/reports/components/ContactReport";
import AttendanceReport from "@/tenant/features/reports/components/AttendanceReport";
import FinancialReport from "@/tenant/features/reports/components/FinancialReport";
import AcademicReport from "@/tenant/features/reports/components/AcademicReport";
import HasanatReport from "@/tenant/features/reports/components/HasanatReport";
import SessionReport from "@/tenant/features/reports/components/SessionReport";
import FacultyReport from "@/tenant/features/reports/components/FacultyReport";
import QuestionBankReport from "@/tenant/features/reports/components/QuestionBankReport";

type ModuleReportCategory = "students" | "teachers" | "contacts" | "attendance" | "financial" | "academic" | "examinations" | "questionBank" | "hasanat" | "sessions" | "faculty" | "saved";

type ReportsToolsTab = "dashboard" | "compare" | "builder" | "widgets" | "visualizer" | "cardBuilder" | "saved";

interface ModuleReportsProps {
  category: ModuleReportCategory;
}

const DEFAULT_FILTERS = {
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

  const REPORT_TABS = useMemo<readonly SubTab<ReportsToolsTab>[]>(
    () => [
      { key: "dashboard", label: t("dashboard.title"), icon: BarChart2 },
      { key: "compare", label: t("reports.moduleTools.compare"), icon: GitCompare },
      { key: "builder", label: t("reports.moduleTools.reportBuilder"), icon: Wrench },
      { key: "widgets", label: t("reports.moduleTools.widgetBuilder"), icon: LayoutDashboard },
      { key: "visualizer", label: t("reports.moduleTools.visualizerBuilder"), icon: Sparkles },
      { key: "cardBuilder", label: t("reports.moduleTools.cardBuilder"), icon: CreditCard },
      { key: "saved", label: t("reports.saved.title"), icon: Bookmark },
    ],
    [t]
  );

  const toolSelectOptions = useMemo(
    () => REPORT_TABS.map((tab) => ({ value: tab.key, label: tab.label })),
    [REPORT_TABS],
  );

  const handleEditVisual = (config: unknown) => {
    setVisualizerEditConfig(config as VisualizerConfig);
    setActiveTab("visualizer");
    scrollDocumentToTop({ behavior: "smooth" });
  };

  const renderReport = () => {
    switch (category) {
      case "students":   return <StudentReport   filters={filters} onEditVisual={handleEditVisual} />;
      case "teachers":
      case "faculty":    return <FacultyReport onEditVisual={handleEditVisual} />;
      case "contacts":   return <ContactReport onEditVisual={handleEditVisual} />;
      case "attendance": return <AttendanceReport filters={filters} onEditVisual={handleEditVisual} />;
      case "financial":  return <FinancialReport  filters={filters} onEditVisual={handleEditVisual} />;
      case "academic":
      case "examinations":
        return <AcademicReport filters={filters} onEditVisual={handleEditVisual} />;
      case "questionBank":
        return <QuestionBankReport />;
      case "hasanat":    return <HasanatReport     filters={filters} onEditVisual={handleEditVisual} />;
      case "sessions":   return <SessionReport     filters={filters} onEditVisual={handleEditVisual} />;
      case "saved":      return null;
      default:           return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap bg-card/40 backdrop-blur-xl border border-border/50 p-4 rounded-3xl shadow-sm print:hidden">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
             <h3 className="text-sm font-black text-foreground leading-none tracking-tight">{t("reports.moduleTools.title")}</h3>
             <p className="text-xs text-muted-foreground mt-1 uppercase font-bold tracking-[0.2em]">{t("reports.moduleTools.subtitle")}</p>
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
          setFilters(appliedFilters as typeof DEFAULT_FILTERS);
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
        {category !== "contacts" ? (
          <ReportFilters category={category} filters={filters} onChange={setFilters} />
        ) : null}
      </div>

      <Card className="overflow-hidden shadow-xl ring-1 ring-border/40">
        {renderReport()}
      </Card>
    </div>
  );
}
