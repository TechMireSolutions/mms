import React, { useState, useMemo, useEffect, useCallback } from "react";
import { usePersistedTabState } from "@/hooks/usePersistedTabState";
import { useTranslation } from "@/hooks/useTranslation";
import { useFilteredModuleTierTabs } from "@/tenant/hooks/useModuleTierTabs";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, FileText, PenTool, Layers, Archive } from "lucide-react";
import { EXAMINATIONS_MODULE_MANIFEST, resolveModuleTierTab, type AppTranslationKey } from "@mms/shared";
import { ModulePageShell } from "@/components/ui/ModulePageShell";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ErrorState } from "@/components/ui/ErrorState";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { Button } from "@/components/ui/button";
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
  useExaminationsExams,
  useExaminationsResults,
  useExaminationsMutations,
  NotifiedExaminationsMutationError,
} from "@/tenant/features/examinations/hooks/useExaminationsApi";
import { notify } from "@/lib/notify";

const SETUP_TAB_LABEL_KEYS: Record<(typeof EXAMINATIONS_MODULE_MANIFEST.setupSubTabs)[number], AppTranslationKey> = {
  fields: "examinations.setup.fields",
  preferences: "examinations.setup.preferences",
};

/**
 * Examinations — formal exams, marking, and results. Work | Reports | Setup.
 */
