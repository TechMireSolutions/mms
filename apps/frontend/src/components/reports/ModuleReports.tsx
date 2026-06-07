import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart2, GitCompare, Wrench, LayoutDashboard, Sparkles, CreditCard 
} from "lucide-react";

import ReportFilters from "./ReportFilters";
import ComparisonMode from "./ComparisonMode";
import CustomReportBuilder from "./CustomReportBuilder";
import PinnedWidgets from "./PinnedWidgets";
import DynamicChartVisualizer from "./DynamicChartVisualizer";
import DynamicCardBuilder from "./DynamicCardBuilder";

import StudentReport from "./StudentReport";
import ContactReport from "./ContactReport";
import AttendanceReport from "./AttendanceReport";
import FinancialReport from "./FinancialReport";
import AcademicReport from "./AcademicReport";
import HasanatReport from "./HasanatReport";
import SessionReport from "./SessionReport";
import FacultyReport from "./FacultyReport";
import QuestionBankReport from "./QuestionBankReport";
import SavedReports from "./SavedReports";
import { getReportVisual, VisualizerConfig } from "./reportMetadata";

interface ModuleReportsProps {
  category: "students" | "contacts" | "attendance" | "financial" | "academic" | "examinations" | "questionBank" | "hasanat" | "sessions" | "faculty" | "saved";
  role?: string;
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
export default function ModuleReports({ category, role = "admin" }: ModuleReportsProps) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [showComparison, setShowComparison] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showWidgets, setShowWidgets] = useState(false);
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [showCardBuilder, setShowCardBuilder] = useState(false);
  const [visualizerEditConfig, setVisualizerEditConfig] = useState<VisualizerConfig | undefined>(undefined);

  const getInitialCollection = () => {
    switch (category) {
      case "students": return "students" as const;
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
    setShowVisualizer(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderReport = () => {
    switch (category) {
      case "students":   return <StudentReport   filters={filters} onEditVisual={handleEditVisual} />;
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
      case "faculty":    return <FacultyReport onEditVisual={handleEditVisual} />;
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
             <h3 className="text-sm font-black text-foreground leading-none tracking-tight">Module Intelligence</h3>
             <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-[0.2em]">2026 Analytical Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowComparison((o) => !o); setShowBuilder(false); setShowWidgets(false); setShowVisualizer(false); setShowCardBuilder(false); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-[11px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${showComparison ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "border-border bg-card/50 backdrop-blur-md text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"}`}
            type="button"
          >
            <GitCompare className="w-3.5 h-3.5" />
            Compare
          </button>
          <button
            onClick={() => { setShowBuilder((o) => !o); setShowComparison(false); setShowWidgets(false); setShowVisualizer(false); setShowCardBuilder(false); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-[11px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${showBuilder ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "border-border bg-card/50 backdrop-blur-md text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"}`}
            type="button"
          >
            <Wrench className="w-3.5 h-3.5" />
            Report Builder
          </button>
          <button
            onClick={() => { setShowWidgets((o) => !o); setShowComparison(false); setShowBuilder(false); setShowVisualizer(false); setShowCardBuilder(false); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-[11px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${showWidgets ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "border-border bg-card/50 backdrop-blur-md text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"}`}
            type="button"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Widget Builder
          </button>
          <button
            onClick={() => { 
              setShowVisualizer((o) => !o); 
              if (showVisualizer) setVisualizerEditConfig(undefined);
              setShowComparison(false); 
              setShowBuilder(false); 
              setShowWidgets(false); 
              setShowCardBuilder(false); 
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-[11px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${showVisualizer ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "border-border bg-card/50 backdrop-blur-md text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"}`}
            type="button"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Visualizer Builder
          </button>
          <button
            onClick={() => { setShowCardBuilder((o) => !o); setShowComparison(false); setShowBuilder(false); setShowWidgets(false); setShowVisualizer(false); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-[11px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${showCardBuilder ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "border-border bg-card/50 backdrop-blur-md text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"}`}
            type="button"
          >
            <CreditCard className="w-3.5 h-3.5" />
            Card Builder
          </button>
        </div>
      </div>

      {/* Panel overlays */}
      <AnimatePresence>
        {showComparison && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
             <div className="pb-4"><ComparisonMode category={category} onClose={() => setShowComparison(false)} /></div>
          </motion.div>
        )}
        {showBuilder && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
             <div className="pb-4"><CustomReportBuilder initialSource={category} onClose={() => setShowBuilder(false)} /></div>
          </motion.div>
        )}
        {showWidgets && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
             <div className="pb-4"><PinnedWidgets category={category} /></div>
          </motion.div>
        )}
        {showVisualizer && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
             <div className="pb-4">
               <DynamicChartVisualizer 
                 initialConfig={visualizerEditConfig}
                 onSave={(updatedConfig) => {
                   try {
                     const saved = localStorage.getItem("report_custom_visuals");
                     const customVisuals = saved ? JSON.parse(saved) : {};
                     customVisuals[updatedConfig.id] = updatedConfig;
                     localStorage.setItem("report_custom_visuals", JSON.stringify(customVisuals));
                   } catch (e) {
                     console.error("Failed to save custom visual configuration", e);
                   }
                   window.dispatchEvent(new Event("local-database-update"));
                   setShowVisualizer(false);
                   setVisualizerEditConfig(undefined);
                 }}
                 onClose={() => {
                   setShowVisualizer(false);
                   setVisualizerEditConfig(undefined);
                 }}
               />
             </div>
          </motion.div>
        )}
        {showCardBuilder && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
             <div className="pb-4"><DynamicCardBuilder initialCollection={getInitialCollection()} /></div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="print:hidden">
        <ReportFilters category={category} filters={filters} onChange={setFilters} />
      </div>

      {/* Report Content - 2026 Glassmorphism */}
      <div className="bg-card/60 backdrop-blur-xl rounded-[2rem] border border-border/50 overflow-hidden shadow-xl ring-1 ring-black/[0.03]">
        {renderReport()}
      </div>
    </div>
  );
}
