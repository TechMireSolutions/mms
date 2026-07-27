import React, { useState, useEffect, useMemo, useCallback } from "react";
import { usePersistedTabState } from "@/hooks/usePersistedTabState";
import { useTranslation } from "@/hooks/useTranslation";
import { useFilteredModuleTierTabs } from "@/tenant/hooks/useModuleTierTabs";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Star, Package, Send, Gift, Archive } from "lucide-react";
import { HASANAT_MODULE_MANIFEST, resolveModuleTierTab, type AppTranslationKey } from "@mms/shared";
import { ModulePageShell } from "@/components/ui/ModulePageShell";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/ErrorState";
import { HasanatDashboard } from "@/tenant/features/hasanat/components/HasanatDashboard";
import { DenominationsManager } from "@/tenant/features/hasanat/components/DenominationsManager";
import { StockManager } from "@/tenant/features/hasanat/components/StockManager";
import { DistributionManager } from "@/tenant/features/hasanat/components/DistributionManager";
import { RedemptionTracker } from "@/tenant/features/hasanat/components/RedemptionTracker";
import { HasanatSettings } from "@/tenant/features/hasanat/components/HasanatSettings";
import ModuleReports from "@/tenant/features/reports/components/ModuleReports";
import KPISummary from "@/tenant/features/reports/components/KPISummary";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { HasanatCommandMetrics } from "@/tenant/features/hasanat/components/HasanatCommandMetrics";
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

  const handleMessageDistributions = (channel: 'sms' | 'whatsapp' | 'email', distList: Array<{ id: string; recipientName?: string }>) => {
    if (!canWriteMessaging) return;
    openComposer(
      channel,
      distList.map((d) => ({
        id: d.id,
        name: d.recipientName || 'Recipient',
        phone: (d as unknown as { phone?: string }).phone || '',
        email: (d as unknown as { email?: string }).email || '',
      }))
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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "n" && canWrite && !showDeleted) {
        const target = event.target as HTMLElement | null;
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
          return;
        }
        event.preventDefault();
        setActiveTab("work");
        setActiveSubTab("distribute");
        setCreateDistributeKey((key) => key + 1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canWrite, setActiveTab, showDeleted]);

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

  const listLoadFailed = distributionsResult.queryResult.isError;

  return (
    <ModulePageShell
      seoTitle={`MMS - ${t("nav.hasanatCards")}`}
      seoDescription={t("page.hasanat.subtitle")}
      headerIcon={Star}
      headerTitle={t("nav.hasanatCards")}
      headerSubtitle={t("page.hasanat.subtitle")}
      headerActions={
        effectiveTab === "work" && effectiveSubTab === "distribute" && canDelete ? (
          <Button
            type="button"
            variant={showDeleted ? "default" : "outline"}
            size="sm"
            onClick={() => setShowDeleted((prev) => !prev)}
            className="gap-1.5"
          >
            <Archive className="w-3.5 h-3.5" aria-hidden="true" />
            {showDeleted ? t("hasanat.trash.showActive") : t("hasanat.trash.showDeleted")}
          </Button>
        ) : null
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
      {effectiveTab === "work" && (
        <SubTabBar
          tabs={SUB_TABS.map((tab) => ({ key: tab.id, label: tab.label }))}
          value={effectiveSubTab}
          onChange={(next) => {
            setActiveSubTab(next);
            if (next !== "distribute") setShowDeleted(false);
          }}
        />
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={effectiveTab + "-" + effectiveSubTab + "-" + String(showDeleted)}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          <ErrorBoundary>
          {effectiveTab === "reports" && (
            <div className="space-y-4">
              <KPISummary category="hasanat" />
              <ModuleReports category="hasanat" />
            </div>
          )}
          {effectiveTab === "setup" && (
            <div className="space-y-4">
              <SubTabBar
                tabs={SETUP_TABS.map((tab) => ({ key: tab.id, label: tab.label }))}
                value={effectiveConfigTab}
                onChange={setConfigSubTab}
              />
              {!canEditSetup ? (
                <p className="text-sm text-muted-foreground rounded-xl border border-border bg-muted/20 px-4 py-6">
                  {t("hasanat.setup.readOnly")}
                </p>
              ) : (
                <>
                  {effectiveConfigTab === "denominations" && (
                    <DenominationsManager
                      denoms={denoms}
                      onUpdate={async (next) => {
                        try {
                          await replaceDenoms.mutateAsync(next);
                        } catch (error: unknown) {
                          notifySaveFailure(error);
                          throw error;
                        }
                      }}
                      canWrite={canWrite}
                    />
                  )}
                  {(effectiveConfigTab === "fields" || effectiveConfigTab === "preferences") && (
                    <HasanatSettings mode={effectiveConfigTab} />
                  )}
                </>
              )}
            </div>
          )}

          {effectiveTab === "work" && listLoadFailed && (
            <ErrorState
              title={t("hasanat.loadFailed")}
              onRetry={() => { void distributionsResult.queryResult.refetch(); }}
            />
          )}

          {effectiveTab === "work" && !listLoadFailed && effectiveSubTab === "overview" && (
            <HasanatDashboard denoms={denoms} batches={batches} distributions={distributions} />
          )}
          {effectiveTab === "work" && !listLoadFailed && effectiveSubTab === "stock" && (
            <StockManager
              batches={batches}
              denoms={denoms}
              onUpdate={async (next) => {
                try {
                  await replaceBatches.mutateAsync(next);
                } catch (error: unknown) {
                  notifySaveFailure(error);
                  throw error;
                }
              }}
              canWrite={canWrite}
            />
          )}
          {effectiveTab === "work" && !listLoadFailed && effectiveSubTab === "distribute" && (
            <DistributionManager
              distributions={distributions}
              denoms={denoms}
              batches={batches}
              onUpdate={async (next) => {
                try {
                  await replaceDistributions.mutateAsync(next);
                } catch (error: unknown) {
                  notifySaveFailure(error);
                  throw error;
                }
              }}
              onFilteredCountChange={setFilteredCount}
              canWrite={canWrite}
              canDelete={canDelete}
              showDeleted={showDeleted}
              createRequestKey={createDistributeKey}
              onDelete={handleDeleteDistribution}
              onRestore={handleRestoreDistribution}
              onBulkDelete={handleBulkDelete}
              onBulkRestore={handleBulkRestore}
              isColumnVisible={distributionColumnLayout.isColumnVisible}
              getColumnWidth={distributionColumnLayout.getColumnWidth}
              onColumnResize={distributionColumnLayout.setColumnWidth}
              columnCustomizer={{
                columnRegistry: distributionColumnLayout.columnRegistry,
                updateUserColumnLayout: distributionColumnLayout.updateUserColumnLayout,
                labels: distributionColumnLayout.customizerLabels,
              }}
              onMessage={canWriteMessaging && !showDeleted ? handleMessageDistributions : undefined}
            />
          )}
          {effectiveTab === "work" && !listLoadFailed && effectiveSubTab === "redemptions" && (
            <RedemptionTracker
              distributions={distributions}
              onUpdateDistributions={async (next) => {
                try {
                  await replaceDistributions.mutateAsync(next);
                } catch (error: unknown) {
                  notifySaveFailure(error);
                  throw error;
                }
              }}
              onFilteredCountChange={setFilteredCount}
              canWrite={canWrite}
              isColumnVisible={redemptionColumnLayout.isColumnVisible}
              getColumnWidth={redemptionColumnLayout.getColumnWidth}
              onColumnResize={redemptionColumnLayout.setColumnWidth}
              columnCustomizer={{
                columnRegistry: redemptionColumnLayout.columnRegistry,
                updateUserColumnLayout: redemptionColumnLayout.updateUserColumnLayout,
                labels: redemptionColumnLayout.customizerLabels,
              }}
            />
          )}
          </ErrorBoundary>
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
