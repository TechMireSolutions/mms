import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useModuleTierTabs } from '@/tenant/hooks/useModuleTierTabs';
import { usePersistedTabState } from '@/hooks/usePersistedTabState';
import { useQuestionBankConfig } from '@/tenant/features/question-bank/hooks/useQuestionBankConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { Library, ClipboardList, FileText, Plus } from 'lucide-react';
import { resolveModuleTierTab } from '@mms/shared';
import { ModulePageShell } from "@/components/ui/ModulePageShell";
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
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
import type { QuestionBankQuestion, QuestionBankTest } from '@mms/shared';
import { useQuestionBankColumnLayout } from '@/tenant/features/question-bank/hooks/useQuestionBankColumnLayout';
import {
  useQuestionBankQuestionsCollection,
  useQuestionBankTestsCollection,
  useQuestionBankResultsCollection,
  useQuestionBankMutations,
} from '@/tenant/features/question-bank/hooks/useQuestionBankApi';

/**
 * Question Bank — Work | Reports | Setup.
 */
export default function QuestionBankPage(): React.JSX.Element {
  const PAGE_TABS = useModuleTierTabs();
  const { t } = useTranslation();
  const questions = useQuestionBankQuestionsCollection();
  const tests = useQuestionBankTestsCollection();
  const questionBankResults = useQuestionBankResultsCollection();
  const questionBankConfig = useQuestionBankConfig(questions);
  const OPS_SUB_TABS = useMemo(
    () => [
      { id: 'questions', label: t('questionBank.questions'), icon: ClipboardList },
      { id: 'generate', label: t('questionBank.generator'), icon: FileText },
    ],
    [t],
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
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editQuestion, setEditQuestion] = useState<QuestionBankQuestion | null>(null);
  const [filteredCount, setFilteredCount] = useState(0);
  const [paperBuilderSession, setPaperBuilderSession] = useState(0);
  const [paperBuilderOpen, setPaperBuilderOpen] = useState(false);
  const [paperBuilderTab, setPaperBuilderTab] = useState<PaperBuilderTab>('details');
  const columnLayout = useQuestionBankColumnLayout();
  const listLayout = (questionBankConfig.settings.defaultViewLayout || 'list') === 'list';

  const { replaceQuestions, replaceTests } = useQuestionBankMutations();

  const setQuestions = useCallback(
    (updater: typeof questions | ((prev: typeof questions) => typeof questions)) => {
      const nextQuestions = typeof updater === 'function' ? updater(questions) : updater;
      replaceQuestions.mutate(nextQuestions);
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
    (question: QuestionBankQuestion): void => {
      const existingQuestion = questions.find((questionItem) => questionItem.id === question.id);
      setQuestions(existingQuestion ? questions.map((questionItem) => (questionItem.id === question.id ? question : questionItem)) : [...questions, question]);
      setShowQuestionModal(false);
      setEditQuestion(null);
    },
    [questions, setQuestions],
  );

  const closeQuestionModal = useCallback((): void => {
    setShowQuestionModal(false);
    setEditQuestion(null);
  }, []);

  const effectiveTab = resolveModuleTierTab(
    activeTab,
    PAGE_TABS.map((tab) => tab.id),
  );
  const effectiveSubTab = OPS_SUB_TABS.find((tab) => tab.id === activeSubTab)
    ? activeSubTab
    : 'questions';

  useEffect(() => {
    if (effectiveTab === 'work' && effectiveSubTab === 'questions') return;
    setFilteredCount(questions.length);
  }, [effectiveTab, effectiveSubTab, questions.length]);

  return (
    <ModulePageShell
      seoTitle={`MMS - ${t('page.questionBank.title')}`}
      seoDescription={t('page.questionBank.subtitle')}
      headerIcon={Library}
      headerTitle={t('nav.questionBank')}
      headerSubtitle={t('page.questionBank.subtitle')}
      headerActions={
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
              transition={{ duration: 0.18 }}
              className="space-y-4"
            >
              {effectiveTab === 'setup' && (
                <QuestionBankSettings mode="preferences" />
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

              {effectiveTab === 'work' && effectiveSubTab === 'questions' && (
                <QuestionsPanel
                  questions={questions}
                  onUpdate={setQuestions}
                  modalOpen={showQuestionModal}
                  editQuestion={editQuestion}
                  onModalOpenChange={setShowQuestionModal}
                  onEditQuestionChange={setEditQuestion}
                  hideToolbarAdd
                  listLayout={listLayout}
                  onFilteredCountChange={setFilteredCount}
                  isColumnVisible={columnLayout.isColumnVisible}
                  columnCustomizer={{
                    columnRegistry: columnLayout.columnRegistry,
                    updateUserColumnLayout: columnLayout.updateUserColumnLayout,
                    labels: columnLayout.customizerLabels,
                  }}
                />
              )}

              {effectiveTab === 'work' && effectiveSubTab === 'generate' && (
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
        panelClassName="h-[94vh] max-w-[calc(100vw-1rem)] rounded-xl sm:h-[92vh] sm:max-w-[calc(100vw-2rem)] sm:rounded-2xl xl:max-w-6xl"
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

      <QuestionForm
        open={showQuestionModal}
        question={editQuestion}
        questions={questions}
        onClose={closeQuestionModal}
        onSave={handleQuestionSave}
      />
    </ModulePageShell>
  );
}
