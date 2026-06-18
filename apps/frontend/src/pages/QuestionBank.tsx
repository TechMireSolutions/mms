import React, { useCallback, useMemo, useState } from 'react';
import useConfigSubTabs from '@/hooks/useConfigSubTabs';
import useTranslation from '@/hooks/useTranslation';
import useModuleTierTabs from '@/hooks/useModuleTierTabs';
import { usePersistedTabState } from '@/hooks/usePersistedTabState';
import { useQuestionBankConfig } from '@/hooks/useQuestionBankConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { Library, ClipboardList, Sparkles, Plus } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import ResponsiveAccordionTabs from '@/components/ui/ResponsiveAccordionTabs';
import SubTabBar from '@/components/ui/SubTabBar';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { Button } from '@/components/ui/button';
import QuestionsPanel from '../components/questionBank/QuestionBank';
import QuestionForm from '../components/questionBank/QuestionForm';
import GenerateTest from '../components/questionBank/GenerateTest';
import PerformanceAnalytics from '../components/questionBank/PerformanceAnalytics';
import AutoGrading from '../components/questionBank/AutoGrading';
import QuestionBankSettings from '../components/questionBank/QuestionBankSettings';
import ModuleReports from '../components/reports/ModuleReports';
import KPISummary from '../components/reports/KPISummary';
import type { QuestionBankQuestion, QuestionBankTest } from '@mms/shared';
import { saveCollection } from '../lib/db';
import { useLiveCollection } from '../hooks/useLiveCollection';

/**
 * Question Bank — Work | Reports | Setup.
 */
export default function QuestionBankPage(): React.JSX.Element {
  const PAGE_TABS = useModuleTierTabs();
  const configSubTabs = useConfigSubTabs();
  const { t } = useTranslation();
  const questions = useLiveCollection('questions');
  const tests = useLiveCollection('tests');
  const results = useLiveCollection('assessment_results');
  const { categories } = useQuestionBankConfig(questions);
  const OPS_SUB_TABS = useMemo(
    () => [
      { id: 'questions', label: t('questionBank.questions'), icon: ClipboardList },
      { id: 'generate', label: t('questionBank.generator'), icon: Sparkles },
    ],
    [t],
  );
  const [activeTab, setActiveTab] = usePersistedTabState<string>('question_bank_active_tab', 'work');
  const [activeSubTab, setActiveSubTab] = usePersistedTabState<string>('question_bank_ops_subtab', 'questions');
  const [configSubTab, setConfigSubTab] = usePersistedTabState<string>(
    'question_bank_config_subtab',
    'fields',
  );
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editQuestion, setEditQuestion] = useState<QuestionBankQuestion | null>(null);

  const setQuestions = useCallback(
    (updater: typeof questions | ((prev: typeof questions) => typeof questions)) => {
      const next = typeof updater === 'function' ? updater(questions) : updater;
      saveCollection('questions', next);
    },
    [questions],
  );

  const openAddQuestion = useCallback((): void => {
    setActiveTab('work');
    setActiveSubTab('questions');
    setEditQuestion(null);
    setShowQuestionModal(true);
  }, [setActiveTab, setActiveSubTab]);

  const handleQuestionSave = useCallback(
    (q: QuestionBankQuestion): void => {
      const exists = questions.find((x) => x.id === q.id);
      setQuestions(exists ? questions.map((x) => (x.id === q.id ? q : x)) : [...questions, q]);
      setShowQuestionModal(false);
      setEditQuestion(null);
    },
    [questions, setQuestions],
  );

  const closeQuestionModal = useCallback((): void => {
    setShowQuestionModal(false);
    setEditQuestion(null);
  }, []);

  const effectiveTab = PAGE_TABS.find((tab) => tab.id === activeTab) ? activeTab : 'work';
  const effectiveSubTab = OPS_SUB_TABS.find((tab) => tab.id === activeSubTab)
    ? activeSubTab
    : 'questions';
  const effectiveConfigSubTab =
    configSubTab === 'fields' || configSubTab === 'preferences'
      ? configSubTab
      : 'fields';

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
              key={`${effectiveTab}-${effectiveSubTab}-${effectiveConfigSubTab}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="space-y-4"
            >
              {effectiveTab === 'setup' && (
                <div className="space-y-4">
                  <SubTabBar
                    tabs={configSubTabs.map((tab) => ({ key: tab.id, label: tab.label }))}
                    value={effectiveConfigSubTab}
                    onChange={(key) => setConfigSubTab(key)}
                  />
                  <QuestionBankSettings mode={effectiveConfigSubTab} />
                </div>
              )}

              {effectiveTab === 'reports' && (
                <div className="space-y-4">
                  <KPISummary category="questionBank" />
                  <ModuleReports category="questionBank" />
                  <PerformanceAnalytics
                    tests={tests}
                    results={results}
                    questions={questions}
                    categories={categories}
                  />
                  {tests.length > 0 && (
                    <AutoGrading tests={tests} results={results} questions={questions} />
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
                />
              )}

              {effectiveTab === 'work' && effectiveSubTab === 'generate' && (
                <GenerateTest
                  questions={questions}
                  tests={tests}
                  onCreateTest={(test: QuestionBankTest) =>
                    saveCollection('tests', [...tests, test])
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
