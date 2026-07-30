import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useModuleCreateHotkey } from '@/hooks/useModuleCreateHotkey';
import { useTranslation } from '@/hooks/useTranslation';
import { useFilteredModuleTierTabs } from '@/tenant/hooks/useModuleTierTabs';
import { useModulePermissions } from '@/tenant/hooks/usePermissions';
import { usePersistedTabState } from '@/hooks/usePersistedTabState';
import { useQuestionBankConfig } from '@/tenant/features/question-bank/hooks/useQuestionBankConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { Library, ClipboardList, FileText } from 'lucide-react';
import {
  QUESTION_BANK_MODULE_MANIFEST,
  resolveModuleTierTab,
  type AppTranslationKey,
  type QuestionBankQuestion,
  type QuestionBankTest,
} from '@mms/shared';
import { ModulePageShell } from "@/components/ui/ModulePageShell";
import { ResponsiveAccordionTabs } from '@/components/ui/ResponsiveAccordionTabs';
import type { PaperBuilderTab } from "@/tenant/features/question-bank/components/PaperBuilder";
import { QuestionBankCommandMetrics } from "@/tenant/features/question-bank/components/QuestionBankCommandMetrics";
import { QuestionBankModalLayer } from "@/tenant/features/question-bank/components/QuestionBankModalLayer";
import { QuestionBankPageActions } from "@/tenant/features/question-bank/components/QuestionBankPageActions";
import { QuestionBankReportsTier } from "@/tenant/features/question-bank/components/QuestionBankReportsTier";
import { QuestionBankSetupTier } from "@/tenant/features/question-bank/components/QuestionBankSetupTier";
import { QuestionBankWorkTier } from "@/tenant/features/question-bank/components/QuestionBankWorkTier";
import { useQuestionBankColumnLayout } from '@/tenant/features/question-bank/hooks/useQuestionBankColumnLayout';
import {
  useQuestionBankQuestions,
  useQuestionBankTestsCollection,
  useQuestionBankResultsCollection,
  useQuestionBankMutations,
} from '@/tenant/features/question-bank/hooks/useQuestionBankApi';
import { notify } from '@/lib/notify';

const SETUP_TAB_LABEL_KEYS: Record<(typeof QUESTION_BANK_MODULE_MANIFEST.setupSubTabs)[number], AppTranslationKey> = {
  fields: 'questionBank.setup.fields',
  preferences: 'questionBank.setup.preferences',
};

/**
 * Question Bank — Work | Reports | Setup.
 */
