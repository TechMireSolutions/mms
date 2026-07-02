import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useModuleTierTabs } from "@/tenant/hooks/useModuleTierTabs";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Star, Package, Send, Gift } from "lucide-react";
import { resolveModuleTierTab } from "@mms/shared";
import { PageHeader } from "@/components/ui/PageHeader";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { useConfigSubTabs } from "@/tenant/hooks/useConfigSubTabs";
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
  useHasanatDenomsCollection,
  useHasanatBatchesCollection,
  useHasanatDistributionsCollection,
  useHasanatMutations,
} from "@/tenant/features/hasanat/hooks/useHasanatApi";

/**
 * Hasanat Cards — denominations, stock, and redemptions. Work | Reports | Setup.
 *
 * @returns {React.ReactElement} The HasanatCards page component.
 */
export default function HasanatCards() {
  const PAGE_TABS = useModuleTierTabs();
  const configSubTabs = useConfigSubTabs();
  const { t } = useTranslation();
  const HASANAT_CONFIG_TABS = useMemo(
    () => [
      { id: "denominations" as const, label: t("hasanat.denominations") },
      ...configSubTabs.map((tab) => ({ id: tab.id as "preferences", label: tab.label })),
    ],
    [configSubTabs, t],
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
  const [activeTab, setActiveTab] = useState("work");
  const [activeSubTab, setActiveSubTab] = useState("overview");
  const [configSubTab, setConfigSubTab] = useState<"denominations" | "preferences">("denominations");
  const denoms = useHasanatDenomsCollection();
  const batches = useHasanatBatchesCollection();
  const distributions = useHasanatDistributionsCollection();
  const { replaceDenoms, replaceBatches, replaceDistributions } = useHasanatMutations();
  const [filteredCount, setFilteredCount] = useState(0);
  const distributionColumnLayout = useHasanatDistributionColumnLayout();
  const redemptionColumnLayout = useHasanatRedemptionColumnLayout();

  const effectiveTab = resolveModuleTierTab(
    activeTab,
    PAGE_TABS.map((tab) => tab.id),
  );
  const effectiveSubTab = SUB_TABS.find((tab) => tab.id === activeSubTab) ? activeSubTab : "overview";

  useEffect(() => {
    if (effectiveSubTab === 'distribute' || effectiveSubTab === 'redemptions') return;
    setFilteredCount(distributions.length);
  }, [effectiveSubTab, distributions.length]);

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <title>MMS - Hasanat Reward Cards</title>
      <meta name="description" content="Configure reward points, manage card stock distribution, and trace card redemption logs." />
      <PageHeader
        icon={Star}
        title={t("nav.hasanatCards")}
        subtitle={t("page.hasanat.subtitle")}
      />

      <HasanatCommandMetrics shown={filteredCount} />

      <ResponsiveAccordionTabs
        tabs={PAGE_TABS}
        activeTab={effectiveTab}
        onTabChange={setActiveTab}
        panelIdPrefix="hasanat-tab"
      >
      {/* Work tier sub-tabs */}
      {effectiveTab === "work" && (
        <SubTabBar
          tabs={SUB_TABS.map((tab) => ({ key: tab.id, label: tab.label }))}
          value={effectiveSubTab}
          onChange={setActiveSubTab}
        />
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={effectiveTab + "-" + effectiveSubTab}
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
                tabs={HASANAT_CONFIG_TABS.map((tab) => ({ key: tab.id, label: tab.label }))}
                value={configSubTab}
                onChange={(tabKey) => setConfigSubTab(tabKey as typeof configSubTab)}
              />
              {configSubTab === "denominations" && <DenominationsManager denoms={denoms} onUpdate={(denominations) => replaceDenoms.mutate(denominations)} />}
              {configSubTab === "preferences" && <HasanatSettings mode="preferences" />}
            </div>
          )}
          
          {effectiveTab === "work" && effectiveSubTab === "overview"     && <HasanatDashboard denoms={denoms} batches={batches} distributions={distributions} />}
          {effectiveTab === "work" && effectiveSubTab === "stock"         && <StockManager batches={batches} denoms={denoms} onUpdate={(batches) => replaceBatches.mutate(batches)} />}
          {effectiveTab === "work" && effectiveSubTab === "distribute"    && (
            <DistributionManager
              distributions={distributions}
              denoms={denoms}
              batches={batches}
              onUpdate={(distributions) => replaceDistributions.mutate(distributions)}
              onFilteredCountChange={setFilteredCount}
              isColumnVisible={distributionColumnLayout.isColumnVisible}
              columnCustomizer={{
                columnRegistry: distributionColumnLayout.columnRegistry,
                updateUserColumnLayout: distributionColumnLayout.updateUserColumnLayout,
                labels: distributionColumnLayout.customizerLabels,
              }}
            />
          )}
          {effectiveTab === "work" && effectiveSubTab === "redemptions"   && (
            <RedemptionTracker
              distributions={distributions}
              onUpdateDistributions={(distributions) => replaceDistributions.mutate(distributions)}
              onFilteredCountChange={setFilteredCount}
              isColumnVisible={redemptionColumnLayout.isColumnVisible}
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
    </div>
  );
}