export default function Examinations(): React.JSX.Element {
  const { t } = useTranslation();
  const {
    canWrite,
    canDelete,
    canReports: canViewReports,
    canViewSetup,
    canEditSetup,
  } = useModulePermissions(EXAMINATIONS_MODULE_MANIFEST);
  const PAGE_TABS = useFilteredModuleTierTabs({ canViewSetup, canViewReports });
  const SETUP_TABS = useMemo(
    () => EXAMINATIONS_MODULE_MANIFEST.setupSubTabs.map((id) => ({
      id,
      label: t(SETUP_TAB_LABEL_KEYS[id]),
    })),
    [t],
  );
  const OPS_SUB_TABS = useMemo(
    () => [
      { id: "exams", label: t("examinations.exams"), icon: BookOpen },
      { id: "results", label: t("examinations.results"), icon: FileText },
    ],
    [t],
  );
  const [activeTab, setActiveTab] = usePersistedTabState<string>("examinations_active_tab", "work");
  const [activeSubTab, setActiveSubTab] = useState("exams");
  const [configSubTab, setConfigSubTab] = useState<string>("preferences");
  const [showDeleted, setShowDeleted] = useState(false);
  const [createExamKey, setCreateExamKey] = useState(0);

  const examsResult = useExaminationsExams({ includeDeleted: showDeleted });
  const resultsResult = useExaminationsResults();
  const exams = examsResult.syncedData;
  const examResults = resultsResult.syncedData;
  const {
    replaceExams,
    replaceExamResults,
    deleteExam,
    restoreExam,
    bulkDeleteExams,
    bulkRestoreExams,
  } = useExaminationsMutations();
  const { settings } = useExaminationConfig();
  const examColumnLayout = useExaminationExamColumnLayout();
  const resultsColumnLayout = useExaminationResultsColumnLayout();
  const listLayout = (settings.defaultViewLayout || "cards") === "list";

  const [showExamForm, setShowExamForm] = useState(false);
  const [showMarksModal, setShowMarksModal] = useState(false);
  const [editExam, setEditExam] = useState<Exam | null>(null);
  const [filteredCount, setFilteredCount] = useState(0);

  const notifySaveFailure = useCallback((error: unknown) => {
    if (error instanceof NotifiedExaminationsMutationError) return;
    notify.error(t("examinations.saveFailed"), {
      description: error instanceof Error ? error.message : String(error),
    });
  }, [t]);

  const handleSaveExam = async (exam: Exam): Promise<void> => {
    const existingExam = exams.find((candidate) => candidate.id === exam.id);
    try {
      await replaceExams.mutateAsync(
        existingExam ? exams.map((candidate) => (candidate.id === exam.id ? exam : candidate)) : [...exams, exam],
      );
      setShowExamForm(false);
      setEditExam(null);
    } catch (error: unknown) {
      notifySaveFailure(error);
      throw error;
    }
  };

  const handleSaveResults = async (examId: string, newResults: ExamResult[]): Promise<void> => {
    try {
      await replaceExamResults.mutateAsync([
        ...examResults.filter((result) => result.examId !== examId),
        ...newResults,
      ]);
    } catch (error: unknown) {
      notifySaveFailure(error);
      throw error;
    }
  };

  const handleDeleteExam = async (id: string) => {
    try {
      await deleteExam.mutateAsync(id);
      notify.success(t("examinations.trash.deleted"));
    } catch (error: unknown) {
      notify.error(t("examinations.trash.actionFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  };

  const handleRestoreExam = async (id: string) => {
    try {
      await restoreExam.mutateAsync(id);
      notify.success(t("examinations.trash.restored"));
    } catch (error: unknown) {
      notify.error(t("examinations.trash.actionFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      const result = await bulkDeleteExams.mutateAsync(ids);
      if (result.failed > 0) {
        notify.warning(t("examinations.trash.bulkPartial", {
          succeeded: result.succeeded,
          failed: result.failed,
        }));
      } else {
        notify.success(t("examinations.trash.deleted"));
      }
    } catch (error: unknown) {
      notify.error(t("examinations.trash.actionFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  };

  const handleBulkRestore = async (ids: string[]) => {
    try {
      const result = await bulkRestoreExams.mutateAsync(ids);
      if (result.failed > 0) {
        notify.warning(t("examinations.trash.bulkPartial", {
          succeeded: result.succeeded,
          failed: result.failed,
        }));
      } else {
        notify.success(t("examinations.trash.restored"));
      }
    } catch (error: unknown) {
      notify.error(t("examinations.trash.actionFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  };

  const effectiveTab = resolveModuleTierTab(
    activeTab,
    PAGE_TABS.map((tab) => tab.id),
  );
  const effectiveSubTab = OPS_SUB_TABS.find((tab) => tab.id === activeSubTab) ? activeSubTab : "exams";
  const effectiveConfigTab = SETUP_TABS.find((tab) => tab.id === configSubTab)?.id ?? "preferences";

  useEffect(() => {
    if (effectiveSubTab === "exams" || effectiveSubTab === "results") return;
    setFilteredCount(exams.length);
  }, [effectiveSubTab, exams.length]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "n" && canWrite && !showDeleted) {
        const target = event.target as HTMLElement | null;
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
          return;
        }
        event.preventDefault();
        setActiveTab("work");
        setActiveSubTab("exams");
        setCreateExamKey((key) => key + 1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canWrite, setActiveTab, showDeleted]);

  const listLoadFailed = examsResult.queryResult.isError;

  return (
    <ModulePageShell
      seoTitle={`MMS - ${t("nav.examinations")}`}
      seoDescription={t("page.examinations.subtitle")}
      headerIcon={Layers}
      headerTitle={t("nav.examinations")}
      headerSubtitle={t("page.examinations.subtitle")}
      headerActions={
        <div className="flex items-center gap-2">
          {effectiveTab === "work" && effectiveSubTab === "exams" && canDelete ? (
            <Button
              type="button"
              variant={showDeleted ? "default" : "outline"}
              size="sm"
              onClick={() => setShowDeleted((prev) => !prev)}
              className="gap-1.5"
            >
              <Archive className="w-3.5 h-3.5" aria-hidden="true" />
              {showDeleted ? t("examinations.trash.showActive") : t("examinations.trash.showDeleted")}
            </Button>
          ) : null}
          {canWrite && !showDeleted ? (
            <ActionButton
              variant="ghost"
              icon={PenTool}
              onClick={() => setShowMarksModal(true)}
            >
              {t("examinations.marks")}
            </ActionButton>
          ) : null}
        </div>
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
            onChange={(next) => {
              setActiveSubTab(next);
              if (next !== "exams") setShowDeleted(false);
            }}
          />
        )}

        <ErrorBoundary>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${effectiveTab}-${effectiveSubTab}-${String(showDeleted)}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {effectiveTab === "setup" && (
                <div className="space-y-4">
                  <SubTabBar
                    tabs={SETUP_TABS.map((tab) => ({ key: tab.id, label: tab.label }))}
                    value={effectiveConfigTab}
                    onChange={setConfigSubTab}
                  />
                  {!canEditSetup ? (
                    <p className="text-sm text-muted-foreground rounded-xl border border-border bg-muted/20 px-4 py-6">
                      {t("examinations.setup.readOnly")}
                    </p>
                  ) : (
                    <ExaminationsSettings mode={effectiveConfigTab} />
                  )}
                </div>
              )}

              {effectiveTab === "reports" && (
                <div className="space-y-4">
                  <KPISummary category="examinations" />
                  <ModuleReports category="examinations" />
                </div>
              )}

              {effectiveTab === "work" && listLoadFailed && (
                <ErrorState
                  title={t("examinations.loadFailed")}
                  onRetry={() => { void examsResult.queryResult.refetch(); }}
                />
              )}

              {effectiveTab === "work" && !listLoadFailed && effectiveSubTab === "exams" && (
                <ExamsList
                  exams={exams}
                  listLayout={listLayout}
                  canWrite={canWrite}
                  canDelete={canDelete}
                  showDeleted={showDeleted}
                  createRequestKey={createExamKey}
                  onDelete={handleDeleteExam}
                  onRestore={handleRestoreExam}
                  onBulkDelete={handleBulkDelete}
                  onBulkRestore={handleBulkRestore}
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
                  getColumnWidth={examColumnLayout.getColumnWidth}
                  onColumnResize={examColumnLayout.setColumnWidth}
                  columnCustomizer={{
                    columnRegistry: examColumnLayout.columnRegistry,
                    updateUserColumnLayout: examColumnLayout.updateUserColumnLayout,
                    labels: examColumnLayout.customizerLabels,
                  }}
                />
              )}
              {effectiveTab === "work" && !listLoadFailed && effectiveSubTab === "results" && (
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
        {showExamForm && canWrite && !showDeleted && (
          <ExamForm
            open={showExamForm}
            exam={editExam}
            onClose={() => {
              setShowExamForm(false);
              setEditExam(null);
            }}
            onSave={handleSaveExam}
          />
        )}
      </AnimatePresence>

      {canWrite && !showDeleted && (
        <Modal
          open={showMarksModal}
          onClose={() => setShowMarksModal(false)}
          title={t("examinations.marks")}
          size="xl"
          panelClassName="h-[88vh] max-h-[700px]"
        >
          <EnterMarks exams={exams} results={examResults} onSaveResults={handleSaveResults} />
        </Modal>
      )}
    </ModulePageShell>
  );
}
