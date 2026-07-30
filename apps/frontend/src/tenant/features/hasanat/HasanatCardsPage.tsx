import React, { useState, useEffect, useMemo, useCallback } from "react";
import { usePersistedTabState } from "@/hooks/usePersistedTabState";
import { useModuleCreateHotkey } from "@/hooks/useModuleCreateHotkey";
import { useTranslation } from "@/hooks/useTranslation";
import { useFilteredModuleTierTabs } from "@/tenant/hooks/useModuleTierTabs";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Star, Package, Send, Gift } from "lucide-react";
import { HASANAT_MODULE_MANIFEST, resolveModuleTierTab, toMessagingRecipient, type AppTranslationKey } from "@mms/shared";
import { ModulePageShell } from "@/components/ui/ModulePageShell";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { ActionButton } from "@/components/ui/ActionButton";
import { HasanatCommandMetrics } from "@/tenant/features/hasanat/components/HasanatCommandMetrics";
import { HasanatReportsTier } from "@/tenant/features/hasanat/components/HasanatReportsTier";
import { HasanatSetupTier } from "@/tenant/features/hasanat/components/HasanatSetupTier";
import { HasanatWorkTier } from "@/tenant/features/hasanat/components/HasanatWorkTier";
import { useHasanatDistributionColumnLayout } from "@/tenant/features/hasanat/hooks/useHasanatDistributionColumnLayout";
import { useHasanatRedemptionColumnLayout } from "@/tenant/features/hasanat/hooks/useHasanatRedemptionColumnLayout";
import {
  useHasanatDenoms,
  useHasanatBatches,
  useHasanatDistributions,
  useHasanatMutations,
  NotifiedHasanatMutationError,
} from "@/tenant/features/hasanat/hooks/useHasanatApi";
import { useMessageComposerState } from "@/hooks/useMessageComposerState";
import { notify } from "@/lib/notify";

const MessageComposer = React.lazy(() => import("@/components/ui/MessageComposer"));

const SETUP_TAB_LABEL_KEYS: Record<(typeof HASANAT_MODULE_MANIFEST.setupSubTabs)[number], AppTranslationKey> = {
  denominations: "hasanat.setup.denominations",
  fields: "hasanat.setup.fields",
  preferences: "hasanat.setup.preferences",
};

/**
 * Hasanat Cards — denominations, stock, and redemptions. Work | Reports | Setup.
 */
