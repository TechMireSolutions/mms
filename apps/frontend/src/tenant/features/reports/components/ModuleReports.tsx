import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart2, GitCompare, Wrench, LayoutDashboard, Sparkles, CreditCard 
} from "lucide-react";

import { useTranslation } from "@/hooks/useTranslation";
import { SubTabBar, type SubTab } from "@/components/ui/SubTabBar";
import ReportFilters from "@/tenant/features/reports/components/ReportFilters";
import ComparisonMode from "@/tenant/features/reports/components/ComparisonMode";
import CustomReportBuilder from "@/tenant/features/reports/components/CustomReportBuilder";
import PinnedWidgets from "@/tenant/features/reports/components/PinnedWidgets";
import DynamicChartVisualizer from "@/tenant/features/reports/components/DynamicChartVisualizer";
import DynamicCardBuilder from "@/tenant/features/reports/components/DynamicCardBuilder";
import { getObject, saveObject } from "@/lib/db";

import StudentReport from "@/tenant/features/reports/components/StudentReport";
import ContactReport from "@/tenant/features/reports/components/ContactReport";
import AttendanceReport from "@/tenant/features/reports/components/AttendanceReport";
import FinancialReport from "@/tenant/features/reports/components/FinancialReport";
import AcademicReport from "@/tenant/features/reports/components/AcademicReport";
import HasanatReport from "@/tenant/features/reports/components/HasanatReport";
import SessionReport from "@/tenant/features/reports/components/SessionReport";
import FacultyReport from "@/tenant/features/reports/components/FacultyReport";
import QuestionBankReport from "@/tenant/features/reports/components/QuestionBankReport";
import SavedReports from "@/tenant/features/reports/components/SavedReports";
import { VisualizerConfig } from "@/tenant/features/reports/components/reportMetadata";

interface ModuleReportsProps {
  category: "students" | "teachers" | "contacts" | "attendance" | "financial" | "academic" | "examinations" | "questionBank" | "hasanat" | "sessions" | "faculty" | "saved";
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
 * 
 * @param {ModuleReportsProps} props - Component props.
 * @returns {React.JSX.Element}
 */
export default function ModuleReports({ category }: ModuleReportsProps) {
  const { t } = useTranslation();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [activeTab, setActiveTab] = useState<"dashboard" | "compare" | "builder" | "widgets" | "visualizer" | "cardBuilder">("dashboard");
  const [visualizerEditConfig, setVisualizerEditConfig] = useState<VisualizerConfig | undefined>(undefined);

  const REPORT_TABS = useMemo<readonly SubTab<"dashboard" | "compare" | "builder" | "widgets" | "visualizer" | "cardBuilder">[]>(
    () => [
      { key: "dashboard", label: t("dashboard.title") || "Dashboard", icon: BarChart2 },
      { key: "compare", label: t("reports.moduleTools.compare") || "Compare", icon: GitCompare },
      { key: "builder", label: t("reports.moduleTools.reportBuilder") || "Report Builder", icon: Wrench },
      { key: "widgets", label: t("reports.moduleTools.widgetBuilder") || "Widget Builder", icon: LayoutDashboard },
      { key: "visualizer", label: t("reports.moduleTools.visualizerBuilder") || "Visualizer Builder", icon: Sparkles },
      { key: "cardBuilder", label: t("reports.moduleTools.cardBuilder") || "Card Builder", icon: CreditCard },
    ],
    [t]
  );

  const getInitialCollection = () => {
    switch (category) {
      case "students": return "students" as const;
      case "teachers": return "teachers" as const;
      case "sessions": return "sessions" as const;
      case "financial": return "finance_invoices" as const;
      case "attendance": return "attendance_records" as const;
      case "hasanat": return "hasanat_distributions" as const;
      case "contacts": return "contacts" as const;
      case "questionBank": return "questions" as const;
      default: return undefined;
    }
  };

  const handleEditVisual = (config: unknown) => {
    setVisualizerEditConfig(config as VisualizerConfig);
    setActiveTab("visualizer");
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      case "saved":      return <SavedReports category={category} />;
      default:           return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tools Row - 2026 Glassmorphism */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-card/40 backdrop-blur-xl border border-border/50 p-4 rounded-3xl shadow-sm print:hidden">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
             <h3 className="text-sm font-black text-foreground leading-none tracking-tight">{t("reports.moduleTools.title")}</h3>
             <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-[0.2em]">{t("reports.moduleTools.subtitle")}</p>
          </div>
        </div>

        <SubTabBar
          tabs={REPORT_TABS}
          value={activeTab}
          onChange={setActiveTab}
          panelIdPrefix="reports-tools"
          className="max-lg:w-full lg:w-auto"
        />
      </div>

      {/* Panel overlays */}
      <AnimatePresence mode="wait">
        {activeTab === "compare" && (
          <motion.div key="compare" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
             <div className="pb-4"><ComparisonMode category={category} onClose={() => setActiveTab("dashboard")} /></div>
          </motion.div>
        )}
        {activeTab === "builder" && (
          <motion.div key="builder" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
             <div className="pb-4"><CustomReportBuilder initialSource={category} onClose={() => setActiveTab("dashboard")} /></div>
          </motion.div>
        )}
        {activeTab === "widgets" && (
          <motion.div key="widgets" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
             <div className="pb-4"><PinnedWidgets category={category} /></div>
          </motion.div>
        )}
        {activeTab === "visualizer" && (
          <motion.div key="visualizer" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
             <div className="pb-4">
                <DynamicChartVisualizer 
                  initialConfig={visualizerEditConfig}
                  onSave={(updatedConfig) => {
                    try {
                      const customVisuals = getObject<Record<string, VisualizerConfig>>("report_custom_visuals", {});
                      customVisuals[updatedConfig.id] = updatedConfig;
                      saveObject("report_custom_visuals", customVisuals);
                    } catch (error) {
                      console.error("Failed to save custom visual configuration", error);
                    }
                    window.dispatchEvent(new Event("local-database-update"));
                    setActiveTab("dashboard");
                    setVisualizerEditConfig(undefined);
                  }}
                  onClose={() => {
                    setActiveTab("dashboard");
                    setVisualizerEditConfig(undefined);
                  }}
                />
              </div>
          </motion.div>
        )}
        {activeTab === "cardBuilder" && (
          <motion.div key="cardBuilder" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
             <div className="pb-4"><DynamicCardBuilder initialCollection={getInitialCollection()} /></div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="print:hidden">
        <ReportFilters category={category} filters={filters} onChange={setFilters} />
      </div>

      {/* Report Content - 2026 Glassmorphism */}
      <div className="bg-card/60 backdrop-blur-xl rounded-2xl border border-border/50 overflow-hidden shadow-xl ring-1 ring-black/[0.03]">
        {renderReport()}
      </div>
    </div>
  );
}