export default function QuestionBankPage(): React.JSX.Element {
  const { t } = useTranslation();
  const {
    canWrite,
    canDelete,
    canEditSetup,
    canReports: canViewReports,
    canViewSetup,
  } = useModulePermissions(QUESTION_BANK_MODULE_MANIFEST);
  const PAGE_TABS = useFilteredModuleTierTabs({ canViewSetup, canViewReports });
  const SETUP_TABS = useMemo(
    () => QUESTION_BANK_MODULE_MANIFEST.setupSubTabs.map((id) => ({
      id,
      label: t(SETUP_TAB_LABEL_KEYS[id]),
    })),
    [t],
  );
  const [showDeleted, setShowDeleted] = useState(false);
  const questionsResult = useQuestionBankQuestions({ includeDeleted: showDeleted });
  const questions = questionsResult.syncedData;
  const tests = useQuestionBankTestsCollection();
  const questionBankResults = useQuestionBankResultsCollection();
  const questionBankConfig = useQuestionBankConfig(questions);
  const OPS_SUB_TABS = useMemo(
    () => [
      { id: 'questions', label: t('questionBank.questions'), icon: ClipboardList },
      ...(canWrite && !showDeleted ? [{ id: 'generate', label: t('questionBank.generator'), icon: FileText }] : []),
    ],
    [t, canWrite, showDeleted],
  );
  const [activeTab, setActiveTab] = usePersistedTabState<string>('question_bank_active_tab', 'work');
  const [activeSubTab, setActiveSubTab] = usePersistedTabState<string>('question_bank_ops_subtab', 'questions');
  const [configSubTab, setConfigSubTab] = usePersistedTabState<string>('question_bank_config_subtab', 'preferences');
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editQuestion, setEditQuestion] = useState<QuestionBankQuestion | null>(null);
  const [filteredCount, setFilteredCount] = useState(0);
  const [paperBuilderSession, setPaperBuilderSession] = useState(0);
  const [paperBuilderOpen, setPaperBuilderOpen] = useState(false);
  const [paperBuilderTab, setPaperBuilderTab] = useState<PaperBuilderTab>('details');
  const columnLayout = useQuestionBankColumnLayout();
  const listLayout = (questionBankConfig.settings.defaultViewLayout || 'list') === 'list';

  const {
    replaceQuestions,
    replaceTests,
    deleteQuestion,
    restoreQuestion,
    bulkDeleteQuestions,
    bulkRestoreQuestions,
  } = useQuestionBankMutations();

  const setQuestions = useCallback(
    async (updater: typeof questions | ((prev: typeof questions) => typeof questions)) => {
      const nextQuestions = typeof updater === 'function' ? updater(questions) : updater;
      await replaceQuestions.mutateAsync(nextQuestions);
    },
    [questions, replaceQuestions],
  );

  const openAddQuestion = useCallback((): void => {
    setActiveTab('work');
    setActiveSubTab('questions');
    setEditQuestion(null);
    setShowQuestionModal(true);
  }, [setActiveTab, setActiveSubTab]);

  const openCreatePaper = useCallback((): void => {
    setActiveTab('work');
    setActiveSubTab('generate');
    setPaperBuilderTab('details');
    setPaperBuilderSession((session) => session + 1);
    setPaperBuilderOpen(true);
  }, [setActiveTab, setActiveSubTab]);

  const handleQuestionSave = useCallback(
    async (question: QuestionBankQuestion): Promise<void> => {
      const existingQuestion = questions.find((questionItem) => questionItem.id === question.id);
      await setQuestions(
        existingQuestion
          ? questions.map((questionItem) => (questionItem.id === question.id ? question : questionItem))
          : [...questions, question],
      );
      setShowQuestionModal(false);
      setEditQuestion(null);
    },
    [questions, setQuestions],
  );

  const closeQuestionModal = useCallback((): void => {
    setShowQuestionModal(false);
    setEditQuestion(null);
  }, []);

  const notifyTrashFailure = useCallback((error: unknown) => {
    notify.error(t('questionBank.trash.actionFailed'), {
      description: error instanceof Error ? error.message : String(error),
    });
  }, [t]);

  const handleDeleteQuestion = useCallback(async (id: string) => {
    try {
      await deleteQuestion.mutateAsync(id);
      notify.success(t('questionBank.trash.deleted'));
    } catch (error: unknown) {
      notifyTrashFailure(error);
      throw error;
    }
  }, [deleteQuestion, notifyTrashFailure, t]);

  const handleRestoreQuestion = useCallback(async (id: string) => {
    try {
      await restoreQuestion.mutateAsync(id);
      notify.success(t('questionBank.trash.restored'));
    } catch (error: unknown) {
      notifyTrashFailure(error);
      throw error;
    }
  }, [restoreQuestion, notifyTrashFailure, t]);

  const handleBulkDelete = useCallback(async (ids: string[]) => {
    try {
      const result = await bulkDeleteQuestions.mutateAsync(ids);
      if (result.failed > 0) {
        notify.warning(t('questionBank.trash.bulkPartial', {
          succeeded: result.succeeded,
          failed: result.failed,
        }));
      } else {
        notify.success(t('questionBank.trash.deleted'));
      }
    } catch (error: unknown) {
      notifyTrashFailure(error);
      throw error;
    }
  }, [bulkDeleteQuestions, notifyTrashFailure, t]);

  const handleBulkRestore = useCallback(async (ids: string[]) => {
    try {
      const result = await bulkRestoreQuestions.mutateAsync(ids);
      if (result.failed > 0) {
        notify.warning(t('questionBank.trash.bulkPartial', {
          succeeded: result.succeeded,
          failed: result.failed,
        }));
      } else {
        notify.success(t('questionBank.trash.restored'));
      }
    } catch (error: unknown) {
      notifyTrashFailure(error);
      throw error;
    }
  }, [bulkRestoreQuestions, notifyTrashFailure, t]);

  const effectiveTab = resolveModuleTierTab(
    activeTab,
    PAGE_TABS.map((tab) => tab.id),
  );
  const effectiveSubTab = OPS_SUB_TABS.find((tab) => tab.id === activeSubTab)
    ? activeSubTab
    : 'questions';
  const effectiveConfigTab = SETUP_TABS.find((tab) => tab.id === configSubTab)?.id ?? 'preferences';
  const listLoadFailed = questionsResult.queryResult.isError;

  useEffect(() => {
    if (effectiveTab === 'work' && effectiveSubTab === 'questions') return;
    setFilteredCount(questions.length);
  }, [effectiveTab, effectiveSubTab, questions.length]);

  useModuleCreateHotkey({
    enabled: canWrite
      && !showDeleted
      && effectiveTab === 'work'
      && effectiveSubTab === 'questions',
    onCreate: openAddQuestion,
  });

  return (
    <ModulePageShell
      seoTitle={`MMS - ${t('page.questionBank.title')}`}
      seoDescription={t('page.questionBank.subtitle')}
      headerIcon={Library}
      headerTitle={t('nav.questionBank')}
      headerSubtitle={t('page.questionBank.subtitle')}
      headerActions={
        <QuestionBankPageActions
          canWrite={canWrite}
          showDeleted={showDeleted}
          onCreatePaper={openCreatePaper}
          onAddQuestion={openAddQuestion}
        />
      }
      metricsStrip={
        <QuestionBankCommandMetrics total={questions.length} shown={filteredCount} />
      }
    >
      <ResponsiveAccordionTabs
        tabs={PAGE_TABS}
        activeTab={effectiveTab}
        onTabChange={setActiveTab}
        panelIdPrefix="question-bank-tab"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${effectiveTab}-${effectiveSubTab}-${String(showDeleted)}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="space-y-4"
          >
            {effectiveTab === 'setup' && (
              <QuestionBankSetupTier
                tabs={SETUP_TABS}
                activeTab={effectiveConfigTab}
                canEditSetup={canEditSetup}
                onTabChange={setConfigSubTab}
              />
            )}

            {effectiveTab === 'reports' && (
              <QuestionBankReportsTier
                tests={tests}
                results={questionBankResults}
                questions={questions}
                categories={questionBankConfig.categories}
              />
            )}

            {effectiveTab === 'work' && (
              <QuestionBankWorkTier
                tabs={OPS_SUB_TABS}
                activeSubTab={effectiveSubTab}
                showDeleted={showDeleted}
                listLoadFailed={listLoadFailed}
                questions={questions}
                showQuestionModal={showQuestionModal}
                editQuestion={editQuestion}
                canWrite={canWrite}
                canDelete={canDelete}
                listLayout={listLayout}
                columnLayout={columnLayout}
                onSubTabChange={setActiveSubTab}
                onToggleDeleted={() => setShowDeleted((prev) => !prev)}
                onRetry={() => { void questionsResult.queryResult.refetch(); }}
                onUpdateQuestions={setQuestions}
                onQuestionModalOpenChange={setShowQuestionModal}
                onEditQuestionChange={setEditQuestion}
                onDelete={handleDeleteQuestion}
                onRestore={handleRestoreQuestion}
                onBulkDelete={handleBulkDelete}
                onBulkRestore={handleBulkRestore}
                onFilteredCountChange={setFilteredCount}
                onCreatePaper={openCreatePaper}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </ResponsiveAccordionTabs>

      <QuestionBankModalLayer
        canWrite={canWrite}
        showDeleted={showDeleted}
        paperBuilderOpen={paperBuilderOpen}
        paperBuilderSession={paperBuilderSession}
        paperBuilderTab={paperBuilderTab}
        questions={questions}
        tests={tests}
        showQuestionModal={showQuestionModal}
        editQuestion={editQuestion}
        onClosePaperBuilder={() => setPaperBuilderOpen(false)}
        onPaperBuilderTabChange={setPaperBuilderTab}
        onSaveTest={async (test: QuestionBankTest) => {
          await replaceTests.mutateAsync(
            tests.some((paper) => paper.id === test.id)
              ? tests.map((paper) => (paper.id === test.id ? test : paper))
              : [...tests, test],
          );
        }}
        onCloseQuestion={closeQuestionModal}
        onSaveQuestion={handleQuestionSave}
      />
    </ModulePageShell>
  );
}
