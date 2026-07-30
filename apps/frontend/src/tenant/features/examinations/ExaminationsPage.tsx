import type { JSX } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers } from 'lucide-react';
import { ModulePageShell } from '@/components/ui/ModulePageShell';
import { ResponsiveAccordionTabs } from '@/components/ui/ResponsiveAccordionTabs';
import { ExaminationsCommandMetrics } from '@/tenant/features/examinations/components/ExaminationsCommandMetrics';
import { ExaminationsModalLayer } from '@/tenant/features/examinations/components/ExaminationsModalLayer';
import { ExaminationsPageActions } from '@/tenant/features/examinations/components/ExaminationsPageActions';
import { ExaminationsReportsTier } from '@/tenant/features/examinations/components/ExaminationsReportsTier';
import { ExaminationsSetupTier } from '@/tenant/features/examinations/components/ExaminationsSetupTier';
import { ExaminationsWorkTier } from '@/tenant/features/examinations/components/ExaminationsWorkTier';
import { useExaminationsPageController } from '@/tenant/features/examinations/hooks/useExaminationsPageController';

/**
 * Examinations — formal exams, marking, and results. Work | Reports | Setup.
 */
export default function Examinations(): JSX.Element {
  const c = useExaminationsPageController();

  return (
    <ModulePageShell
      seoTitle={`MMS - ${c.t('nav.examinations')}`}
      seoDescription={c.t('page.examinations.subtitle')}
      headerIcon={Layers}
      headerTitle={c.t('nav.examinations')}
      headerSubtitle={c.t('page.examinations.subtitle')}
      headerActions={
        <ExaminationsPageActions
          canWrite={c.canWrite}
          showDeleted={c.showDeleted}
          onEnterMarks={() => c.setShowMarksModal(true)}
          onCreateExam={c.openCreateExam}
        />
      }
      metricsStrip={
        <ExaminationsCommandMetrics total={c.exams.length} shown={c.filteredCount} />
      }
    >
      <ResponsiveAccordionTabs
        tabs={c.PAGE_TABS}
        activeTab={c.effectiveTab}
        onTabChange={c.setActiveTab}
        panelIdPrefix="examinations-tab"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${c.effectiveTab}-${c.effectiveSubTab}-${String(c.showDeleted)}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {c.effectiveTab === 'setup' && (
              <ExaminationsSetupTier
                tabs={c.SETUP_TABS}
                activeTab={c.effectiveConfigTab}
                canEditSetup={c.canEditSetup}
                onTabChange={c.setConfigSubTab}
              />
            )}

            {c.effectiveTab === 'reports' && <ExaminationsReportsTier />}

            {c.effectiveTab === 'work' && (
              <ExaminationsWorkTier
                tabs={c.OPS_SUB_TABS}
                activeSubTab={c.effectiveSubTab}
                showDeleted={c.showDeleted}
                listLoadFailed={c.listLoadFailed}
                listLayout={c.listLayout}
                canWrite={c.canWrite}
                canDelete={c.canDelete}
                createExamKey={c.createExamKey}
                exams={c.exams}
                examResults={c.examResults}
                examColumnLayout={c.examColumnLayout}
                resultsColumnLayout={c.resultsColumnLayout}
                onSubTabChange={c.setActiveSubTab}
                onToggleDeleted={() => c.setShowDeleted((prev) => !prev)}
                onRetry={c.refetchExams}
                onDelete={c.handleDeleteExam}
                onRestore={c.handleRestoreExam}
                onBulkDelete={c.handleBulkDelete}
                onBulkRestore={c.handleBulkRestore}
                onNew={() => {
                  c.setEditExam(null);
                  c.setShowExamForm(true);
                }}
                onEdit={(exam) => {
                  c.setEditExam(exam);
                  c.setShowExamForm(true);
                }}
                onFilteredCountChange={c.setFilteredCount}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </ResponsiveAccordionTabs>

      <ExaminationsModalLayer
        canWrite={c.canWrite}
        showDeleted={c.showDeleted}
        showExamForm={c.showExamForm}
        showMarksModal={c.showMarksModal}
        editExam={c.editExam}
        exams={c.exams}
        examResults={c.examResults}
        onCloseExamForm={() => {
          c.setShowExamForm(false);
          c.setEditExam(null);
        }}
        onSaveExam={c.handleSaveExam}
        onCloseMarks={() => c.setShowMarksModal(false)}
        onSaveResults={c.handleSaveResults}
      />
    </ModulePageShell>
  );
}
