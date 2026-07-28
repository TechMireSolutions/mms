import React, { useCallback } from "react";
import { Users } from "lucide-react";
import { CONTACTS_MODULE_MANIFEST } from "@mms/shared";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { useContactsPageState } from "@/tenant/features/contacts/hooks/useContactsPageState";
import { useContactsPageDirectoryProps } from "@/tenant/features/contacts/hooks/useContactsPageDirectoryProps";
import { useContactConfig, useContactColumns } from "@/lib/contexts/ContactConfigContext";
import { ModulePageShell } from "@/components/ui/ModulePageShell";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { ContactsCommandMetrics } from "@/tenant/features/contacts/components/ContactsCommandMetrics";
import ContactsDataBanner from "@/tenant/features/contacts/components/ContactsDataBanner";
import ContactsSyncConflictPanel from "@/tenant/features/contacts/components/ContactsSyncConflictPanel";
import { ContactsPageOverlays } from "@/tenant/features/contacts/components/ContactsPageOverlays";
import { ContactsPageTabPanel } from "@/tenant/features/contacts/components/ContactsPageTabPanel";
import { ContactsPageHeaderActions } from "@/tenant/features/contacts/components/ContactsPageHeaderActions";
import { useGoogleContactsOAuthListener } from "@/lib/contacts/googleContactsOAuthListener";

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

  const { messagingHandlers, commonDirectoryProps, tableProps } = useContactsPageDirectoryProps({
    workContacts,
    selected,
    handleSelect,
    handleSelectAll,
    setViewContact,
    handleEdit,
    handleDelete,
    handleRestore,
    viewingDeleted,
    canWriteMessaging,
    handleWhatsApp,
    handleSms,
    handleEmail,
    allContactsForLinks,
    handleUpdateContact,
    canWrite,
    canDelete,
    tableColumns,
    sortField,
    sortDir,
    handleSort,
  });

  return (
    <ModulePageShell
      seoTitle={`MMS - ${t("nav.contacts")}`}
      seoDescription={t("page.contacts.subtitle")}
      headerIcon={Users}
      headerTitle={t("nav.contacts")}
      headerSubtitle={t("page.contacts.subtitle")}
      headerActions={
        <ContactsPageHeaderActions
          canExport={canExport}
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
        <ContactsPageTabPanel
          effectiveTab={effectiveTab}
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
          contacts={contacts}
          canWrite={canWrite}
          canEditSetup={canEditSetup}
          onImport={handleImport}
        />
      </ResponsiveAccordionTabs>

      <ContactsPageOverlays
        canWrite={canWrite}
        showForm={showForm}
        editContact={editContact}
        defaultCountry={defaultCountry}
        defaultCity={defaultCity}
        defaultProvince={defaultProvince}
        onCloseForm={() => { setShowForm(false); setEditContact(null); }}
        onSave={handleSave}
        showDuplicates={showDuplicates}
        onCloseDuplicates={() => setShowDuplicates(false)}
        onMerge={handleMerge}
        messagingTarget={messagingTarget}
        onCloseComposer={closeComposer}
        viewContact={viewContact}
        onCloseView={() => setViewContact(null)}
        onEditFromDrawer={(contactToEdit) => {
          setViewContact(null);
          handleEdit(contactToEdit);
        }}
        onWhatsApp={messagingHandlers.onWhatsApp}
        onSms={messagingHandlers.onSms}
        onEmail={messagingHandlers.onEmail}
        allContactsForLinks={allContactsForLinks}
        onUpdateContact={canWrite ? handleUpdateContact : undefined}
        bulkDeleteOpen={bulkDeleteOpen}
        onBulkDeleteOpenChange={setBulkDeleteOpen}
        selectedCount={selected.length}
        onConfirmBulkDelete={confirmBulkDelete}
        deleteTarget={deleteTarget}
        onDeleteTargetOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirmSingleDelete={confirmSingleDelete}
        bulkRestoreOpen={bulkRestoreOpen}
        onBulkRestoreOpenChange={setBulkRestoreOpen}
        onConfirmBulkRestore={confirmBulkRestore}
      />
    </ModulePageShell>
  );
}

export default ContactsInner;
