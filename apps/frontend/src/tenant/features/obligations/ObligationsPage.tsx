import { useState, useMemo, useEffect, useCallback } from "react";
import { usePersistedTabState } from "@/hooks/usePersistedTabState";
import { useModuleCreateHotkey } from "@/hooks/useModuleCreateHotkey";
import { useTranslation } from "@/hooks/useTranslation";
import { useFilteredModuleTierTabs } from "@/tenant/hooks/useModuleTierTabs";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { motion, AnimatePresence } from "framer-motion";
import { Scale } from "lucide-react";
import {
  OBLIGATIONS_MODULE_MANIFEST,
  resolveModuleTierTab,
  toMessagingRecipient,
  type AppTranslationKey,
  type ObligationCollection,
} from "@mms/shared";
import { ModulePageShell } from "@/components/ui/ModulePageShell";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { ObligationsModalLayer } from "@/tenant/features/obligations/components/ObligationsModalLayer";
import { ObligationsPageActions } from "@/tenant/features/obligations/components/ObligationsPageActions";
import { ObligationsReportsTier } from "@/tenant/features/obligations/components/ObligationsReportsTier";
import { ObligationsSetupTier } from "@/tenant/features/obligations/components/ObligationsSetupTier";
import { ObligationsWorkTier } from "@/tenant/features/obligations/components/ObligationsWorkTier";
import {
  useObligationsTypes,
  useObligationsMujtahids,
  useObligationsReps,
  useObligationsWakala,
  useObligationsDistributions,
  useObligationsCollections,
  useObligationsMutations,
  NotifiedObligationsMutationError,
} from "@/tenant/features/obligations/hooks/useObligationsApi";
import { ObligationsCommandMetrics } from "@/tenant/features/obligations/components/ObligationsCommandMetrics";
import { useObligationColumnLayout } from "@/tenant/features/obligations/hooks/useObligationColumnLayout";
import { useMessageComposerState } from "@/hooks/useMessageComposerState";
import { notify } from "@/lib/notify";

const SETUP_TAB_LABEL_KEYS: Record<(typeof OBLIGATIONS_MODULE_MANIFEST.setupSubTabs)[number], AppTranslationKey> = {
  types: "obligations.types",
  mujtahids: "obligations.mujtahids",
  wakala: "obligations.wakala",
};

/**
 * Obligations — Khums, Zakat, and collections. Work | Reports | Setup.
 */
