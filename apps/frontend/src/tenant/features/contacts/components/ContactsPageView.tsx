import { Users } from "lucide-react";
import { ModulePageShell } from "@/components/ui/ModulePageShell";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { ContactsCommandMetrics } from "@/tenant/features/contacts/components/ContactsCommandMetrics";
import ContactsDataBanner from "@/tenant/features/contacts/components/ContactsDataBanner";
import ContactsSyncConflictPanel from "@/tenant/features/contacts/components/ContactsSyncConflictPanel";
import { ContactsPageOverlays } from "@/tenant/features/contacts/components/ContactsPageOverlays";
import { ContactsPageTabPanel } from "@/tenant/features/contacts/components/ContactsPageTabPanel";
import { ContactsPageHeaderActions } from "@/tenant/features/contacts/components/ContactsPageHeaderActions";
import type { useContactsPageView } from "@/tenant/features/contacts/hooks/useContactsPageController";

type ContactsPageViewProps = ReturnType<typeof useContactsPageView>;

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
        <ContactsPageTabPanel {...tabPanelProps} />
      </ResponsiveAccordionTabs>

      <ContactsPageOverlays {...overlayProps} />
    </ModulePageShell>
  );
}
