import React, { useState, useMemo, useEffect } from "react";
import { useConfigSubTabs } from "@/hooks/useConfigSubTabs";
import { useTranslation } from "@/hooks/useTranslation";
import { useModuleTierTabs } from "@/hooks/useModuleTierTabs";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, FileText, PenTool, Layers } from "lucide-react";
import { resolveModuleTierTab } from "@mms/shared";
import { PageHeader } from "../components/ui/PageHeader";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Modal } from "@/components/ui/Modal";
import ExamsList from "../components/examination/ExamsList";
import ExamForm from "../components/examination/ExamForm";
import { EnterMarks } from "../components/examination/EnterMarks";
import { ResultsView } from "../components/examination/ResultsView";
import { ExaminationsSettings } from "../components/examination/ExaminationsSettings";
import { ExaminationsCommandMetrics } from "../components/examination/ExaminationsCommandMetrics";
import ModuleReports from "../components/reports/ModuleReports";
import KPISummary from "../components/reports/KPISummary";
import { Exam, ExamResult } from '@/lib/data/examinationData';
import { useExaminationExamColumnLayout } from "@/hooks/useExaminationExamColumnLayout";
import { useExaminationResultsColumnLayout } from "@/hooks/useExaminationResultsColumnLayout";
import { useExaminationConfig } from "@/hooks/useExaminationConfig";
import {
  useExaminationsExamsCollection,
  useExaminationsResultsCollection,
  useExaminationsMutations,
} from "@/hooks/useExaminationsApi";

/**
 * Examinations — formal exams, marking, and results. Work | Reports | Setup.
 */
export default function Examinations(): React.JSX.Element {
  const PAGE_TABS = useModuleTierTabs();
  const configSubTabs = useConfigSubTabs();
  const { t } = useTranslation();
  const OPS_SUB_TABS = useMemo(
    () => [
      { id: "exams", label: t("examinations.exams"), icon: BookOpen },
      { id: "results", label: t("examinations.results"), icon: FileText },
    ],
    [t],
  );
  const [activeTab, setActiveTab] = useState("work");
  const [activeSubTab, setActiveSubTab] = useState("exams");
  const [configSubTab, setConfigSubTab] = useState<"fields" | "preferences">("fields");

  const exams = useExaminationsExamsCollection();
  const examResults = useExaminationsResultsCollection();
  const { replaceExams, replaceExamResults } = useExaminationsMutations();
  const { settings } = useExaminationConfig();
  const examColumnLayout = useExaminationExamColumnLayout();
  const resultsColumnLayout = useExaminationResultsColumnLayout();
  const listLayout = (settings.defaultViewLayout || "cards") === "list";

  const [showExamForm, setShowExamForm] = useState(false);
  const [showMarksModal, setShowMarksModal] = useState(false);
  const [editExam, setEditExam] = useState<Exam | null>(null);
  const [filteredCount, setFilteredCount] = useState(0);

  const handleSaveExam = (exam: Exam): void => {
    const exists = exams.find((e) => e.id === exam.id);
    replaceExams.mutate(
      exists ? exams.map((e) => (e.id === exam.id ? exam : e)) : [...exams, exam],
    );
    setShowExamForm(false);
    setEditExam(null);
  };

  const handleSaveResults = (examId: string, newResults: ExamResult[]): void => {
    replaceExamResults.mutate([
      ...examResults.filter((r) => r.examId !== examId),
      ...newResults,
    ]);
  };

  const effectiveTab = resolveModuleTierTab(
    activeTab,
    PAGE_TABS.map((tab) => tab.id),
  );
  const effectiveSubTab = OPS_SUB_TABS.find((tab) => tab.id === activeSubTab) ? activeSubTab : "exams";

  useEffect(() => {
    if (effectiveSubTab === "exams" || effectiveSubTab === "results") return;
    setFilteredCount(exams.length);
  }, [effectiveSubTab, exams.length]);

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <title>MMS - {t("nav.examinations")}</title>
      <meta name="description" content={t("page.examinations.subtitle")} />
      <PageHeader
        icon={Layers}
        title={t("nav.examinations")}
        subtitle={t("page.examinations.subtitle")}
        actions={
          <button
            type="button"
            onClick={() => setShowMarksModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <PenTool className="h-3.5 w-3.5" />
            {t("examinations.marks")}
          </button>
        }
      />

      <ExaminationsCommandMetrics total={exams.length} shown={filteredCount} />

      <ResponsiveAccordionTabs
        tabs={PAGE_TABS}
        activeTab={effectiveTab}
        onTabChange={setActiveTab}
        panelIdPrefix="examinations-tab"
      >
        {effectiveTab === "work" && (
          <SubTabBar
            tabs={OPS_SUB_TABS.map((tab) => ({ key: tab.id, label: tab.label }))}
            value={effectiveSubTab}
            onChange={setActiveSubTab}
          />
        )}

        <ErrorBoundary>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${effectiveTab}-${effectiveSubTab}-${configSubTab}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {effectiveTab === "setup" && (
                <div className="space-y-4">
                  <SubTabBar
                    tabs={configSubTabs.map((tab) => ({ key: tab.id, label: tab.label }))}
                    value={configSubTab}
                    onChange={(key) => setConfigSubTab(key as typeof configSubTab)}
                  />
                  <ExaminationsSettings mode={configSubTab} />
                </div>
              )}

              {effectiveTab === "reports" && (
                <div className="space-y-4">
                  <KPISummary category="examinations" />
                  <ModuleReports category="examinations" />
                </div>
              )}

              {effectiveTab === "work" && effectiveSubTab === "exams" && (
                <ExamsList
                  exams={exams}
                  listLayout={listLayout}
                  onNew={() => {
                    setEditExam(null);
                    setShowExamForm(true);
                  }}
                  onEdit={(e: Exam) => {
                    setEditExam(e);
                    setShowExamForm(true);
                  }}
                  onFilteredCountChange={setFilteredCount}
                  isColumnVisible={examColumnLayout.isColumnVisible}
                  columnCustomizer={{
                    columnRegistry: examColumnLayout.columnRegistry,
                    updateUserColumnLayout: examColumnLayout.updateUserColumnLayout,
                    labels: examColumnLayout.customizerLabels,
                  }}
                />
              )}
              {effectiveTab === "work" && effectiveSubTab === "results" && (
                <ResultsView
                  exams={exams}
                  results={examResults}
                  onFilteredCountChange={setFilteredCount}
                  isColumnVisible={resultsColumnLayout.isColumnVisible}
                  columnCustomizer={{
                    columnRegistry: resultsColumnLayout.columnRegistry,
                    updateUserColumnLayout: resultsColumnLayout.updateUserColumnLayout,
                    labels: resultsColumnLayout.customizerLabels,
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </ErrorBoundary>
      </ResponsiveAccordionTabs>

      <AnimatePresence>
        <ExamForm
          open={showExamForm}
          exam={editExam}
          onClose={() => {
            setShowExamForm(false);
            setEditExam(null);
          }}
          onSave={handleSaveExam}
        />
      </AnimatePresence>

      <Modal
        open={showMarksModal}
        onClose={() => setShowMarksModal(false)}
        title={t("examinations.marks")}
        size="xl"
        panelClassName="h-[88vh] max-h-[700px]"
      >
        <EnterMarks exams={exams} results={examResults} onSaveResults={handleSaveResults} />
      </Modal>
    </div>
  );
}
