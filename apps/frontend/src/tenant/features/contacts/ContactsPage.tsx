import React, { useMemo, lazy, Suspense, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, AlertTriangle, Download, Users, Loader2 } from "lucide-react";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { CONTACTS_MODULE_MANIFEST } from "@mms/shared";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { useContactsPageState } from "@/tenant/features/contacts/hooks/useContactsPageState";
import { useContactConfig, useContactColumns } from "@/lib/contexts/ContactConfigContext";
import ModuleReports from "@/tenant/features/reports/components/ModuleReports";
import KPISummary from "@/tenant/features/reports/components/KPISummary";
import { ModulePageShell } from "@/components/ui/ModulePageShell";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { ActionButton } from "@/components/ui/ActionButton";
import { ContactsCommandMetrics } from "@/tenant/features/contacts/components/ContactsCommandMetrics";
import ContactsDataBanner from "@/tenant/features/contacts/components/ContactsDataBanner";
import ContactsSyncConflictPanel from "@/tenant/features/contacts/components/ContactsSyncConflictPanel";
import { ContactsWorkDirectory } from "@/tenant/features/contacts/components/ContactsWorkDirectory";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { useGoogleContactsOAuthListener } from "@/lib/contacts/googleContactsOAuthListener";

import ContactsSettingsPanel from "@/tenant/features/contacts/components/ContactsSettingsPanel";

const ContactForm = lazy(() => import("@/tenant/features/contacts/components/ContactForm"));
const DuplicateDetection = lazy(() => import("@/tenant/features/contacts/components/DuplicateDetection"));
const MessageComposer = lazy(() => import("@/components/ui/MessageComposer"));
const ContactDetailDrawer = lazy(() => import("@/tenant/features/contacts/components/ContactDetailDrawer"));


