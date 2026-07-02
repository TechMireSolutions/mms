import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useModuleTierTabs } from '@/hooks/useModuleTierTabs';
import { usePersistedTabState } from '@/hooks/usePersistedTabState';
import { useQuestionBankConfig } from '@/hooks/useQuestionBankConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { Library, ClipboardList, Sparkles, Plus } from 'lucide-react';
import { resolveModuleTierTab } from '@mms/shared';
import { PageHeader } from '../components/ui/PageHeader';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { SubTabBar } from '@/components/ui/SubTabBar';
import { ResponsiveAccordionTabs } from '@/components/ui/ResponsiveAccordionTabs';
import { Button } from '@/components/ui/button';
import { QuestionBank as QuestionsPanel } from "../components/questionBank/QuestionBank";
import { QuestionForm } from "../components/questionBank/QuestionForm";
import { GenerateTest } from "../components/questionBank/GenerateTest";
import { PerformanceAnalytics } from "../components/questionBank/PerformanceAnalytics";
import { AutoGrading } from "../components/questionBank/AutoGrading";
import { QuestionBankSettings } from "../components/questionBank/QuestionBankSettings";
import { QuestionBankCommandMetrics } from "../components/questionBank/QuestionBankCommandMetrics";
import ModuleReports from '../components/reports/ModuleReports';
import KPISummary from '../components/reports/KPISummary';
import type { QuestionBankQuestion, QuestionBankTest } from '@mms/shared';
import { useQuestionBankColumnLayout } from '@/hooks/useQuestionBankColumnLayout';
import {
  useQuestionBankQuestionsCollection,
  useQuestionBankTestsCollection,
  useQuestionBankResultsCollection,
  useQuestionBankMutations,
} from '@/hooks/useQuestionBankApi';

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
      { id: 'generate', label: t('questionBank.generator'), icon: Sparkles },
    ],
    [t],
  );
  const [activeTab, setActiveTab] = usePersistedTabState<string>('question_bank_active_tab', 'work');
  const [activeSubTab, setActiveSubTab] = usePersistedTabState<string>('question_bank_ops_subtab', 'questions');
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editQuestion, setEditQuestion] = useState<QuestionBankQuestion | null>(null);
  const [filteredCount, setFilteredCount] = useState(0);
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
    <div className="mx-auto max-w-7xl space-y-5">
      <title>MMS - {t('page.questionBank.title')}</title>
      <meta name="description" content={t('page.questionBank.subtitle')} />
      <PageHeader
        icon={Library}
        title={t('nav.questionBank')}
        subtitle={t('page.questionBank.subtitle')}
        actions={
          <Button type="button" size="sm" onClick={openAddQuestion}>
            <Plus className="h-3.5 w-3.5" />
            {t('questionBank.addQuestion')}
          </Button>
        }
      />

      <QuestionBankCommandMetrics total={questions.length} shown={filteredCount} />

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
                <GenerateTest
                  questions={questions}
                  tests={tests}
                  onCreateTest={(test: QuestionBankTest) =>
                    replaceTests.mutate([...tests, test])
                  }
                />
              )}
            </motion.div>
          </AnimatePresence>
        </ErrorBoundary>
      </ResponsiveAccordionTabs>

      <QuestionForm
        open={showQuestionModal}
        question={editQuestion}
        questions={questions}
        onClose={closeQuestionModal}
        onSave={handleQuestionSave}
      />
    </div>
  );
}
