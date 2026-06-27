import React, { useState, useMemo, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useModuleTierTabs } from "@/hooks/useModuleTierTabs";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Scale, ClipboardList, 
  Shield, BookOpen, Plus
} from "lucide-react";
import { resolveModuleTierTab } from "@mms/shared";
import { PageHeader } from "../components/ui/PageHeader";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { ActionButton } from "../components/ui/ActionButton";
import { ObligationsSummary as ObligationsSummaryComponent } from "../components/obligations/ObligationsSummary";
import { ObligationCollectionList } from "../components/obligations/ObligationCollectionList";
import { ObligationCollectionForm } from "../components/obligations/ObligationCollectionForm";
import { ObligationCollectionDetail } from "../components/obligations/ObligationCollectionDetail";
import { ObligationTypeManager } from "../components/obligations/ObligationTypeManager";
import { MujtahidManager } from "../components/obligations/MujtahidManager";
import { WakalaTypeManager } from "../components/obligations/WakalaTypeManager";
import { ObligationCollection
} from '@/lib/data/obligationsData';
import {
  useObligationsTypesCollection,
  useObligationsMujtahidsCollection,
  useObligationsRepsCollection,
  useObligationsWakalaCollection,
  useObligationsDistributionsCollection,
  useObligationsCollectionsCollection,
  useObligationsMutations,
} from "@/hooks/useObligationsApi";
import { ErrorBoundary } from "../components/ui/ErrorBoundary";
import { ObligationsCommandMetrics } from "../components/obligations/ObligationsCommandMetrics";
import { useObligationColumnLayout } from "@/hooks/useObligationColumnLayout";

/**
 * Obligations — Khums, Zakat, and collections. Work | Reports | Setup.
 *
 * @returns {React.ReactElement} The Obligations component.
 */
export default function Obligations() {
  const PAGE_TABS = useModuleTierTabs();
  const { t } = useTranslation();
  const CONFIG_SUB_TABS = useMemo(
    () => [
      { id: "types", label: t("obligations.types"), icon: ClipboardList },
      { id: "mujtahids", label: t("obligations.mujtahids"), icon: Shield },
      { id: "wakala", label: t("obligations.wakala"), icon: BookOpen },
    ],
    [t]
  );
  const [activeTab, setActiveTab] = useState("work");
  const [activeConfigTab, setActiveConfigTab] = useState("types");

  const obligationTypes = useObligationsTypesCollection();
  const mujtahids = useObligationsMujtahidsCollection();
  const reps = useObligationsRepsCollection();
  const wakalaTypes = useObligationsWakalaCollection();
  const distributions = useObligationsDistributionsCollection();
  const collections = useObligationsCollectionsCollection();
  const {
    replaceTypes,
    replaceMujtahids,
    replaceReps,
    replaceWakala,
    replaceDistributions,
    replaceCollections,
  } = useObligationsMutations();

  const [showForm, setShowForm] = useState(false);
  const [viewCollection, setViewCollection] = useState<ObligationCollection | null>(null);
  const [filteredCount, setFilteredCount] = useState(0);
  const columnLayout = useObligationColumnLayout();

  useEffect(() => {
    setFilteredCount(collections.length);
  }, [collections.length]);

  const handleSaveCollection = (data: ObligationCollection) => {
    const exists = collections.find((c) => c.id === data.id);
    replaceCollections.mutate(
      exists ? collections.map((c) => (c.id === data.id ? data : c)) : [data, ...collections],
    );
    setShowForm(false);
  };

  const effectiveTab = resolveModuleTierTab(
    activeTab,
    PAGE_TABS.map((tab) => tab.id),
  );
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

      <ObligationsCommandMetrics total={collections.length} shown={filteredCount} />

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

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={effectiveTab + "-" + (effectiveTab === "setup" ? effectiveConfigTab : "main")}
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

          {effectiveTab === "work" && (
            <div className="space-y-4">
              <ObligationCollectionList
                collections={collections}
                obligationTypes={obligationTypes}
                reps={reps}
                mujtahids={mujtahids}
                onAddNew={() => setShowForm(true)}
                onView={setViewCollection}
                onFilteredCountChange={setFilteredCount}
                isColumnVisible={columnLayout.isColumnVisible}
                columnCustomizer={{
                  columnRegistry: columnLayout.columnRegistry,
                  updateUserColumnLayout: columnLayout.updateUserColumnLayout,
                  labels: columnLayout.customizerLabels,
                }}
              />
            </div>
          )}

          {effectiveTab === "setup" && effectiveConfigTab === "types" && (
            <ObligationTypeManager types={obligationTypes} onChange={(t) => replaceTypes.mutate(t)} />
          )}

          {effectiveTab === "setup" && effectiveConfigTab === "mujtahids" && (
            <MujtahidManager 
              mujtahids={mujtahids} 
              reps={reps} 
              onChangeMujtahids={(m) => replaceMujtahids.mutate(m)}
              onChangeReps={(r) => replaceReps.mutate(r)}
            />
          )}

          {effectiveTab === "setup" && effectiveConfigTab === "wakala" && (
            <WakalaTypeManager
              wakalaTypes={wakalaTypes}
              distributions={distributions}
              obligationTypes={obligationTypes}
              reps={reps}
              mujtahids={mujtahids}
              onChangeWakala={(w) => replaceWakala.mutate(w)}
              onChangeDistributions={(d) => replaceDistributions.mutate(d)}
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