export default function HasanatCards() {
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
      { id: "overview" as const, label: t("hasanat.tabs.overview"), icon: LayoutDashboard },
      { id: "stock" as const, label: t("hasanat.tabs.stock"), icon: Package },
      { id: "distribute" as const, label: t("hasanat.tabs.distribute"), icon: Send },
      { id: "redemptions" as const, label: t("hasanat.tabs.redemptions"), icon: Gift },
    ],
    [t],
  );
  const [activeTab, setActiveTab] = usePersistedTabState<string>("hasanat_active_tab", "work");
  const [activeSubTab, setActiveSubTab] = useState("overview");
  const [configSubTab, setConfigSubTab] = useState<string>("denominations");
  const [showDeleted, setShowDeleted] = useState(false);
  const [createDistributeKey, setCreateDistributeKey] = useState(0);

  const denomsResult = useHasanatDenoms();
  const batchesResult = useHasanatBatches();
  const distributionsResult = useHasanatDistributions({ includeDeleted: showDeleted });
  const denoms = denomsResult.syncedData;
  const batches = batchesResult.syncedData;
  const distributions = distributionsResult.syncedData;

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

  const notifySaveFailure = useCallback((error: unknown) => {
    if (error instanceof NotifiedHasanatMutationError) return;
    notify.error(t("hasanat.saveFailed"), {
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
          name: distribution.recipientName || t("hasanat.messaging.recipient"),
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
  const effectiveSubTab = SUB_TABS.find((tab) => tab.id === activeSubTab) ? activeSubTab : "overview";
  const effectiveConfigTab = SETUP_TABS.find((tab) => tab.id === configSubTab)?.id ?? "denominations";

  useEffect(() => {
    if (effectiveSubTab === 'distribute' || effectiveSubTab === 'redemptions') return;
    setFilteredCount(distributions.length);
  }, [effectiveSubTab, distributions.length]);

  useModuleCreateHotkey({
    enabled: canWrite && !showDeleted,
    onCreate: () => {
      setActiveTab("work");
      setActiveSubTab("distribute");
      setCreateDistributeKey((key) => key + 1);
    },
  });

  const handleDeleteDistribution = async (id: string) => {
    try {
      await deleteDistribution.mutateAsync(id);
      notify.success(t("hasanat.trash.deleted"));
    } catch (error: unknown) {
      notify.error(t("hasanat.trash.actionFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  };

  const handleRestoreDistribution = async (id: string) => {
    try {
      await restoreDistribution.mutateAsync(id);
      notify.success(t("hasanat.trash.restored"));
    } catch (error: unknown) {
      notify.error(t("hasanat.trash.actionFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      const result = await bulkDeleteDistributions.mutateAsync(ids);
      if (result.failed > 0) {
        notify.warning(t("hasanat.trash.bulkPartial", {
          succeeded: result.succeeded,
          failed: result.failed,
        }));
      } else {
        notify.success(t("hasanat.trash.deleted"));
      }
    } catch (error: unknown) {
      notify.error(t("hasanat.trash.actionFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  };

  const handleBulkRestore = async (ids: string[]) => {
    try {
      const result = await bulkRestoreDistributions.mutateAsync(ids);
      if (result.failed > 0) {
        notify.warning(t("hasanat.trash.bulkPartial", {
          succeeded: result.succeeded,
          failed: result.failed,
        }));
      } else {
        notify.success(t("hasanat.trash.restored"));
      }
    } catch (error: unknown) {
      notify.error(t("hasanat.trash.actionFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  };

  const runHasanatSave = async (save: () => Promise<unknown>): Promise<void> => {
    try {
      await save();
    } catch (error: unknown) {
      notifySaveFailure(error);
      throw error;
    }
  };

  const listLoadFailed = distributionsResult.queryResult.isError;

  return (
    <ModulePageShell
      seoTitle={`MMS - ${t("nav.hasanatCards")}`}
      seoDescription={t("page.hasanat.subtitle")}
      headerIcon={Star}
      headerTitle={t("nav.hasanatCards")}
      headerSubtitle={t("page.hasanat.subtitle")}
      headerActions={
        canWrite && !showDeleted ? (
          <ActionButton
            variant="primary"
            icon={Send}
            onClick={() => {
              setActiveTab("work");
              setActiveSubTab("distribute");
              setCreateDistributeKey((key) => key + 1);
            }}
          >
            {t("hasanat.distributeCards")}
          </ActionButton>
        ) : undefined
      }
      metricsStrip={
        <HasanatCommandMetrics shown={filteredCount} />
      }
    >
      <ResponsiveAccordionTabs
        tabs={PAGE_TABS}
        activeTab={effectiveTab}
        onTabChange={setActiveTab}
        panelIdPrefix="hasanat-tab"
      >
      <AnimatePresence mode="wait">
        <motion.div
          key={effectiveTab + "-" + effectiveSubTab + "-" + String(showDeleted)}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          {effectiveTab === "reports" && (
            <HasanatReportsTier />
          )}
          {effectiveTab === "setup" && (
            <HasanatSetupTier
              tabs={SETUP_TABS}
              activeTab={effectiveConfigTab}
              canEditSetup={canEditSetup}
              canWrite={canWrite}
              denoms={denoms}
              onTabChange={setConfigSubTab}
              onUpdateDenoms={(next) => runHasanatSave(() => replaceDenoms.mutateAsync(next))}
            />
          )}

          {effectiveTab === "work" && (
            <HasanatWorkTier
              tabs={SUB_TABS}
              activeSubTab={effectiveSubTab}
              showDeleted={showDeleted}
              listLoadFailed={listLoadFailed}
              canWrite={canWrite}
              canDelete={canDelete}
              canWriteMessaging={canWriteMessaging}
              createDistributeKey={createDistributeKey}
              denoms={denoms}
              batches={batches}
              distributions={distributions}
              distributionColumnLayout={distributionColumnLayout}
              redemptionColumnLayout={redemptionColumnLayout}
              onSubTabChange={setActiveSubTab}
              onToggleDeleted={() => setShowDeleted((prev) => !prev)}
              onRetry={() => { void distributionsResult.queryResult.refetch(); }}
              onUpdateBatches={(next) => runHasanatSave(() => replaceBatches.mutateAsync(next))}
              onUpdateDistributions={(next) => runHasanatSave(() => replaceDistributions.mutateAsync(next))}
              onFilteredCountChange={setFilteredCount}
              onDelete={handleDeleteDistribution}
              onRestore={handleRestoreDistribution}
              onBulkDelete={handleBulkDelete}
              onBulkRestore={handleBulkRestore}
              onMessage={handleMessageDistributions}
            />
          )}
        </motion.div>
      </AnimatePresence>
      </ResponsiveAccordionTabs>

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
