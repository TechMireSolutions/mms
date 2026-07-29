import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useFilteredModuleTierTabs } from '@/tenant/hooks/useModuleTierTabs';
import { useModulePermissions } from '@/tenant/hooks/usePermissions';
import { usePersistedTabState } from '@/hooks/usePersistedTabState';
import { useQuestionBankConfig } from '@/tenant/features/question-bank/hooks/useQuestionBankConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { Library, ClipboardList, FileText, Plus, Archive } from 'lucide-react';
import {
  QUESTION_BANK_MODULE_MANIFEST,
  resolveModuleTierTab,
  type AppTranslationKey,
  type QuestionBankQuestion,
  type QuestionBankTest,
} from '@mms/shared';
import { ModulePageShell } from "@/components/ui/ModulePageShell";
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ErrorState } from '@/components/ui/ErrorState';
import { SubTabBar } from '@/components/ui/SubTabBar';
import { ResponsiveAccordionTabs } from '@/components/ui/ResponsiveAccordionTabs';
import { Button } from '@/components/ui/button';
import { FormModal, type FormModalTab } from '@/components/ui/FormModal';
import { QuestionBank as QuestionsPanel } from "@/tenant/features/question-bank/components/QuestionBank";
import { QuestionForm } from "@/tenant/features/question-bank/components/QuestionForm";
import { PaperBuilder, type PaperBuilderTab } from "@/tenant/features/question-bank/components/PaperBuilder";
import { PerformanceAnalytics } from "@/tenant/features/question-bank/components/PerformanceAnalytics";
import { AutoGrading } from "@/tenant/features/question-bank/components/AutoGrading";
import { QuestionBankSettings } from "@/tenant/features/question-bank/components/QuestionBankSettings";
import { QuestionBankCommandMetrics } from "@/tenant/features/question-bank/components/QuestionBankCommandMetrics";
import ModuleReports from '@/tenant/features/reports/components/ModuleReports';
import KPISummary from '@/tenant/features/reports/components/KPISummary';
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
  const PAPER_BUILDER_TABS = useMemo<FormModalTab<PaperBuilderTab>[]>(
    () => [
      { key: 'details', label: t('questionBank.paperDetails'), icon: FileText },
      { key: 'saved', label: t('questionBank.savedPapers'), icon: Library },
      { key: 'sections', label: t('questionBank.paperSections'), icon: ClipboardList },
      { key: 'questions', label: t('questionBank.addQuestionsFromBank'), icon: Plus },
      { key: 'preview', label: t('questionBank.paperPreview'), icon: FileText },
    ],
    [t],
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

  useEffect(() => {
    if (!canWrite || showDeleted) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'n') {
        const target = event.target as HTMLElement | null;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
          return;
        }
        if (effectiveTab !== 'work' || effectiveSubTab !== 'questions') return;
        event.preventDefault();
        openAddQuestion();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [canWrite, showDeleted, effectiveTab, effectiveSubTab, openAddQuestion]);

  return (
    <ModulePageShell
      seoTitle={`MMS - ${t('page.questionBank.title')}`}
      seoDescription={t('page.questionBank.subtitle')}
      headerIcon={Library}
      headerTitle={t('nav.questionBank')}
      headerSubtitle={t('page.questionBank.subtitle')}
      headerActions={
        canWrite && !showDeleted ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" variant="outline" onClick={openCreatePaper}>
              <FileText className="h-3.5 w-3.5" />
              {t('questionBank.generator')}
            </Button>
            <Button type="button" size="sm" onClick={openAddQuestion}>
              <Plus className="h-3.5 w-3.5" />
              {t('questionBank.addQuestion')}
            </Button>
          </div>
        ) : undefined
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
        {effectiveTab === 'work' && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SubTabBar
              tabs={OPS_SUB_TABS.map((tab) => ({ key: tab.id, label: tab.label }))}
              value={effectiveSubTab}
              onChange={(next) => {
                setActiveSubTab(next);
                if (next !== 'questions') setShowDeleted(false);
              }}
            />
            {effectiveSubTab === 'questions' && canDelete && (
              <Button
                type="button"
                variant={showDeleted ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowDeleted((prev) => !prev)}
                className="gap-1.5 shrink-0"
              >
                <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                {showDeleted ? t('questionBank.trash.showActive') : t('questionBank.trash.showDeleted')}
              </Button>
            )}
          </div>
        )}

        <ErrorBoundary>
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
                <div className="space-y-4">
                  <SubTabBar
                    tabs={SETUP_TABS.map((tab) => ({ key: tab.id, label: tab.label }))}
                    value={effectiveConfigTab}
                    onChange={setConfigSubTab}
                  />
                  {!canEditSetup ? (
                    <p className="text-sm text-muted-foreground rounded-xl border border-border bg-muted/20 px-4 py-6">
                      {t('questionBank.setup.readOnly')}
                    </p>
                  ) : (
                    <QuestionBankSettings mode={effectiveConfigTab as 'fields' | 'preferences'} />
                  )}
                </div>
              )}

              {effectiveTab === 'reports' && (
                <div className="space-y-4">
                  <KPISummary category="questionBank" />
                  <ModuleReports category="questionBank" />
                  <PerformanceAnalytics
                    tests={tests}
                    results={questionBankResults}
                    questions={questions}
                    categories={questionBankConfig.categories}
                  />
                  {tests.length > 0 && (
                    <AutoGrading tests={tests} results={questionBankResults} questions={questions} />
                  )}
                </div>
              )}

              {effectiveTab === 'work' && effectiveSubTab === 'questions' && listLoadFailed && (
                <ErrorState
                  title={t('questionBank.loadFailed')}
                  onRetry={() => { void questionsResult.queryResult.refetch(); }}
                />
              )}

              {effectiveTab === 'work' && effectiveSubTab === 'questions' && !listLoadFailed && (
                <QuestionsPanel
                  questions={questions}
                  onUpdate={setQuestions}
                  modalOpen={showQuestionModal}
                  editQuestion={editQuestion}
                  onModalOpenChange={setShowQuestionModal}
                  onEditQuestionChange={setEditQuestion}
                  hideToolbarAdd
                  canWrite={canWrite}
                  canDelete={canDelete}
                  showDeleted={showDeleted}
                  onDelete={handleDeleteQuestion}
                  onRestore={handleRestoreQuestion}
                  onBulkDelete={handleBulkDelete}
                  onBulkRestore={handleBulkRestore}
                  listLayout={listLayout}
                  onFilteredCountChange={setFilteredCount}
                  isColumnVisible={columnLayout.isColumnVisible}
                  getColumnWidth={columnLayout.getColumnWidth}
                  onColumnResize={columnLayout.setColumnWidth}
                  columnCustomizer={{
                    columnRegistry: columnLayout.columnRegistry,
                    updateUserColumnLayout: columnLayout.updateUserColumnLayout,
                    labels: columnLayout.customizerLabels,
                  }}
                />
              )}

              {effectiveTab === 'work' && effectiveSubTab === 'generate' && canWrite && !showDeleted && (
                <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="m-0 text-sm font-bold text-foreground">{t('questionBank.generatorTitle')}</h2>
                      <p className="m-0 text-xs text-muted-foreground">{t('questionBank.manualPaperGeneratorSubtitle')}</p>
                    </div>
                    <Button type="button" onClick={openCreatePaper} className="w-full sm:w-auto">
                      <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                      {t('questionBank.generator')}
                    </Button>
                  </div>
                </section>
              )}
            </motion.div>
          </AnimatePresence>
        </ErrorBoundary>
      </ResponsiveAccordionTabs>

      {canWrite && !showDeleted && (
        <FormModal
          open={paperBuilderOpen}
          onClose={() => setPaperBuilderOpen(false)}
          title={t('questionBank.generatorTitle')}
          subtitle={t('questionBank.manualPaperGeneratorSubtitle')}
          icon={FileText}
          size="xl"
          hideFooter
          tabs={PAPER_BUILDER_TABS}
          activeTab={paperBuilderTab}
          onTabChange={setPaperBuilderTab}
          panelClassName="h-[94vh] max-w-[calc(100%-1rem)] rounded-xl sm:h-[92vh] sm:max-w-[calc(100%-2rem)] sm:rounded-2xl xl:max-w-6xl"
        >
          <PaperBuilder
            key={paperBuilderSession}
            questions={questions}
            tests={tests}
            activeTab={paperBuilderTab}
            showHeader={false}
            onSaveTest={async (test: QuestionBankTest) => {
              await replaceTests.mutateAsync(
                tests.some((paper) => paper.id === test.id)
                  ? tests.map((paper) => (paper.id === test.id ? test : paper))
                  : [...tests, test],
              );
            }}
          />
        </FormModal>
      )}

      {canWrite && !showDeleted && (
        <QuestionForm
          open={showQuestionModal}
          question={editQuestion}
          questions={questions}
          onClose={closeQuestionModal}
          onSave={handleQuestionSave}
        />
      )}
    </ModulePageShell>
  );
}
