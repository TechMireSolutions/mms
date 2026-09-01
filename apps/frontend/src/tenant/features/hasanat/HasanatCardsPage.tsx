import React, { Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Send } from 'lucide-react';
import { ModulePageShell } from '@/components/ui/ModulePageShell';
import { ResponsiveAccordionTabs } from '@/components/ui/ResponsiveAccordionTabs';
import { ActionButton } from '@/components/ui/ActionButton';
import { HasanatCommandMetrics } from '@/tenant/features/hasanat/components/HasanatCommandMetrics';
import { HasanatReportsTier } from '@/tenant/features/hasanat/components/HasanatReportsTier';
import { HasanatSetupTier } from '@/tenant/features/hasanat/components/HasanatSetupTier';
import { HasanatWorkTier } from '@/tenant/features/hasanat/components/HasanatWorkTier';
import { useHasanatCardsPageController } from '@/tenant/features/hasanat/hooks/useHasanatCardsPageController';

const MessageComposer = React.lazy(() => import('@/components/ui/MessageComposer'));

/**
 * Hasanat Cards — denominations, stock, and redemptions. Work | Reports | Setup.
 */
import { DistributionDetail } from '@/tenant/features/hasanat/components/DistributionDetail';

export default function HasanatCards() {
  const c = useHasanatCardsPageController();

  return (
    <>
    <ModulePageShell
      seoTitle={`MMS - ${c.t('nav.hasanatCards')}`}
      seoDescription={c.t('page.hasanat.subtitle')}
      headerIcon={Star}
      headerTitle={c.t('nav.hasanatCards')}
      headerSubtitle={c.t('page.hasanat.subtitle')}
      headerActions={
        c.canWrite && !c.showDeleted ? (
          <ActionButton variant="primary" icon={Send} onClick={c.openDistribute}>
            {c.t('hasanat.distributeCards')}
          </ActionButton>
        ) : undefined
      }
      metricsStrip={
        <HasanatCommandMetrics shown={c.filteredCount} />
      }
    >
      <ResponsiveAccordionTabs
        tabs={c.PAGE_TABS}
        activeTab={c.effectiveTab}
        onTabChange={c.setActiveTab}
        panelIdPrefix="hasanat-tab"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={c.effectiveTab + '-' + c.effectiveSubTab + '-' + String(c.showDeleted)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {c.effectiveTab === 'reports' && (
              <HasanatReportsTier />
            )}
            {c.effectiveTab === 'setup' && (
              <HasanatSetupTier
                tabs={c.SETUP_TABS}
                activeTab={c.effectiveConfigTab}
                canEditSetup={c.canEditSetup}
                canWrite={c.canWrite}
                denoms={c.denoms}
                onTabChange={c.setConfigSubTab}
                onUpdateDenoms={(next) => c.runHasanatSave(() => c.replaceDenoms.mutateAsync(next))}
              />
            )}

            {c.effectiveTab === 'work' && (
              <HasanatWorkTier
                tabs={c.SUB_TABS}
                activeSubTab={c.effectiveSubTab}
                showDeleted={c.showDeleted}
                listLoadFailed={c.listLoadFailed}
                canWrite={c.canWrite}
                canDelete={c.canDelete}
                canWriteMessaging={c.canWriteMessaging}
                createDistributeKey={c.createDistributeKey}
                denoms={c.denoms}
                batches={c.batches}
                distributions={c.distributions}
                distributionColumnLayout={c.distributionColumnLayout}
                redemptionColumnLayout={c.redemptionColumnLayout}
                onSubTabChange={c.setActiveSubTab}
                onToggleDeleted={() => c.setShowDeleted((prev) => !prev)}
                onRetry={c.refetchDistributions}
                onUpdateBatches={(next) => c.runHasanatSave(() => c.replaceBatches.mutateAsync(next))}
                onCreateDistribution={(distribution) => c.runHasanatSave(
                  () => c.createDistribution.mutateAsync(distribution),
                )}
                onUpdateDistribution={(distribution) => c.runHasanatSave(
                  () => c.updateDistribution.mutateAsync(distribution),
                )}
                onFilteredCountChange={c.setFilteredCount}
                onDelete={c.handleDeleteDistribution}
                onRowClick={c.setActiveDistribution}
                onRestore={c.handleRestoreDistribution}
                onBulkDelete={c.handleBulkDelete}
                onBulkRestore={c.handleBulkRestore}
                onMessage={c.handleMessageDistributions}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </ResponsiveAccordionTabs>

      {c.messagingTarget && (
        <Suspense fallback={null}>
          <MessageComposer
            channel={c.messagingTarget.channel}
            recipients={c.messagingTarget.recipients}
            onClose={c.closeComposer}
          />
        </Suspense>
      )}
    </ModulePageShell>

      <AnimatePresence>
        {c.activeDistribution && (
          <DistributionDetail
            distribution={c.activeDistribution}
            onClose={() => c.setActiveDistribution(null)}
            canDelete={c.canDelete}
            onRestore={(id) => c.handleRestoreDistribution(id)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