function ContactsInner() {
  const {
    canWrite,
    canDelete,
    canExport,
    canReports: canViewReports,
    canViewSetup,
    canEditSetup,
  } = useModulePermissions(CONTACTS_MODULE_MANIFEST);
  const bulkActions = CONTACTS_MODULE_MANIFEST.work.bulkActions;
  const { prefs } = useContactConfig();
  const tableColumns = useContactColumns();

  const state = useContactsPageState({
    prefs,
    tableColumns,
    canWrite,
    canDelete,
    canExport,
    canViewReports,
    canViewSetup,
  });

  const {
    t,
    visibleTopTabs,
    effectiveTab,
    setActiveTab,
    contacts,
    search,
    setSearch,
    filterGender,
    setFilterGender,
    quickFilter,
    setQuickFilter,
    sortField,
    sortDir,
    selected,
    setSelected,
    showForm,
    setShowForm,
    editContact,
    setEditContact,
    viewContact,
    setViewContact,
    showDuplicates,
    setShowDuplicates,
    messagingTarget,
    closeComposer,
    handleWhatsApp,
    handleSms,
    handleEmail,
    canWriteMessaging,
    hasActiveFilters,
    activeFilterCount,
    defaultCountry,
    defaultCity,
    defaultProvince,
    handleSort,
    handleSelect,
    handleSelectAll,
    handleEdit,
    handleNew,
    handleSave,
    handleDelete,
    confirmSingleDelete,
    deleteTarget,
    setDeleteTarget,
    handleUpdateContact,
    handleExportCSV,
    handleBulkExport,
    requestBulkDelete,
    confirmBulkDelete,
    bulkDeleteOpen,
    setBulkDeleteOpen,
    requestBulkRestore,
    confirmBulkRestore,
    bulkRestoreOpen,
    setBulkRestoreOpen,
    clearFilters,
    handleImport,
    handleMerge,
    handleRestore,
    viewModeOverride,
    setViewModeOverride,
    conflictPanelOpen,
    setConflictPanelOpen,
    openConflictReview,
    openingDuplicates,
    handleOpenDuplicates,
    showDeletedArchives: viewingDeleted,
    setShowDeletedArchives,
    needsFullContactsList,
    useServerWork,
    workPageData,
    isWorkLoading,
    isWorkError,
    refetchWork,
    isWorkFetching,
    setListPage,
    workContacts,
    allContactsForLinks,
    selectedTargets,
    shownCount,
    workTruncated,
    pendingCount,
    conflictCount,
    flushing,
    flush,
  } = state;

  useGoogleContactsOAuthListener(useCallback(() => {
    setActiveTab("setup");
  }, [setActiveTab]));

  const messagingHandlers = useMemo(() => {
    if (!canWriteMessaging || viewingDeleted) {
      return { onWhatsApp: undefined, onSms: undefined, onEmail: undefined };
    }
    return { onWhatsApp: handleWhatsApp, onSms: handleSms, onEmail: handleEmail };
  }, [canWriteMessaging, viewingDeleted, handleWhatsApp, handleSms, handleEmail]);

  const commonDirectoryProps = useMemo(() => ({
    contacts: workContacts,
    selected,
    onSelect: handleSelect,
    onSelectAll: handleSelectAll,
    onView: setViewContact,
    onEdit: handleEdit,
    onDelete: handleDelete,
    onRestore: handleRestore,
    showArchived: viewingDeleted,
    ...messagingHandlers,
    allContacts: allContactsForLinks,
    onUpdateContact: handleUpdateContact,
    canWrite,
    canDelete,
    columns: tableColumns,
    allSelected: workContacts.length > 0 && selected.length === workContacts.length,
  }), [
    workContacts,
    selected,
    handleSelect,
    handleSelectAll,
    setViewContact,
    handleEdit,
    handleDelete,
    handleRestore,
    viewingDeleted,
    messagingHandlers,
    allContactsForLinks,
    handleUpdateContact,
    canWrite,
    canDelete,
    tableColumns,
  ]);

  const tableProps = useMemo(() => ({
    ...commonDirectoryProps,
    sortField,
    sortDir,
    onSort: handleSort,
  }), [commonDirectoryProps, sortField, sortDir, handleSort]);

  return (
    <ModulePageShell
      seoTitle={`MMS - ${t("nav.contacts")}`}
      seoDescription={t("page.contacts.subtitle")}
      headerIcon={Users}
      headerTitle={t("nav.contacts")}
      headerSubtitle={t("page.contacts.subtitle")}
      headerActions={
        <>
          <ActionButton
            variant="ghost"
            icon={openingDuplicates ? Loader2 : AlertTriangle}
            onClick={() => void handleOpenDuplicates()}
            disabled={openingDuplicates}
          >
            {t("contacts.duplicates")}
          </ActionButton>
          {canExport && (
            <ActionButton variant="ghost" icon={Download} onClick={handleExportCSV}>
              {t("common.export")}
            </ActionButton>
          )}
          {canWrite && !viewingDeleted && (
            <ActionButton variant="primary" icon={UserPlus} onClick={handleNew}>{t("contacts.addContact")}</ActionButton>
          )}
        </>
      }
      metricsStrip={
        <ContactsCommandMetrics
          shown={shownCount}
          pendingCount={pendingCount}
          conflictCount={conflictCount}
          flushing={flushing}
          onFlushPending={() => void flush()}
          onOpenDuplicates={() => void handleOpenDuplicates()}
          onReviewConflicts={openConflictReview}
        />
      }
    >

      <ContactsDataBanner onReviewConflicts={openConflictReview} listFetchEnabled={needsFullContactsList} />

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
          <motion.div key="work" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ContactsWorkDirectory
              search={search}
              onSearchChange={setSearch}
              filterGender={filterGender}
              onGenderChange={setFilterGender}
              quickFilter={quickFilter}
              onQuickFilterChange={setQuickFilter}
              sortField={sortField}
              sortDir={sortDir}
              onSort={handleSort}
              hasActiveFilters={hasActiveFilters}
              activeFilterCount={activeFilterCount}
              onClearFilters={clearFilters}
              viewingDeleted={viewingDeleted}
              onShowDeletedChange={(next) => {
                setShowDeletedArchives(next);
                setSelected([]);
              }}
              canViewDeleted={canDelete}
              viewModeOverride={viewModeOverride}
              onViewModeChange={setViewModeOverride}
              shownCount={shownCount}
              workTruncated={workTruncated}
              selected={selected}
              onClearSelection={() => setSelected([])}
              selectedTargets={selectedTargets}
              bulkActions={bulkActions}
              canWriteMessaging={canWriteMessaging}
              canExport={canExport}
              canDelete={canDelete}
              onWhatsApp={handleWhatsApp}
              onSms={handleSms}
              onBulkExport={handleBulkExport}
              onRequestBulkDelete={requestBulkDelete}
              onRequestBulkRestore={requestBulkRestore}
              isWorkError={isWorkError}
              isWorkLoading={isWorkLoading}
              isWorkFetching={isWorkFetching}
              onRetryWork={() => void refetchWork()}
              workContacts={workContacts}
              tableColumns={tableColumns}
              commonDirectoryProps={commonDirectoryProps}
              tableProps={tableProps}
              useServerWork={useServerWork}
              workPageData={workPageData}
              onPageChange={setListPage}
            />
          </motion.div>

        ) : effectiveTab === "reports" ? (
          <motion.div key="reports" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <ErrorBoundary>
              <div className="space-y-4">
                <KPISummary category="contacts" />
                <ModuleReports category="contacts" />
              </div>
            </ErrorBoundary>
          </motion.div>
        ) : effectiveTab === "setup" ? (
          <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <ErrorBoundary>
              <ContactsSettingsPanel
                contacts={contacts}
                canWrite={canWrite}
                canEditSetup={canEditSetup}
                onImport={handleImport}
              />
            </ErrorBoundary>
          </motion.div>
        ) : null}
      </AnimatePresence>
      </ResponsiveAccordionTabs>

      <Suspense fallback={null}>
        <AnimatePresence>
          <ContactForm
              open={showForm}
              key={editContact?.id || "new"}
              contact={editContact ?? undefined}
              defaultCountry={defaultCountry}
              defaultCity={defaultCity}
              defaultProvince={defaultProvince}
              onClose={() => { setShowForm(false); setEditContact(null); }}
              onSave={handleSave}
            />
          {showDuplicates && (
            <DuplicateDetection
              onClose={() => setShowDuplicates(false)}
              onMerge={handleMerge}
              canWrite={canWrite}
            />
          )}
          {messagingTarget && (
            <MessageComposer
              channel={messagingTarget.channel}
              recipients={messagingTarget.recipients}
              onClose={closeComposer}
            />
          )}
          {viewContact && (
            <ContactDetailDrawer
              contact={viewContact}
              onClose={() => setViewContact(null)}
              onEdit={(contactToEdit) => {
                setViewContact(null);
                handleEdit(contactToEdit);
              }}
              onWhatsApp={messagingHandlers.onWhatsApp}
              onSms={messagingHandlers.onSms}
              onEmail={messagingHandlers.onEmail}
              allContacts={allContactsForLinks}
              onUpdateContact={canWrite ? handleUpdateContact : undefined}
              canWrite={canWrite}
            />
          )}
        </AnimatePresence>
      </Suspense>

      <ConfirmAlertDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={t("contacts.bulkDelete")}
        description={t("contacts.bulkDeleteConfirm", { count: selected.length })}
        confirmLabel={t("common.delete")}
        onConfirm={confirmBulkDelete}
        destructive
        optionalReason={{
          label: t("contacts.deletionReasonLabel"),
          placeholder: t("contacts.deletionReasonPlaceholder"),
        }}
      />
      <ConfirmAlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={t("contacts.deleteConfirmTitle")}
        description={
          deleteTarget?.name
            ? t("contacts.deleteConfirmDescription", { name: deleteTarget.name })
            : t("contacts.deleteConfirmDescriptionDefault")
        }
        confirmLabel={t("common.delete")}
        onConfirm={confirmSingleDelete}
        destructive
        optionalReason={{
          label: t("contacts.deletionReasonLabel"),
          placeholder: t("contacts.deletionReasonPlaceholder"),
        }}
      />
      <ConfirmAlertDialog
        open={bulkRestoreOpen}
        onOpenChange={setBulkRestoreOpen}
        title={t("contacts.bulkRestore")}
        description={t("contacts.bulkRestoreConfirm", { count: selected.length })}
        confirmLabel={t("contacts.restoreContact")}
        onConfirm={confirmBulkRestore}
      />
    </ModulePageShell>
  );
}

export default ContactsInner;
