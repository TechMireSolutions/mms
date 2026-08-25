import { Users } from "lucide-react";
import { ModulePageShell } from "@/components/ui/ModulePageShell";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { ContactsCommandMetrics } from "@/tenant/features/contacts/components/ContactsCommandMetrics";
import ContactsDataBanner from "@/tenant/features/contacts/components/ContactsDataBanner";
import ContactsSyncConflictPanel from "@/tenant/features/contacts/components/ContactsSyncConflictPanel";
import { ContactsPageOverlays } from "@/tenant/features/contacts/components/ContactsPageOverlays";
import { AnimatePresence } from "framer-motion";
import ContactsSetupTier from "@/tenant/features/contacts/components/ContactsSetupTier";
import { ContactsWorkTier } from "@/tenant/features/contacts/components/ContactsWorkTier";
import { ContactsReportsTier } from "@/tenant/features/contacts/components/ContactsReportsTier";
import { ContactsPageHeaderActions } from "@/tenant/features/contacts/components/ContactsPageHeaderActions";
import type { useContactsPageController } from "@/tenant/features/contacts/hooks/useContactsPageController";

type ContactsPageViewProps = ReturnType<typeof useContactsPageController>;

export function ContactsPageView({
  t,
  visibleTopTabs,
  effectiveTab,
  setActiveTab,
  canExport,
  canRead,
  canWrite,
  viewingDeleted,
  openingDuplicates,
  handleOpenDuplicates,
  handleExportCSV,
  handleNew,
  shownCount,
  pendingCount,
  conflictCount,
  flushing,
  flush,
  openConflictReview,
  conflictPanelOpen,
  setConflictPanelOpen,
  tabPanelProps,
  overlayProps,
}: ContactsPageViewProps): React.JSX.Element {
  return (
    <ModulePageShell
      seoTitle={t("page.contacts.seoTitle")}
      seoDescription={t("page.contacts.subtitle")}
      headerIcon={Users}
      headerTitle={t("nav.contacts")}
      headerSubtitle={t("page.contacts.subtitle")}
      headerActions={
        <ContactsPageHeaderActions
          canExport={canExport}
          canRead={canRead}
          canWrite={canWrite}
          viewingDeleted={viewingDeleted}
          openingDuplicates={openingDuplicates}
          onOpenDuplicates={() => void handleOpenDuplicates()}
          onExport={handleExportCSV}
          onAddContact={handleNew}
        />
      }
      metricsStrip={
        <ContactsCommandMetrics
          shown={shownCount}
          pendingCount={pendingCount}
          conflictCount={conflictCount}
          flushing={flushing}
          onFlushPending={() => void flush()}
          onOpenDuplicates={
            canRead && !viewingDeleted ? () => void handleOpenDuplicates() : undefined
          }
          onReviewConflicts={openConflictReview}
        />
      }
    >
      <ContactsDataBanner onReviewConflicts={openConflictReview} />

      <ContactsSyncConflictPanel
        open={conflictPanelOpen}
        onClose={() => setConflictPanelOpen(false)}
      />

      <ResponsiveAccordionTabs
        tabs={visibleTopTabs}
        activeTab={effectiveTab}
        onTabChange={setActiveTab}
        panelIdPrefix="contacts-tab"
      >
        <AnimatePresence mode="wait">
          {effectiveTab === "work" ? (
            <ContactsWorkTier {...tabPanelProps.workTierProps} />
          ) : effectiveTab === "reports" ? (
            <ContactsReportsTier />
          ) : effectiveTab === "setup" ? (
            <ContactsSetupTier {...tabPanelProps.setupTierProps} />
          ) : null}
        </AnimatePresence>
      </ResponsiveAccordionTabs>

      <ContactsPageOverlays {...overlayProps} />
    </ModulePageShell>
  );
}
