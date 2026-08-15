import { useState, useEffect, useMemo, useCallback } from 'react';
import { usePersistedTabState } from '@/hooks/usePersistedTabState';
import { useModuleCreateHotkey } from '@/hooks/useModuleCreateHotkey';
import { useTranslation } from '@/hooks/useTranslation';
import { useFilteredModuleTierTabs } from '@/tenant/hooks/useModuleTierTabs';
import { useModulePermissions } from '@/tenant/hooks/usePermissions';
import { LayoutDashboard, Package, Send, Gift } from 'lucide-react';
import { HASANAT_MODULE_MANIFEST, resolveModuleTierTab, toMessagingRecipient, type AppTranslationKey } from '@mms/shared';
import { useHasanatDistributionColumnLayout } from '@/tenant/features/hasanat/hooks/useHasanatDistributionColumnLayout';
import { useHasanatRedemptionColumnLayout } from '@/tenant/features/hasanat/hooks/useHasanatRedemptionColumnLayout';
import {
  useHasanatDenoms,
  useHasanatBatches,
  useHasanatDistributions,
  useHasanatMutations,
  NotifiedHasanatMutationError,
} from '@/tenant/features/hasanat/hooks/useHasanatApi';
import { useHasanatDistributionTrashActions } from '@/tenant/features/hasanat/hooks/useHasanatDistributionTrashActions';
import { useMessageComposerState } from '@/hooks/useMessageComposerState';
import { notify } from '@/lib/notify';

const SETUP_TAB_LABEL_KEYS: Record<(typeof HASANAT_MODULE_MANIFEST.setupSubTabs)[number], AppTranslationKey> = {
  denominations: 'hasanat.setup.denominations',
  preferences: 'hasanat.setup.preferences',
};

export function useHasanatCardsPageController() {
  const { t } = useTranslation();
  const {
    canWrite,
    canDelete,
    canReports: canViewReports,
    canViewSetup,
    canEditSetup,
  } = useModulePermissions(HASANAT_MODULE_MANIFEST);
  const PAGE_TABS = useFilteredModuleTierTabs({ canViewSetup, canViewReports });
  const SETUP_TABS = useMemo(
    () => HASANAT_MODULE_MANIFEST.setupSubTabs.map((id) => ({
      id,
      label: t(SETUP_TAB_LABEL_KEYS[id]),
    })),
    [t],
  );
  const SUB_TABS = useMemo(
    () => [
      { id: 'overview' as const, label: t('hasanat.tabs.overview'), icon: LayoutDashboard },
      { id: 'stock' as const, label: t('hasanat.tabs.stock'), icon: Package },
      { id: 'distribute' as const, label: t('hasanat.tabs.distribute'), icon: Send },
      { id: 'redemptions' as const, label: t('hasanat.tabs.redemptions'), icon: Gift },
    ],
    [t],
  );
  const [activeTab, setActiveTab] = usePersistedTabState<string>('hasanat_active_tab', 'work');
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [configSubTab, setConfigSubTab] = useState<string>('denominations');
  const [showDeleted, setShowDeleted] = useState(false);
  const [createDistributeKey, setCreateDistributeKey] = useState(0);

  const denomsResult = useHasanatDenoms();
  const batchesResult = useHasanatBatches();
  const distributionsResult = useHasanatDistributions({ includeDeleted: showDeleted });
  const denoms = denomsResult.data ?? [];
  const batches = batchesResult.data ?? [];
  const distributions = distributionsResult.data ?? [];

  const {
    replaceDenoms,
    replaceBatches,
    replaceDistributions,
    deleteDistribution,
    restoreDistribution,
    bulkDeleteDistributions,
    bulkRestoreDistributions,
  } = useHasanatMutations();
  const [filteredCount, setFilteredCount] = useState(0);
  const distributionColumnLayout = useHasanatDistributionColumnLayout();
  const redemptionColumnLayout = useHasanatRedemptionColumnLayout();

  const { messagingTarget, openComposer, closeComposer, canWriteMessaging } = useMessageComposerState();

  const {
    handleDeleteDistribution,
    handleRestoreDistribution,
    handleBulkDelete,
    handleBulkRestore,
  } = useHasanatDistributionTrashActions({
    deleteDistribution,
    restoreDistribution,
    bulkDeleteDistributions,
    bulkRestoreDistributions,
  });

  const notifySaveFailure = useCallback((error: unknown) => {
    if (error instanceof NotifiedHasanatMutationError) return;
    notify.error(t('hasanat.saveFailed'), {
      description: error instanceof Error ? error.message : String(error),
    });
  }, [t]);

  const handleMessageDistributions = (channel: 'sms' | 'whatsapp' | 'email', distList: Array<{ id: string; recipientName?: string; phone?: string; email?: string }>) => {
    if (!canWriteMessaging) return;
    openComposer(
      channel,
      distList.map((distribution) =>
        toMessagingRecipient({
          id: distribution.id,
          name: distribution.recipientName || t('hasanat.messaging.recipient'),
          phone: distribution.phone || '',
          email: distribution.email || '',
        }),
      ),
    );
  };

  const effectiveTab = resolveModuleTierTab(
    activeTab,
    PAGE_TABS.map((tab) => tab.id),
  );
  const effectiveSubTab = SUB_TABS.find((tab) => tab.id === activeSubTab) ? activeSubTab : 'overview';
  const effectiveConfigTab = SETUP_TABS.find((tab) => tab.id === configSubTab)?.id ?? 'denominations';

  useEffect(() => {
    if (effectiveSubTab === 'distribute' || effectiveSubTab === 'redemptions') return;
    setFilteredCount(distributions.length);
  }, [effectiveSubTab, distributions.length]);

  useModuleCreateHotkey({
    enabled: canWrite && !showDeleted,
    onCreate: () => {
      setActiveTab('work');
      setActiveSubTab('distribute');
      setCreateDistributeKey((key) => key + 1);
    },
  });

  const runHasanatSave = async (save: () => Promise<unknown>): Promise<void> => {
    try {
      await save();
    } catch (error: unknown) {
      notifySaveFailure(error);
      throw error;
    }
  };

  const listLoadFailed = distributionsResult.isError;

  const openDistribute = () => {
    setActiveTab('work');
    setActiveSubTab('distribute');
    setCreateDistributeKey((key) => key + 1);
  };

  return {
    t,
    canWrite,
    canDelete,
    canEditSetup,
    PAGE_TABS,
    SETUP_TABS,
    SUB_TABS,
    activeTab,
    setActiveTab,
    effectiveTab,
    effectiveSubTab,
    effectiveConfigTab,
    showDeleted,
    setShowDeleted,
    createDistributeKey,
    filteredCount,
    setFilteredCount,
    distributionColumnLayout,
    redemptionColumnLayout,
    messagingTarget,
    closeComposer,
    canWriteMessaging,
    denoms,
    batches,
    distributions,
    listLoadFailed,
    setActiveSubTab,
    setConfigSubTab,
    handleMessageDistributions,
    handleDeleteDistribution,
    handleRestoreDistribution,
    handleBulkDelete,
    handleBulkRestore,
    runHasanatSave,
    replaceDenoms,
    replaceBatches,
    replaceDistributions,
    openDistribute,
    refetchDistributions: () => { void distributionsResult.refetch(); },
  };
}
