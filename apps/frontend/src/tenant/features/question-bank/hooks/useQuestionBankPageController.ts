import { useCallback, useMemo, useState, useEffect } from 'react';
import { useModuleCreateHotkey } from '@/hooks/useModuleCreateHotkey';
import { useTranslation } from '@/hooks/useTranslation';
import { useFilteredModuleTierTabs } from '@/tenant/hooks/useModuleTierTabs';
import { useModulePermissions } from '@/tenant/hooks/usePermissions';
import { usePersistedTabState } from '@/hooks/usePersistedTabState';
import { useQuestionBankConfig } from '@/tenant/features/question-bank/hooks/useQuestionBankConfig';
import { ClipboardList, FileText } from 'lucide-react';
import {
  QUESTION_BANK_MODULE_MANIFEST,
  resolveModuleTierTab,
  type AppTranslationKey,
  type QuestionBankQuestion,
  type QuestionBankTest,
} from '@mms/shared';
import type { PaperBuilderTab } from '@/tenant/features/question-bank/components/PaperBuilder';
import { useQuestionBankColumnLayout } from '@/tenant/features/question-bank/hooks/useQuestionBankColumnLayout';
import {
  useQuestionBankQuestions,
  useQuestionBankTestsCollection,
  useQuestionBankResultsCollection,
  useQuestionBankMutations,
} from '@/tenant/features/question-bank/hooks/useQuestionBankApi';
import { useQuestionBankTrashActions } from '@/tenant/features/question-bank/hooks/useQuestionBankTrashActions';

const SETUP_TAB_LABEL_KEYS: Record<(typeof QUESTION_BANK_MODULE_MANIFEST.setupSubTabs)[number], AppTranslationKey> = {
  fields: 'questionBank.setup.fields',
  preferences: 'questionBank.setup.preferences',
};

export function useQuestionBankPageController() {
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
  const questions = questionsResult.data ?? [];
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

  const handleSaveTest = useCallback(async (test: QuestionBankTest) => {
    await replaceTests.mutateAsync(
      tests.some((paper) => paper.id === test.id)
        ? tests.map((paper) => (paper.id === test.id ? test : paper))
        : [...tests, test],
    );
  }, [replaceTests, tests]);

  const effectiveTab = resolveModuleTierTab(
    activeTab,
    PAGE_TABS.map((tab) => tab.id),
  );
  const effectiveSubTab = OPS_SUB_TABS.find((tab) => tab.id === activeSubTab)
    ? activeSubTab
    : 'questions';
  const effectiveConfigTab = SETUP_TABS.find((tab) => tab.id === configSubTab)?.id ?? 'preferences';
  const listLoadFailed = questionsResult.isError;

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

  return {
    t,
    canWrite,
    canDelete,
    canEditSetup,
    PAGE_TABS,
    SETUP_TABS,
    OPS_SUB_TABS,
    activeTab,
    setActiveTab,
    effectiveTab,
    effectiveSubTab,
    effectiveConfigTab,
    showDeleted,
    setShowDeleted,
    showQuestionModal,
    setShowQuestionModal,
    editQuestion,
    setEditQuestion,
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
    setConfigSubTab,
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