export default function Obligations() {
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
    [t]
  );
  const [activeTab, setActiveTab] = usePersistedTabState<string>("obligations_active_tab", "work");
  const [activeConfigTab, setActiveConfigTab] = useState("types");
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
    notify.error(t("obligations.saveFailed"), {
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
              ? t("obligations.messaging.receipt", { receipt: collection.receipt_no })
              : t("obligations.messaging.donor"),
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
      setActiveTab("work");
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

  const handleDelete = async (id: string) => {
    await runTrashAction(async () => {
      await deleteCollection.mutateAsync(id);
      notify.success(t("obligations.trash.deleted"));
    });
  };

  const handleRestore = async (id: string) => {
    await runTrashAction(async () => {
      await restoreCollection.mutateAsync(id);
      notify.success(t("obligations.trash.restored"));
    });
  };

  const handleBulkDelete = async (ids: string[]) => {
    await runTrashAction(async () => {
      const result = await bulkDeleteCollections.mutateAsync(ids);
      if (result.failed > 0) {
        notify.warning(t("obligations.trash.bulkPartial", {
          succeeded: result.succeeded,
          failed: result.failed,
        }));
      } else {
        notify.success(t("obligations.trash.deleted"));
      }
    });
  };

  const handleBulkRestore = async (ids: string[]) => {
    await runTrashAction(async () => {
      const result = await bulkRestoreCollections.mutateAsync(ids);
      if (result.failed > 0) {
        notify.warning(t("obligations.trash.bulkPartial", {
          succeeded: result.succeeded,
          failed: result.failed,
        }));
      } else {
        notify.success(t("obligations.trash.restored"));
      }
    });
  };

  const runTrashAction = async (action: () => Promise<void>): Promise<void> => {
    try {
      await action();
    } catch (error: unknown) {
      notify.error(t("obligations.trash.actionFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  };

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
  const effectiveConfigTab = CONFIG_SUB_TABS.find((tab) => tab.id === activeConfigTab) ? activeConfigTab : "types";
  const listLoadFailed = collectionsResult.queryResult.isError;

  return (
    <ModulePageShell
      seoTitle={`MMS - ${t("nav.obligations")}`}
      seoDescription={t("page.obligations.subtitle")}
      headerIcon={Scale}
      headerTitle={t("nav.obligations")}
      headerSubtitle={t("page.obligations.subtitle")}
      headerActions={
        <ObligationsPageActions
          canWrite={canWrite}
          showDeleted={showDeleted}
          onCreate={() => setShowForm(true)}
        />
      }
      metricsStrip={
        <ObligationsCommandMetrics total={collections.length} shown={filteredCount} />
      }
    >
      <ResponsiveAccordionTabs
        tabs={PAGE_TABS}
        activeTab={effectiveTab}
        onTabChange={setActiveTab}
        panelIdPrefix="obligations-tab"
      >
      <AnimatePresence mode="wait">
        <motion.div key={effectiveTab + "-" + (effectiveTab === "setup" ? effectiveConfigTab : String(showDeleted))}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
          className="space-y-4">

          {effectiveTab === "reports" && (
            <ObligationsReportsTier
              collections={collections}
              obligationTypes={obligationTypes}
              reps={reps}
              mujtahids={mujtahids}
              wakalaTypes={wakalaTypes}
              distributions={distributions}
            />
          )}

          {effectiveTab === "work" && (
            <ObligationsWorkTier
              collections={collections}
              obligationTypes={obligationTypes}
              reps={reps}
              mujtahids={mujtahids}
              listLoadFailed={listLoadFailed}
              canWrite={canWrite}
              canDelete={canDelete}
              showDeleted={showDeleted}
              canWriteMessaging={canWriteMessaging}
              columnLayout={columnLayout}
              onAddNew={() => setShowForm(true)}
              onView={setViewCollection}
              onFilteredCountChange={setFilteredCount}
              onToggleShowDeleted={() => setShowDeleted((prev) => !prev)}
              onDelete={handleDelete}
              onRestore={handleRestore}
              onBulkDelete={handleBulkDelete}
              onBulkRestore={handleBulkRestore}
              onRetry={() => { void collectionsResult.queryResult.refetch(); }}
              onMessage={handleMessageCollections}
            />
          )}

          {effectiveTab === "setup" && (
            <ObligationsSetupTier
              tabs={CONFIG_SUB_TABS}
              activeTab={effectiveConfigTab}
              canEditSetup={canEditSetup}
              obligationTypes={obligationTypes}
              mujtahids={mujtahids}
              reps={reps}
              wakalaTypes={wakalaTypes}
              distributions={distributions}
              onTabChange={setActiveConfigTab}
              onChangeTypes={(next) => runSetupSave(() => replaceTypes.mutateAsync(next))}
              onChangeMujtahids={(next) => runSetupSave(() => replaceMujtahids.mutateAsync(next))}
              onChangeReps={(next) => runSetupSave(() => replaceReps.mutateAsync(next))}
              onChangeWakala={(next) => runSetupSave(() => replaceWakala.mutateAsync(next))}
              onChangeDistributions={(next) => runSetupSave(() => replaceDistributions.mutateAsync(next))}
            />
          )}
        </motion.div>
      </AnimatePresence>
      </ResponsiveAccordionTabs>

      <ObligationsModalLayer
        showForm={showForm}
        canWrite={canWrite}
        showDeleted={showDeleted}
        viewCollection={viewCollection}
        obligationTypes={obligationTypes}
        reps={reps}
        mujtahids={mujtahids}
        wakalaTypes={wakalaTypes}
        distributions={distributions}
        collections={collections}
        messagingTarget={messagingTarget}
        onSaveCollection={handleSaveCollection}
        onCloseForm={() => setShowForm(false)}
        onCloseDetail={() => setViewCollection(null)}
        onCloseComposer={closeComposer}
      />
    </ModulePageShell>
  );
}
