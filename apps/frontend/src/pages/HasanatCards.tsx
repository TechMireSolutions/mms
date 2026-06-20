import React, { useState, useMemo } from "react";
import useTranslation from "@/hooks/useTranslation";
import useModuleTierTabs from "@/hooks/useModuleTierTabs";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Star, Package, Send, Gift, Layers, RotateCcw, TrendingUp } from "lucide-react";
import { resolveModuleTierTab } from "@mms/shared";
import PageHeader from "../components/ui/PageHeader";
import ResponsiveAccordionTabs from "@/components/ui/ResponsiveAccordionTabs";
import SubTabBar from "@/components/ui/SubTabBar";
import useConfigSubTabs from "@/hooks/useConfigSubTabs";
import HasanatDashboard from "../components/hasanat/HasanatDashboard";
import DenominationsManager from "../components/hasanat/DenominationsManager";
import StockManager from "../components/hasanat/StockManager";
import DistributionManager from "../components/hasanat/DistributionManager";
import RedemptionTracker from "../components/hasanat/RedemptionTracker";
import HasanatSettings from "../components/hasanat/HasanatSettings";
import ModuleReports from "../components/reports/ModuleReports";
import KPISummary from "../components/reports/KPISummary";
import ErrorBoundary from "../components/ui/ErrorBoundary";
import { saveCollection } from "../lib/db";
import { useLiveCollection } from "../hooks/useLiveCollection";

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
      ...configSubTabs.map((tab) => ({ id: tab.id as "fields" | "preferences", label: tab.label })),
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
  const [configSubTab, setConfigSubTab] = useState<"denominations" | "fields" | "preferences">("denominations");
  const denoms = useLiveCollection("hasanat_denoms");
  const batches = useLiveCollection("hasanat_batches");
  const distributions = useLiveCollection("hasanat_distributions");

  const totalStock = batches.reduce((s, b) => s + b.quantity, 0);
  const totalRemaining = batches.reduce((s, b) => s + b.remaining, 0);
  const totalDistributed = distributions.reduce((s, d) => s + d.quantity, 0);
  const totalRedeemed = distributions.filter((d) => d.status === "redeemed").reduce((s, d) => s + d.quantity, 0);
  const totalReturned = distributions.filter((d) => d.status === "returned").reduce((s, d) => d.quantity + s, 0);
  const totalActive = distributions.filter((d) => d.status === "active").reduce((s, d) => d.quantity + s, 0);

  const stats = useMemo(
    () => [
      { label: t("hasanat.stats.totalStock"), value: totalStock, icon: Layers, color: "text-primary", bg: "bg-primary/10", border: "border-primary/10" },
      { label: t("hasanat.stats.available"), value: totalRemaining, icon: Package, color: "text-success", bg: "bg-success/10", border: "border-success/20" },
      { label: t("hasanat.stats.distributed"), value: totalDistributed, icon: Star, color: "text-warning", bg: "bg-warning/10", border: "border-warning/20" },
      { label: t("hasanat.stats.redeemed"), value: totalRedeemed, icon: Gift, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
      { label: t("hasanat.stats.active"), value: totalActive, icon: TrendingUp, color: "text-info", bg: "bg-info/10", border: "border-info/20" },
      { label: t("hasanat.stats.returned"), value: totalReturned, icon: RotateCcw, color: "text-muted-foreground", bg: "bg-muted", border: "border-border" },
    ],
    [t, totalStock, totalRemaining, totalDistributed, totalRedeemed, totalActive, totalReturned],
  );

  const effectiveTab = resolveModuleTierTab(
    activeTab,
    PAGE_TABS.map((tab) => tab.id),
  );
  const effectiveSubTab = SUB_TABS.find((t) => t.id === activeSubTab) ? activeSubTab : "overview";

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <title>MMS - Hasanat Reward Cards</title>
      <meta name="description" content="Configure reward points, manage card stock distribution, and trace card redemption logs." />
      <PageHeader
        icon={Star}
        title={t("nav.hasanatCards")}
        subtitle={t("page.hasanat.subtitle")}
      />

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
                onChange={(key) => setConfigSubTab(key as typeof configSubTab)}
              />
              {configSubTab === "denominations" && <DenominationsManager denoms={denoms} onUpdate={(d) => saveCollection("hasanat_denoms", d)} />}
              {configSubTab === "fields" && <HasanatSettings mode="fields" />}
              {configSubTab === "preferences" && <HasanatSettings mode="preferences" />}
            </div>
          )}
          
          {effectiveTab === "work" && effectiveSubTab === "overview"     && <HasanatDashboard />}
          {effectiveTab === "work" && effectiveSubTab === "stock"         && <StockManager batches={batches} denoms={denoms} onUpdate={(b) => saveCollection("hasanat_batches", b)} />}
          {effectiveTab === "work" && effectiveSubTab === "distribute"    && <DistributionManager distributions={distributions} denoms={denoms} batches={batches} onUpdate={(d) => saveCollection("hasanat_distributions", d)} />}
          {effectiveTab === "work" && effectiveSubTab === "redemptions"   && <RedemptionTracker distributions={distributions} onUpdateDistributions={(d) => saveCollection("hasanat_distributions", d)} />}
          </ErrorBoundary>
        </motion.div>
      </AnimatePresence>
      </ResponsiveAccordionTabs>
    </div>
  );
}
