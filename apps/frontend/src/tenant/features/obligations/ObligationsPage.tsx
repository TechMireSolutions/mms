import React, { useState, useMemo, useEffect, useCallback } from "react";
import { usePersistedTabState } from "@/hooks/usePersistedTabState";
import { useModuleCreateHotkey } from "@/hooks/useModuleCreateHotkey";
import { useTranslation } from "@/hooks/useTranslation";
import { useFilteredModuleTierTabs } from "@/tenant/hooks/useModuleTierTabs";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scale, Plus,
} from "lucide-react";
import {
  OBLIGATIONS_MODULE_MANIFEST,
  resolveModuleTierTab,
  toMessagingRecipient,
  type AppTranslationKey,
  type ObligationCollection,
} from "@mms/shared";
import { ModulePageShell } from "@/components/ui/ModulePageShell";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { ActionButton } from "@/components/ui/ActionButton";
import { ErrorState } from "@/components/ui/ErrorState";
import { ObligationsSummary as ObligationsSummaryComponent } from "@/tenant/features/obligations/components/ObligationsSummary";
import { ObligationCollectionList } from "@/tenant/features/obligations/components/ObligationCollectionList";
import { ObligationCollectionForm } from "@/tenant/features/obligations/components/ObligationCollectionForm";
import { ObligationCollectionDetail } from "@/tenant/features/obligations/components/ObligationCollectionDetail";
import { ObligationTypeManager } from "@/tenant/features/obligations/components/ObligationTypeManager";
import { MujtahidManager } from "@/tenant/features/obligations/components/MujtahidManager";
import { WakalaTypeManager } from "@/tenant/features/obligations/components/WakalaTypeManager";
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
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ObligationsCommandMetrics } from "@/tenant/features/obligations/components/ObligationsCommandMetrics";
import { useObligationColumnLayout } from "@/tenant/features/obligations/hooks/useObligationColumnLayout";
import { useMessageComposerState } from "@/hooks/useMessageComposerState";
import { notify } from "@/lib/notify";

