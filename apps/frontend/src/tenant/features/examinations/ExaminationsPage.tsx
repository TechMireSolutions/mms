import React, { useState, useMemo, useEffect, useCallback } from "react";
import { usePersistedTabState } from "@/hooks/usePersistedTabState";
import { useModuleCreateHotkey } from "@/hooks/useModuleCreateHotkey";
import { useTranslation } from "@/hooks/useTranslation";
import { useFilteredModuleTierTabs } from "@/tenant/hooks/useModuleTierTabs";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, FileText, Layers } from "lucide-react";
import { EXAMINATIONS_MODULE_MANIFEST, resolveModuleTierTab, type AppTranslationKey } from "@mms/shared";
import { ModulePageShell } from "@/components/ui/ModulePageShell";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { ExaminationsCommandMetrics } from "@/tenant/features/examinations/components/ExaminationsCommandMetrics";
import { ExaminationsModalLayer } from "@/tenant/features/examinations/components/ExaminationsModalLayer";
import { ExaminationsPageActions } from "@/tenant/features/examinations/components/ExaminationsPageActions";
import { ExaminationsReportsTier } from "@/tenant/features/examinations/components/ExaminationsReportsTier";
import { ExaminationsSetupTier } from "@/tenant/features/examinations/components/ExaminationsSetupTier";
import { ExaminationsWorkTier } from "@/tenant/features/examinations/components/ExaminationsWorkTier";
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

  useModuleCreateHotkey({
    enabled: canWrite && !showDeleted,
    onCreate: () => {
      setActiveTab("work");
      setActiveSubTab("exams");
      setCreateExamKey((key) => key + 1);
    },
  });

  const listLoadFailed = examsResult.queryResult.isError;

  return (
    <ModulePageShell
      seoTitle={`MMS - ${t("nav.examinations")}`}
      seoDescription={t("page.examinations.subtitle")}
      headerIcon={Layers}
      headerTitle={t("nav.examinations")}
      headerSubtitle={t("page.examinations.subtitle")}
      headerActions={
        <ExaminationsPageActions
          canWrite={canWrite}
          showDeleted={showDeleted}
          onEnterMarks={() => setShowMarksModal(true)}
          onCreateExam={() => {
            setActiveTab("work");
            setActiveSubTab("exams");
            setEditExam(null);
            setShowExamForm(true);
            setCreateExamKey((key) => key + 1);
          }}
        />
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
              <ExaminationsSetupTier
                tabs={SETUP_TABS}
                activeTab={effectiveConfigTab}
                canEditSetup={canEditSetup}
                onTabChange={setConfigSubTab}
              />
            )}

            {effectiveTab === "reports" && <ExaminationsReportsTier />}

            {effectiveTab === "work" && (
              <ExaminationsWorkTier
                tabs={OPS_SUB_TABS}
                activeSubTab={effectiveSubTab}
                showDeleted={showDeleted}
                listLoadFailed={listLoadFailed}
                listLayout={listLayout}
                canWrite={canWrite}
                canDelete={canDelete}
                createExamKey={createExamKey}
                exams={exams}
                examResults={examResults}
                examColumnLayout={examColumnLayout}
                resultsColumnLayout={resultsColumnLayout}
                onSubTabChange={setActiveSubTab}
                onToggleDeleted={() => setShowDeleted((prev) => !prev)}
                onRetry={() => { void examsResult.queryResult.refetch(); }}
                onDelete={handleDeleteExam}
                onRestore={handleRestoreExam}
                onBulkDelete={handleBulkDelete}
                onBulkRestore={handleBulkRestore}
                onNew={() => {
                  setEditExam(null);
                  setShowExamForm(true);
                }}
                onEdit={(exam) => {
                  setEditExam(exam);
                  setShowExamForm(true);
                }}
                onFilteredCountChange={setFilteredCount}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </ResponsiveAccordionTabs>

      <ExaminationsModalLayer
        canWrite={canWrite}
        showDeleted={showDeleted}
        showExamForm={showExamForm}
        showMarksModal={showMarksModal}
        editExam={editExam}
        exams={exams}
        examResults={examResults}
        onCloseExamForm={() => {
          setShowExamForm(false);
          setEditExam(null);
        }}
        onSaveExam={handleSaveExam}
        onCloseMarks={() => setShowMarksModal(false)}
        onSaveResults={handleSaveResults}
      />
    </ModulePageShell>
  );
}
