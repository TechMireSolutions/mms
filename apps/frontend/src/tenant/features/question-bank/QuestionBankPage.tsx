import type { JSX } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Library } from 'lucide-react';
import { ModulePageShell } from '@/components/ui/ModulePageShell';
import { ResponsiveAccordionTabs } from '@/components/ui/ResponsiveAccordionTabs';
import { QuestionBankCommandMetrics } from '@/tenant/features/question-bank/components/QuestionBankCommandMetrics';
import { QuestionBankModalLayer } from '@/tenant/features/question-bank/components/QuestionBankModalLayer';
import { QuestionBankPageActions } from '@/tenant/features/question-bank/components/QuestionBankPageActions';
import { QuestionBankReportsTier } from '@/tenant/features/question-bank/components/QuestionBankReportsTier';
import { QuestionBankSetupTier } from '@/tenant/features/question-bank/components/QuestionBankSetupTier';
import { QuestionBankWorkTier } from '@/tenant/features/question-bank/components/QuestionBankWorkTier';
import { useQuestionBankPageController } from '@/tenant/features/question-bank/hooks/useQuestionBankPageController';

/**
 * Question Bank — Work | Reports | Setup.
 */
export default function QuestionBankPage(): JSX.Element {
  const c = useQuestionBankPageController();

  return (
    <ModulePageShell
      seoTitle={`MMS - ${c.t('page.questionBank.title')}`}
      seoDescription={c.t('page.questionBank.subtitle')}
      headerIcon={Library}
      headerTitle={c.t('nav.questionBank')}
      headerSubtitle={c.t('page.questionBank.subtitle')}
      headerActions={
        <QuestionBankPageActions
          canWrite={c.canWrite}
          showDeleted={c.showDeleted}
          onCreatePaper={c.openCreatePaper}
          onAddQuestion={c.openAddQuestion}
        />
      }
      metricsStrip={
        <QuestionBankCommandMetrics total={c.questions.length} shown={c.filteredCount} />
      }
    >
      <ResponsiveAccordionTabs
        tabs={c.PAGE_TABS}
        activeTab={c.effectiveTab}
        onTabChange={c.setActiveTab}
        panelIdPrefix="question-bank-tab"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${c.effectiveTab}-${c.effectiveSubTab}-${String(c.showDeleted)}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="space-y-4"
          >
            {c.effectiveTab === 'setup' && (
              <QuestionBankSetupTier
                tabs={c.SETUP_TABS}
                activeTab={c.effectiveConfigTab}
                canEditSetup={c.canEditSetup}
                onTabChange={c.setConfigSubTab}
              />
            )}

            {c.effectiveTab === 'reports' && (
              <QuestionBankReportsTier
                tests={c.tests}
                results={c.questionBankResults}
                questions={c.questions}
                categories={c.questionBankConfig.categories}
              />
            )}

            {c.effectiveTab === 'work' && (
              <QuestionBankWorkTier
                tabs={c.OPS_SUB_TABS}
                activeSubTab={c.effectiveSubTab}
                showDeleted={c.showDeleted}
                listLoadFailed={c.listLoadFailed}
                questions={c.questions}
                showQuestionModal={c.showQuestionModal}
                editQuestion={c.editQuestion}
                canWrite={c.canWrite}
                canDelete={c.canDelete}
                columnLayout={c.columnLayout}
                onSubTabChange={c.setActiveSubTab}
                onToggleDeleted={() => c.setShowDeleted((prev) => !prev)}
                onRetry={c.refetchQuestions}
                onUpdateQuestions={c.setQuestions}
                onQuestionModalOpenChange={c.setShowQuestionModal}
                onEditQuestionChange={c.setEditQuestion}
                onDelete={c.handleDeleteQuestion}
                onRestore={c.handleRestoreQuestion}
                onBulkDelete={c.handleBulkDelete}
                onBulkRestore={c.handleBulkRestore}
                onFilteredCountChange={c.setFilteredCount}
                onCreatePaper={c.openCreatePaper}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </ResponsiveAccordionTabs>

      <QuestionBankModalLayer
        canWrite={c.canWrite}
        showDeleted={c.showDeleted}
        paperBuilderOpen={c.paperBuilderOpen}
        paperBuilderSession={c.paperBuilderSession}
        paperBuilderTab={c.paperBuilderTab}
        questions={c.questions}
        tests={c.tests}
        showQuestionModal={c.showQuestionModal}
        editQuestion={c.editQuestion}
        onClosePaperBuilder={() => c.setPaperBuilderOpen(false)}
        onPaperBuilderTabChange={c.setPaperBuilderTab}
        onSaveTest={c.handleSaveTest}
        onCloseQuestion={c.closeQuestionModal}
        onSaveQuestion={c.handleQuestionSave}
      />
    </ModulePageShell>
  );
}
