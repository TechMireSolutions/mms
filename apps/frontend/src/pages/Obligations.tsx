import React, { useState, useMemo } from "react";
import useTranslation from "@/hooks/useTranslation";
import useModuleTierTabs from "@/hooks/useModuleTierTabs";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Scale, ClipboardList, History, 
  Shield, BookOpen, BarChart2, Plus
} from "lucide-react";
import { resolveModuleTierTab } from "@mms/shared";
import PageHeader from "../components/ui/PageHeader";
import ResponsiveAccordionTabs from "@/components/ui/ResponsiveAccordionTabs";
import SubTabBar from "@/components/ui/SubTabBar";
import ActionButton from "../components/ui/ActionButton";
import ObligationsSummaryComponent from "../components/obligations/ObligationsSummary";
import ObligationCollectionList from "../components/obligations/ObligationCollectionList";
import ObligationCollectionForm from "../components/obligations/ObligationCollectionForm";
import ObligationCollectionDetail from "../components/obligations/ObligationCollectionDetail";
import ObligationTypeManager from "../components/obligations/ObligationTypeManager";
import MujtahidManager from "../components/obligations/MujtahidManager";
import WakalaTypeManager from "../components/obligations/WakalaTypeManager";
import { ObligationCollection
} from '@/lib/data/obligationsData';
import { saveCollection } from "../lib/db";
import { useLiveCollection } from "../hooks/useLiveCollection";
import ErrorBoundary from "../components/ui/ErrorBoundary";

/**
 * Obligations — Khums, Zakat, and collections. Work | Reports | Setup.
 *
 * @returns {React.ReactElement} The Obligations component.
 */
export default function Obligations() {
  const PAGE_TABS = useModuleTierTabs();
  const { t } = useTranslation();
  const OPS_SUB_TABS = useMemo(
    () => [
      { id: "summary", label: t("obligations.summary"), icon: BarChart2 },
      { id: "collections", label: t("obligations.collections"), icon: History },
    ],
    [t]
  );
  const CONFIG_SUB_TABS = useMemo(
    () => [
      { id: "types", label: t("obligations.types"), icon: ClipboardList },
      { id: "mujtahids", label: t("obligations.mujtahids"), icon: Shield },
      { id: "wakala", label: t("obligations.wakala"), icon: BookOpen },
    ],
    [t]
  );
  const [activeTab, setActiveTab] = useState("work");
  const [activeSubTab, setActiveSubTab] = useState("summary");
  const [activeConfigTab, setActiveConfigTab] = useState("types");

  const obligationTypes = useLiveCollection("obligation_types");
  const mujtahids = useLiveCollection("mujtahids");
  const reps = useLiveCollection("mujtahid_reps");
  const wakalaTypes = useLiveCollection("wakala_types");
  const distributions = useLiveCollection("obligation_distributions");
  const collections = useLiveCollection("obligation_collections");

  const [showForm, setShowForm] = useState(false);
  const [viewCollection, setViewCollection] = useState<ObligationCollection | null>(null);

  const totalAmount = collections.reduce((s, c) => s + Number(c.amount || 0), 0);

  const handleSaveCollection = (data: ObligationCollection) => {
    const exists = collections.find((c) => c.id === data.id);
    saveCollection(
      "obligation_collections",
      exists ? collections.map((c) => (c.id === data.id ? data : c)) : [data, ...collections],
    );
    setShowForm(false);
  };

  const effectiveTab = resolveModuleTierTab(
    activeTab,
    PAGE_TABS.map((tab) => tab.id),
  );
  const effectiveSubTab = OPS_SUB_TABS.find((t) => t.id === activeSubTab) ? activeSubTab : "summary";
  const effectiveConfigTab = CONFIG_SUB_TABS.find((t) => t.id === activeConfigTab) ? activeConfigTab : "types";

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <title>MMS - Obligations & Wakala</title>
      <meta name="description" content="Manage Mujtahid configurations, Wakala settings, and obligation collection tracking." />
      <PageHeader
        icon={Scale}
        title={t("nav.obligations")}
        subtitle={t("page.obligations.subtitle")}
        actions={
          <ActionButton
            variant="primary"
            icon={Plus}
            onClick={() => setShowForm(true)}
          >
            {t("obligations.newCollection")}
          </ActionButton>
        }
      />

      <ResponsiveAccordionTabs
        tabs={PAGE_TABS}
        activeTab={effectiveTab}
        onTabChange={setActiveTab}
        panelIdPrefix="obligations-tab"
      >
      {/* Work tier sub-tabs */}
      {effectiveTab === "work" && (
        <SubTabBar
          tabs={OPS_SUB_TABS.map((tab) => ({ key: tab.id, label: tab.label }))}
          value={effectiveSubTab}
          onChange={setActiveSubTab}
        />
      )}

      {effectiveTab === "setup" && (
        <SubTabBar
          tabs={CONFIG_SUB_TABS.map((tab) => ({ key: tab.id, label: tab.label }))}
          value={effectiveConfigTab}
          onChange={setActiveConfigTab}
        />
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={effectiveTab + "-" + (effectiveTab === "work" ? effectiveSubTab : (effectiveTab === "setup" ? effectiveConfigTab : "main"))}
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

          {effectiveTab === "work" && effectiveSubTab === "summary" && (
            <ObligationsSummaryComponent
              collections={collections}
              obligationTypes={obligationTypes}
              reps={reps}
              mujtahids={mujtahids}
              wakalaTypes={wakalaTypes}
              distributions={distributions}
            />
          )}

          {effectiveTab === "work" && effectiveSubTab === "collections" && (
            <div className="space-y-4">
              <ObligationCollectionList
                collections={collections}
                obligationTypes={obligationTypes}
                reps={reps}
                mujtahids={mujtahids}
                onAddNew={() => setShowForm(true)}
                onView={setViewCollection}
              />
            </div>
          )}

          {effectiveTab === "setup" && effectiveConfigTab === "types" && (
            <ObligationTypeManager types={obligationTypes} onChange={(t) => saveCollection("obligation_types", t)} />
          )}

          {effectiveTab === "setup" && effectiveConfigTab === "mujtahids" && (
            <MujtahidManager 
              mujtahids={mujtahids} 
              reps={reps} 
              onChangeMujtahids={(m) => saveCollection("mujtahids", m)}
              onChangeReps={(r) => saveCollection("mujtahid_reps", r)}
            />
          )}

          {effectiveTab === "setup" && effectiveConfigTab === "wakala" && (
            <WakalaTypeManager
              wakalaTypes={wakalaTypes}
              distributions={distributions}
              obligationTypes={obligationTypes}
              reps={reps}
              mujtahids={mujtahids}
              onChangeWakala={(w) => saveCollection("wakala_types", w)}
              onChangeDistributions={(d) => saveCollection("obligation_distributions", d)}
            />
          )}
          </ErrorBoundary>
        </motion.div>
      </AnimatePresence>
      </ResponsiveAccordionTabs>

      <AnimatePresence>
        {showForm && (
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
    </div>
  );
}
