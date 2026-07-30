import { useState, useMemo, useEffect, useCallback } from 'react';
import { usePersistedTabState } from '@/hooks/usePersistedTabState';
import { useModuleCreateHotkey } from '@/hooks/useModuleCreateHotkey';
import { useTranslation } from '@/hooks/useTranslation';
import { useFilteredModuleTierTabs } from '@/tenant/hooks/useModuleTierTabs';
import { useModulePermissions } from '@/tenant/hooks/usePermissions';
import {
  OBLIGATIONS_MODULE_MANIFEST,
  resolveModuleTierTab,
  toMessagingRecipient,
  type AppTranslationKey,
  type ObligationCollection,
} from '@mms/shared';
import {
  useObligationsTypes,
  useObligationsMujtahids,
  useObligationsReps,
  useObligationsWakala,
  useObligationsDistributions,
  useObligationsCollections,
  useObligationsMutations,
  NotifiedObligationsMutationError,
} from '@/tenant/features/obligations/hooks/useObligationsApi';
import { useObligationColumnLayout } from '@/tenant/features/obligations/hooks/useObligationColumnLayout';
import { useObligationsTrashActions } from '@/tenant/features/obligations/hooks/useObligationsTrashActions';
import { useMessageComposerState } from '@/hooks/useMessageComposerState';
import { notify } from '@/lib/notify';

const SETUP_TAB_LABEL_KEYS: Record<(typeof OBLIGATIONS_MODULE_MANIFEST.setupSubTabs)[number], AppTranslationKey> = {
  types: 'obligations.types',
  mujtahids: 'obligations.mujtahids',
  wakala: 'obligations.wakala',
};

export function useObligationsPageController() {
  const { t } = useTranslation();
  const {
    canWrite,
    canDelete,
    canReports: canViewReports,
    canViewSetup,
    canEditSetup,
  } = useModulePermissions(OBLIGATIONS_MODULE_MANIFEST);
  const PAGE_TABS = useFilteredModuleTierTabs({ canViewSetup, canViewReports });
  const CONFIG_SUB_TABS = useMemo(
    () => OBLIGATIONS_MODULE_MANIFEST.setupSubTabs.map((id) => ({
      id,
      label: t(SETUP_TAB_LABEL_KEYS[id]),
    })),
    [t],
  );
  const [activeTab, setActiveTab] = usePersistedTabState<string>('obligations_active_tab', 'work');
  const [activeConfigTab, setActiveConfigTab] = useState('types');
  const [showDeleted, setShowDeleted] = useState(false);

  const typesResult = useObligationsTypes();
  const mujtahidsResult = useObligationsMujtahids();
  const repsResult = useObligationsReps();
  const wakalaResult = useObligationsWakala();
  const distributionsResult = useObligationsDistributions();
  const collectionsResult = useObligationsCollections({ includeDeleted: showDeleted });

  const obligationTypes = typesResult.syncedData;
  const mujtahids = mujtahidsResult.syncedData;
  const reps = repsResult.syncedData;
  const wakalaTypes = wakalaResult.syncedData;
  const distributions = distributionsResult.syncedData;
  const collections = collectionsResult.syncedData;

  const {
    replaceTypes,
    replaceMujtahids,
    replaceReps,
    replaceWakala,
    replaceDistributions,
    replaceCollections,
    deleteCollection,
    restoreCollection,
    bulkDeleteCollections,
    bulkRestoreCollections,
  } = useObligationsMutations();

  const [showForm, setShowForm] = useState(false);
  const [viewCollection, setViewCollection] = useState<ObligationCollection | null>(null);
  const [filteredCount, setFilteredCount] = useState(0);
  const columnLayout = useObligationColumnLayout();

  const { messagingTarget, openComposer, closeComposer, canWriteMessaging } = useMessageComposerState();

  const notifySaveFailure = useCallback((error: unknown) => {
    if (error instanceof NotifiedObligationsMutationError) return;
    notify.error(t('obligations.saveFailed'), {
      description: error instanceof Error ? error.message : String(error),
    });
  }, [t]);

  const handleMessageCollections = (channel: 'sms' | 'whatsapp' | 'email', collectionList: ObligationCollection[]) => {
    if (!canWriteMessaging) return;
    openComposer(
      channel,
      collectionList.map((collection) =>
        toMessagingRecipient(
          {
            id: collection.id,
            name: collection.receipt_no
              ? t('obligations.messaging.receipt', { receipt: collection.receipt_no })
              : t('obligations.messaging.donor'),
            phone: typeof (collection as { phone?: string }).phone === 'string'
              ? (collection as { phone?: string }).phone
              : '',
            email: typeof (collection as { email?: string }).email === 'string'
              ? (collection as { email?: string }).email
              : '',
          },
        ),
      ),
    );
  };

  useEffect(() => {
    setFilteredCount(collections.length);
  }, [collections.length]);

  useModuleCreateHotkey({
    enabled: canWrite && !showDeleted,
    onCreate: () => {
      setActiveTab('work');
      setShowForm(true);
    },
  });

  const handleSaveCollection = async (collectionPayload: ObligationCollection) => {
    try {
      const existingCollection = collections.find((collection) => collection.id === collectionPayload.id);
      await replaceCollections.mutateAsync(
        existingCollection
          ? collections.map((collection) => (collection.id === collectionPayload.id ? collectionPayload : collection))
          : [collectionPayload, ...collections],
      );
      setShowForm(false);
    } catch (error: unknown) {
      notifySaveFailure(error);
      throw error;
    }
  };

  const { handleDelete, handleRestore, handleBulkDelete, handleBulkRestore } = useObligationsTrashActions({
    t,
    deleteCollection,
    restoreCollection,
    bulkDeleteCollections,
    bulkRestoreCollections,
  });

  const runSetupSave = async (save: () => Promise<unknown>): Promise<void> => {
    try {
      await save();
    } catch (error: unknown) {
      notifySaveFailure(error);
      throw error;
    }
  };

  const effectiveTab = resolveModuleTierTab(
    activeTab,
    PAGE_TABS.map((tab) => tab.id),
  );
  const effectiveConfigTab = CONFIG_SUB_TABS.find((tab) => tab.id === activeConfigTab) ? activeConfigTab : 'types';
  const listLoadFailed = collectionsResult.queryResult.isError;

  return {
    t,
    canWrite,
    canDelete,
    canEditSetup,
    PAGE_TABS,
    CONFIG_SUB_TABS,
    activeTab,
    setActiveTab,
    effectiveTab,
    effectiveConfigTab,
    showDeleted,
    setShowDeleted,
    showForm,
    setShowForm,
    viewCollection,
    setViewCollection,
    filteredCount,
    setFilteredCount,
    columnLayout,
    messagingTarget,
    closeComposer,
    canWriteMessaging,
    obligationTypes,
    mujtahids,
    reps,
    wakalaTypes,
    distributions,
    collections,
    listLoadFailed,
    handleMessageCollections,
    handleSaveCollection,
    handleDelete,
    handleRestore,
    handleBulkDelete,
    handleBulkRestore,
    runSetupSave,
    replaceTypes,
    replaceMujtahids,
    replaceReps,
    replaceWakala,
    replaceDistributions,
    setActiveConfigTab,
    refetchCollections: () => { void collectionsResult.queryResult.refetch(); },
  };
}
