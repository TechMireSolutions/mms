import { useCallback, useState, useEffect } from 'react';
import { useModuleShortcuts } from '@/hooks/useModuleShortcuts';
import { useTranslation } from '@/hooks/useTranslation';
import { useFilteredModuleTierTabs } from '@/tenant/hooks/useModuleTierTabs';
import { useModulePermissions } from '@/tenant/hooks/usePermissions';
import { usePersistedTabState } from '@/hooks/usePersistedTabState';
import { useQuestionBankConfig } from '@/tenant/features/question-bank/hooks/useQuestionBankConfig';
import { ClipboardList, FileText } from 'lucide-react';
import {
  QUESTION_BANK_MODULE_MANIFEST,
  resolveModuleTierTab,
  type QuestionBankQuestion,
  type QuestionBankTest,
} from '@mms/shared';
import type { PaperBuilderTab } from '@/tenant/features/question-bank/components/PaperBuilder';
import { useQuestionBankColumnLayout } from '@/tenant/features/question-bank/hooks/useQuestionBankColumnLayout';
import {
  useQuestionBankQuestions,
  useQuestionBankQuestionsCollection,
  useQuestionBankTestsCollection,
  useQuestionBankResultsCollection,
  useQuestionBankMutations,
} from '@/tenant/features/question-bank/hooks/useQuestionBankApi';
import { useQuestionBankTrashActions } from '@/tenant/features/question-bank/hooks/useQuestionBankTrashActions';


export function useQuestionBankPageController() {
  const { t } = useTranslation();
  const {
    canWrite,
    canDelete,
    canReports: canViewReports,
    canViewSetup,
  } = useModulePermissions(QUESTION_BANK_MODULE_MANIFEST);
  const PAGE_TABS = useFilteredModuleTierTabs({ canViewSetup, canViewReports });
  const [showDeleted, setShowDeleted] = useState(false);
  const questionsResult = useQuestionBankQuestions({ includeDeleted: showDeleted });
  const questions = useQuestionBankQuestionsCollection({ includeDeleted: showDeleted });
  const tests = useQuestionBankTestsCollection();
  const questionBankResults = useQuestionBankResultsCollection();
  const questionBankConfig = useQuestionBankConfig(questions);
  const OPS_SUB_TABS = (() => [
      { id: 'questions', label: t('questionBank.questions'), icon: ClipboardList },
      ...(canWrite && !showDeleted ? [{ id: 'generate', label: t('questionBank.generator'), icon: FileText }] : []),
    ])();
  const [activeTab, setActiveTab] = usePersistedTabState<string>('question_bank_active_tab', 'work');
  const [activeSubTab, setActiveSubTab] = usePersistedTabState<string>('question_bank_ops_subtab', 'questions');
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editQuestion, setEditQuestion] = useState<QuestionBankQuestion | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<QuestionBankQuestion | null>(null);
  const [filteredCount, setFilteredCount] = useState(0);
  const [paperBuilderSession, setPaperBuilderSession] = useState(0);
  const [paperBuilderOpen, setPaperBuilderOpen] = useState(false);
  const [paperBuilderTab, setPaperBuilderTab] = useState<PaperBuilderTab>('details');
  const columnLayout = useQuestionBankColumnLayout();

  const {
    replaceQuestions,
    replaceTests,
    deleteQuestion,
    restoreQuestion,
    bulkDeleteQuestions,
    bulkRestoreQuestions,
  } = useQuestionBankMutations();

  const {
    handleDeleteQuestion,
    handleRestoreQuestion,
    handleBulkDelete,
    handleBulkRestore,
  } = useQuestionBankTrashActions({
    deleteQuestion,
    restoreQuestion,
    bulkDeleteQuestions,
    bulkRestoreQuestions,
  });

  const setQuestions = useCallback(
    async (updater: typeof questions | ((prev: typeof questions) => typeof questions)) => {
      const nextQuestions = typeof updater === 'function' ? updater(questions) : updater;
      await replaceQuestions.mutateAsync(nextQuestions);
    },
    [questions, replaceQuestions],
  );

  const openAddQuestion = ((): void => {
    setActiveTab('work');
    setActiveSubTab('questions');
    setEditQuestion(null);
    setShowQuestionModal(true);
  });

  const openCreatePaper = ((): void => {
    setActiveTab('work');
    setActiveSubTab('generate');
    setPaperBuilderTab('details');
    setPaperBuilderSession((session) => session + 1);
    setPaperBuilderOpen(true);
  });

  const handleQuestionSave = (async (question: QuestionBankQuestion): Promise<void> => {
      const existingQuestion = questions.find((questionItem) => questionItem.id === question.id);
      await setQuestions(
        existingQuestion
          ? questions.map((questionItem) => (questionItem.id === question.id ? question : questionItem))
          : [...questions, question],
      );
      setShowQuestionModal(false);
      setEditQuestion(null);
    });

  const closeQuestionModal = ((): void => {
    setShowQuestionModal(false);
    setEditQuestion(null);
  });

  const handleSaveTest = (async (test: QuestionBankTest) => {
    await replaceTests.mutateAsync(
      tests.some((paper) => paper.id === test.id)
        ? tests.map((paper) => (paper.id === test.id ? test : paper))
        : [...tests, test],
    );
  });

  const effectiveTab = resolveModuleTierTab(
    activeTab,
    PAGE_TABS.map((tab) => tab.id),
  );
  const effectiveSubTab = OPS_SUB_TABS.find((tab) => tab.id === activeSubTab)
    ? activeSubTab
    : 'questions';
  const listLoadFailed = questionsResult.isError;

  useEffect(() => {
    if (effectiveTab === 'work' && effectiveSubTab === 'questions') return;
    setFilteredCount(questions.length);
  }, [effectiveTab, effectiveSubTab, questions.length]);

  useModuleShortcuts({
    searchInputId: 'question-bank-search-input',
    selectedCount: 0,
    hasActiveFilters: false,
    clearFilters: () => {},
    clearSelection: () => {},
    canWrite,
    showDeleted,
    onCreate: openAddQuestion,
    enabled: canWrite && !showDeleted && effectiveTab === 'work' && effectiveSubTab === 'questions',
  });

  return {
    t,
    canWrite,
    canDelete,
    PAGE_TABS,
    OPS_SUB_TABS,
    activeTab,
    setActiveTab,
    effectiveTab,
    effectiveSubTab,
    showDeleted,
    setShowDeleted,
    showQuestionModal,
    setShowQuestionModal,
    editQuestion,
    setEditQuestion,
    activeQuestion,
    setActiveQuestion,
    filteredCount,
    setFilteredCount,
    paperBuilderSession,
    paperBuilderOpen,
    setPaperBuilderOpen,
    paperBuilderTab,
    setPaperBuilderTab,
    columnLayout,
    questions,
    tests,
    questionBankResults,
    questionBankConfig,
    listLoadFailed,
    setActiveSubTab,
    openAddQuestion,
    openCreatePaper,
    handleQuestionSave,
    closeQuestionModal,
    handleDeleteQuestion,
    handleRestoreQuestion,
    handleBulkDelete,
    handleBulkRestore,
    handleSaveTest,
    setQuestions,
    refetchQuestions: () => { void questionsResult.refetch(); },
  };
}
