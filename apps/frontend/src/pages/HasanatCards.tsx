import React, { useState, useMemo } from "react";
import useTranslation from "@/hooks/useTranslation";
import useModuleTierTabs from "@/hooks/useModuleTierTabs";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Star, Package, Send, Gift, Settings, BarChart2, Layers, RotateCcw, TrendingUp } from "lucide-react";
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
import { DENOMINATIONS, STOCK_BATCHES, DISTRIBUTIONS, Denomination, StockBatch, Distribution } from '@/lib/data/hasanatData';
import { saveCollection } from "../lib/db";
import { useLiveCollection } from "../hooks/useLiveCollection";

const SUB_TABS = [
  { id: "overview",    label: "Overview",     icon: LayoutDashboard },
  { id: "stock",       label: "Stock",        icon: Package },
  { id: "distribute",  label: "Distribute",   icon: Send },
  { id: "redemptions", label: "Redemptions",  icon: Gift },
];

/**
 * Hasanat Cards management component.
 * Allows handling denominations, stock, distribution, and redemptions.
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
  const [activeTab, setActiveTab] = useState("operations");
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

  const stats = [
    { label: "Total Stock", value: totalStock, icon: Layers, color: "text-primary", bg: "bg-primary/10", border: "border-primary/10" },
    { label: "Available", value: totalRemaining, icon: Package, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
    { label: "Distributed", value: totalDistributed, icon: Star, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
    { label: "Redeemed", value: totalRedeemed, icon: Gift, color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-100" },
    { label: "Active", value: totalActive, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
    { label: "Returned", value: totalReturned, icon: RotateCcw, color: "text-muted-foreground", bg: "bg-muted", border: "border-border" },
  ];

  const effectiveTab = PAGE_TABS.find((t) => t.id === activeTab) ? activeTab : "operations";
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
      {/* Sub-tabs for Operations */}
      {effectiveTab === "operations" && (
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
          {effectiveTab === "analytics" && (
            <div className="space-y-4">
              <KPISummary category="hasanat" />
              <ModuleReports category="hasanat" />
            </div>
          )}
          {effectiveTab === "configuration" && (
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
          
          {effectiveTab === "operations" && effectiveSubTab === "overview"     && <HasanatDashboard />}
          {effectiveTab === "operations" && effectiveSubTab === "stock"         && <StockManager batches={batches} denoms={denoms} onUpdate={(b) => saveCollection("hasanat_batches", b)} />}
          {effectiveTab === "operations" && effectiveSubTab === "distribute"    && <DistributionManager distributions={distributions} denoms={denoms} batches={batches} onUpdate={(d) => saveCollection("hasanat_distributions", d)} />}
          {effectiveTab === "operations" && effectiveSubTab === "redemptions"   && <RedemptionTracker distributions={distributions} onUpdateDistributions={(d) => saveCollection("hasanat_distributions", d)} />}
          </ErrorBoundary>
        </motion.div>
      </AnimatePresence>
      </ResponsiveAccordionTabs>
    </div>
  );
}