const MessageComposer = React.lazy(() => import("@/components/ui/MessageComposer"));

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
    try {
      await deleteCollection.mutateAsync(id);
      notify.success(t("obligations.trash.deleted"));
    } catch (error: unknown) {
      notify.error(t("obligations.trash.actionFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreCollection.mutateAsync(id);
      notify.success(t("obligations.trash.restored"));
    } catch (error: unknown) {
      notify.error(t("obligations.trash.actionFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      const result = await bulkDeleteCollections.mutateAsync(ids);
      if (result.failed > 0) {
        notify.warning(t("obligations.trash.bulkPartial", {
          succeeded: result.succeeded,
          failed: result.failed,
        }));
      } else {
        notify.success(t("obligations.trash.deleted"));
      }
    } catch (error: unknown) {
      notify.error(t("obligations.trash.actionFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  };

  const handleBulkRestore = async (ids: string[]) => {
    try {
      const result = await bulkRestoreCollections.mutateAsync(ids);
      if (result.failed > 0) {
        notify.warning(t("obligations.trash.bulkPartial", {
          succeeded: result.succeeded,
          failed: result.failed,
        }));
      } else {
        notify.success(t("obligations.trash.restored"));
      }
    } catch (error: unknown) {
      notify.error(t("obligations.trash.actionFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
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
        canWrite && !showDeleted ? (
          <ActionButton
            variant="primary"
            icon={Plus}
            onClick={() => setShowForm(true)}
          >
            {t("obligations.newCollection")}
          </ActionButton>
        ) : undefined
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
      {effectiveTab === "setup" && (
        <SubTabBar
          tabs={CONFIG_SUB_TABS.map((tab) => ({ key: tab.id, label: tab.label }))}
          value={effectiveConfigTab}
          onChange={setActiveConfigTab}
        />
      )}

      <AnimatePresence mode="wait">
        <motion.div key={effectiveTab + "-" + (effectiveTab === "setup" ? effectiveConfigTab : String(showDeleted))}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
          className="space-y-4">

          <ErrorBoundary>
          {effectiveTab === "reports" && (
            <ObligationsSummaryComponent
              collections={collections}
              obligationTypes={obligationTypes}
              reps={reps}
              mujtahids={mujtahids}
              wakalaTypes={wakalaTypes}
              distributions={distributions}
            />
          )}

          {effectiveTab === "work" && listLoadFailed && (
            <ErrorState
              title={t("obligations.loadFailed")}
              onRetry={() => { void collectionsResult.queryResult.refetch(); }}
            />
          )}

          {effectiveTab === "work" && !listLoadFailed && (
            <div className="space-y-4">
              <ObligationCollectionList
                collections={collections}
                obligationTypes={obligationTypes}
                reps={reps}
                mujtahids={mujtahids}
                onAddNew={() => setShowForm(true)}
                onView={setViewCollection}
                onFilteredCountChange={setFilteredCount}
                canWrite={canWrite}
                canDelete={canDelete}
                showDeleted={showDeleted}
                onToggleShowDeleted={() => setShowDeleted((prev) => !prev)}
                onDelete={handleDelete}
                onRestore={handleRestore}
                onBulkDelete={handleBulkDelete}
                onBulkRestore={handleBulkRestore}
                isColumnVisible={columnLayout.isColumnVisible}
                getColumnWidth={columnLayout.getColumnWidth}
                onColumnResize={columnLayout.setColumnWidth}
                columnCustomizer={{
                  columnRegistry: columnLayout.columnRegistry,
                  updateUserColumnLayout: columnLayout.updateUserColumnLayout,
                  labels: columnLayout.customizerLabels,
                }}
                onMessage={canWriteMessaging && !showDeleted ? handleMessageCollections : undefined}
              />
            </div>
          )}

          {effectiveTab === "setup" && !canEditSetup && (
            <p className="text-sm text-muted-foreground rounded-xl border border-border bg-muted/20 px-4 py-6">
              {t("obligations.setup.readOnly")}
            </p>
          )}

          {effectiveTab === "setup" && canEditSetup && effectiveConfigTab === "types" && (
            <ObligationTypeManager
              types={obligationTypes}
              onChange={async (next) => {
                try {
                  await replaceTypes.mutateAsync(next);
                } catch (error: unknown) {
                  notifySaveFailure(error);
                  throw error;
                }
              }}
            />
          )}

          {effectiveTab === "setup" && canEditSetup && effectiveConfigTab === "mujtahids" && (
            <MujtahidManager
              mujtahids={mujtahids}
              reps={reps}
              onChangeMujtahids={async (next) => {
                try {
                  await replaceMujtahids.mutateAsync(next);
                } catch (error: unknown) {
                  notifySaveFailure(error);
                  throw error;
                }
              }}
              onChangeReps={async (next) => {
                try {
                  await replaceReps.mutateAsync(next);
                } catch (error: unknown) {
                  notifySaveFailure(error);
                  throw error;
                }
              }}
            />
          )}

          {effectiveTab === "setup" && canEditSetup && effectiveConfigTab === "wakala" && (
            <WakalaTypeManager
              wakalaTypes={wakalaTypes}
              distributions={distributions}
              obligationTypes={obligationTypes}
              reps={reps}
              mujtahids={mujtahids}
              onChangeWakala={async (next) => {
                try {
                  await replaceWakala.mutateAsync(next);
                } catch (error: unknown) {
                  notifySaveFailure(error);
                  throw error;
                }
              }}
              onChangeDistributions={async (next) => {
                try {
                  await replaceDistributions.mutateAsync(next);
                } catch (error: unknown) {
                  notifySaveFailure(error);
                  throw error;
                }
              }}
            />
          )}
          </ErrorBoundary>
        </motion.div>
      </AnimatePresence>
      </ResponsiveAccordionTabs>

      <AnimatePresence>
        {showForm && canWrite && !showDeleted && (
          <ObligationCollectionForm
            obligationTypes={obligationTypes}
            reps={reps}
            mujtahids={mujtahids}
            wakalaTypes={wakalaTypes}
            existingCollections={collections}
            onSave={handleSaveCollection}
            onClose={() => setShowForm(false)}
          />
        )}
        {viewCollection && (
          <ObligationCollectionDetail
            collection={viewCollection}
            obligationTypes={obligationTypes}
            reps={reps}
            mujtahids={mujtahids}
            wakalaTypes={wakalaTypes}
            distributions={distributions}
            onClose={() => setViewCollection(null)}
          />
        )}
      </AnimatePresence>

      {messagingTarget && (
        <React.Suspense fallback={null}>
          <MessageComposer
            channel={messagingTarget.channel}
            recipients={messagingTarget.recipients}
            onClose={closeComposer}
          />
        </React.Suspense>
      )}
    </ModulePageShell>
  );
}
