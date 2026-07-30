import { motion, AnimatePresence } from 'framer-motion';
import { Scale } from 'lucide-react';
import { ModulePageShell } from '@/components/ui/ModulePageShell';
import { ResponsiveAccordionTabs } from '@/components/ui/ResponsiveAccordionTabs';
import { ObligationsModalLayer } from '@/tenant/features/obligations/components/ObligationsModalLayer';
import { ObligationsPageActions } from '@/tenant/features/obligations/components/ObligationsPageActions';
import { ObligationsReportsTier } from '@/tenant/features/obligations/components/ObligationsReportsTier';
import { ObligationsSetupTier } from '@/tenant/features/obligations/components/ObligationsSetupTier';
import { ObligationsWorkTier } from '@/tenant/features/obligations/components/ObligationsWorkTier';
import { ObligationsCommandMetrics } from '@/tenant/features/obligations/components/ObligationsCommandMetrics';
import { useObligationsPageController } from '@/tenant/features/obligations/hooks/useObligationsPageController';

/**
 * Obligations — Khums, Zakat, and collections. Work | Reports | Setup.
 */
export default function Obligations() {
  const c = useObligationsPageController();

  return (
    <ModulePageShell
      seoTitle={`MMS - ${c.t('nav.obligations')}`}
      seoDescription={c.t('page.obligations.subtitle')}
      headerIcon={Scale}
      headerTitle={c.t('nav.obligations')}
      headerSubtitle={c.t('page.obligations.subtitle')}
      headerActions={
        <ObligationsPageActions
          canWrite={c.canWrite}
          showDeleted={c.showDeleted}
          onCreate={() => c.setShowForm(true)}
        />
      }
      metricsStrip={
        <ObligationsCommandMetrics total={c.collections.length} shown={c.filteredCount} />
      }
    >
      <ResponsiveAccordionTabs
        tabs={c.PAGE_TABS}
        activeTab={c.effectiveTab}
        onTabChange={c.setActiveTab}
        panelIdPrefix="obligations-tab"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={c.effectiveTab + '-' + (c.effectiveTab === 'setup' ? c.effectiveConfigTab : String(c.showDeleted))}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="space-y-4"
          >
            {c.effectiveTab === 'reports' && (
              <ObligationsReportsTier
                collections={c.collections}
                obligationTypes={c.obligationTypes}
                reps={c.reps}
                mujtahids={c.mujtahids}
                wakalaTypes={c.wakalaTypes}
                distributions={c.distributions}
              />
            )}

            {c.effectiveTab === 'work' && (
              <ObligationsWorkTier
                collections={c.collections}
                obligationTypes={c.obligationTypes}
                reps={c.reps}
                mujtahids={c.mujtahids}
                listLoadFailed={c.listLoadFailed}
                canWrite={c.canWrite}
                canDelete={c.canDelete}
                showDeleted={c.showDeleted}
                canWriteMessaging={c.canWriteMessaging}
                columnLayout={c.columnLayout}
                onAddNew={() => c.setShowForm(true)}
                onView={c.setViewCollection}
                onFilteredCountChange={c.setFilteredCount}
                onToggleShowDeleted={() => c.setShowDeleted((prev) => !prev)}
                onDelete={c.handleDelete}
                onRestore={c.handleRestore}
                onBulkDelete={c.handleBulkDelete}
                onBulkRestore={c.handleBulkRestore}
                onRetry={c.refetchCollections}
                onMessage={c.handleMessageCollections}
              />
            )}

            {c.effectiveTab === 'setup' && (
              <ObligationsSetupTier
                tabs={c.CONFIG_SUB_TABS}
                activeTab={c.effectiveConfigTab}
                canEditSetup={c.canEditSetup}
                obligationTypes={c.obligationTypes}
                mujtahids={c.mujtahids}
                reps={c.reps}
                wakalaTypes={c.wakalaTypes}
                distributions={c.distributions}
                onTabChange={c.setActiveConfigTab}
                onChangeTypes={(next) => c.runSetupSave(() => c.replaceTypes.mutateAsync(next))}
                onChangeMujtahids={(next) => c.runSetupSave(() => c.replaceMujtahids.mutateAsync(next))}
                onChangeReps={(next) => c.runSetupSave(() => c.replaceReps.mutateAsync(next))}
                onChangeWakala={(next) => c.runSetupSave(() => c.replaceWakala.mutateAsync(next))}
                onChangeDistributions={(next) => c.runSetupSave(() => c.replaceDistributions.mutateAsync(next))}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </ResponsiveAccordionTabs>

      <ObligationsModalLayer
        showForm={c.showForm}
        canWrite={c.canWrite}
        showDeleted={c.showDeleted}
        viewCollection={c.viewCollection}
        obligationTypes={c.obligationTypes}
        reps={c.reps}
        mujtahids={c.mujtahids}
        wakalaTypes={c.wakalaTypes}
        distributions={c.distributions}
        collections={c.collections}
        messagingTarget={c.messagingTarget}
        onSaveCollection={c.handleSaveCollection}
        onCloseForm={() => c.setShowForm(false)}
        onCloseDetail={() => c.setViewCollection(null)}
        onCloseComposer={c.closeComposer}
      />
    </ModulePageShell>
  );
}
