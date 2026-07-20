import React, { useState, useMemo, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useModuleTierTabs } from "@/tenant/hooks/useModuleTierTabs";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, FileText, PenTool, Layers } from "lucide-react";
import { resolveModuleTierTab } from "@mms/shared";
import { ModulePageShell } from "@/components/ui/ModulePageShell";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import ExamsList from "@/tenant/features/examinations/components/ExamsList";
import ExamForm from "@/tenant/features/examinations/components/ExamForm";
import { EnterMarks } from "@/tenant/features/examinations/components/EnterMarks";
import { ResultsView } from "@/tenant/features/examinations/components/ResultsView";
import { ExaminationsSettings } from "@/tenant/features/examinations/components/ExaminationsSettings";
import { ExaminationsCommandMetrics } from "@/tenant/features/examinations/components/ExaminationsCommandMetrics";
import ModuleReports from "@/tenant/features/reports/components/ModuleReports";
import KPISummary from "@/tenant/features/reports/components/KPISummary";
import { Exam, ExamResult } from '@/lib/data/examinationData';
import { useExaminationExamColumnLayout } from "@/tenant/features/examinations/hooks/useExaminationExamColumnLayout";
import { useExaminationResultsColumnLayout } from "@/tenant/features/examinations/hooks/useExaminationResultsColumnLayout";
import { useExaminationConfig } from "@/hooks/useStandardModuleConfig";
import {
  useExaminationsExamsCollection,
  useExaminationsResultsCollection,
  useExaminationsMutations,
} from "@/tenant/features/examinations/hooks/useExaminationsApi";

/**
 * Examinations — formal exams, marking, and results. Work | Reports | Setup.
 */
export default function Examinations(): React.JSX.Element {
  const PAGE_TABS = useModuleTierTabs();
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
    const existingExam = exams.find((candidate) => candidate.id === exam.id);
    replaceExams.mutate(
      existingExam ? exams.map((candidate) => (candidate.id === exam.id ? exam : candidate)) : [...exams, exam],
    );
    setShowExamForm(false);
    setEditExam(null);
  };

  const handleSaveResults = (examId: string, newResults: ExamResult[]): void => {
    replaceExamResults.mutate([
      ...examResults.filter((result) => result.examId !== examId),
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
    <ModulePageShell
      seoTitle={`MMS - ${t("nav.examinations")}`}
      seoDescription={t("page.examinations.subtitle")}
      headerIcon={Layers}
      headerTitle={t("nav.examinations")}
      headerSubtitle={t("page.examinations.subtitle")}
      headerActions={
        <ActionButton
          variant="ghost"
          icon={PenTool}
          onClick={() => setShowMarksModal(true)}
        >
          {t("examinations.marks")}
        </ActionButton>
      }
      metricsStrip={
        <ExaminationsCommandMetrics total={exams.length} shown={filteredCount} />
      }
    >
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
              key={`${effectiveTab}-${effectiveSubTab}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {effectiveTab === "setup" && (
                <ExaminationsSettings mode="preferences" />
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
                  onEdit={(exam: Exam) => {
                    setEditExam(exam);
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
    </ModulePageShell>
  );
}
