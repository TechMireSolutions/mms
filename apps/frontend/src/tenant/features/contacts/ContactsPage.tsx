import React, { useMemo, useState, lazy, Suspense, useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, AlertTriangle, Download, Users, UserX, Loader2, Trash2, X, MessageCircle, MessageSquare, RotateCcw, RefreshCw } from "lucide-react";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { Contact, CONTACTS_MODULE_CONTRACT, hasWhatsApp, getPrimaryPhone, getPrimaryEmail, getDisplayName } from "@mms/shared";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { useContactsByIds, CONTACTS_DUPLICATES_QUERY_KEY } from "@/tenant/features/contacts/hooks/useContacts";
import { useContactsSyncOutbox } from "@/tenant/features/contacts/hooks/useContactsSyncOutbox";
import { useContactsPageState } from "@/tenant/features/contacts/hooks/useContactsPageState";
import { useContactConfig, useContactColumns } from "@/lib/contexts/ContactConfigContext";
import ModuleReports from "@/tenant/features/reports/components/ModuleReports";
import KPISummary from "@/tenant/features/reports/components/KPISummary";
import { ModulePageShell } from "@/components/ui/ModulePageShell";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { ActionButton } from "@/components/ui/ActionButton";
import { Button } from "@/components/ui/button";
import ContactsTable from "@/tenant/features/contacts/components/ContactsTable";
import ContactCards from "@/tenant/features/contacts/components/ContactCards";
import ContactsToolbar from "@/tenant/features/contacts/components/ContactsToolbar";
import { ContactsCommandMetrics } from "@/tenant/features/contacts/components/ContactsCommandMetrics";
import ContactsDataBanner from "@/tenant/features/contacts/components/ContactsDataBanner";
import ContactsSyncConflictPanel from "@/tenant/features/contacts/components/ContactsSyncConflictPanel";
import { ListPagination } from "@/components/ui/ListPagination";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { TableSkeleton } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { startContactsDuplicateScan } from "@/lib/backgroundJobs/startServerContactsCsvExport";
import { collectLinkedContactIds, mergeContactLinkDirectory } from "@/lib/contacts/contactLinkIds";
import { notify } from "@/lib/notify";
import {
  clearGoogleContactsOAuthUrlParams,
  readGoogleContactsOAuthCodeFromUrl,
  relayGoogleContactsOAuthPopup,
  stashGoogleContactsOAuthCode,
  GOOGLE_CONTACTS_OAUTH_MESSAGE,
} from "@/lib/contacts/googleContactsOAuth";

import ContactsSettingsPanel from "@/tenant/features/contacts/components/ContactsSettingsPanel";

const ContactForm = lazy(() => import("@/tenant/features/contacts/components/ContactForm"));
const DuplicateDetection = lazy(() => import("@/tenant/features/contacts/components/DuplicateDetection"));
const MessageComposer = lazy(() => import("@/components/ui/MessageComposer"));
const ContactDetailDrawer = lazy(() => import("@/tenant/features/contacts/components/ContactDetailDrawer"));


function ContactsInner() {
  const queryClient = useQueryClient();
  const [viewContact, setViewContact] = useState<Contact | null>(null);
  const {
    canWrite,
    canDelete,
    canExport,
    canReports: canViewReports,
    canViewSetup,
    canEditSetup,
  } = useModulePermissions(CONTACTS_MODULE_CONTRACT);
  const bulkActions = CONTACTS_MODULE_CONTRACT.work.bulkActions;
  const { prefs, countryCodesMap } = useContactConfig();
  const tableColumns = useContactColumns();
  const [viewModeOverride, setViewModeOverride] = useState<"table" | "cards" | null>(null);
  const [conflictPanelOpen, setConflictPanelOpen] = useState(false);
  const { conflictCount } = useContactsSyncOutbox();
  const prevConflictCount = useRef(conflictCount);
  const openConflictReview = useCallback(() => setConflictPanelOpen(true), []);

  const state = useContactsPageState({
    prefs,
    countryCodesMap,
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
    sortField,
    sortDir,
    selected,
    setSelected,
    showForm,
    setShowForm,
    editContact,
    setEditContact,
    showDuplicates,
    setShowDuplicates,
    messagingTarget,
    setMessagingTarget,
    hasActiveFilters,
    activeFilterCount,
    defaultCountry,
    defaultCity,
    defaultProvince,
    genderLabel,
    handleSort,
    handleSelect,
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
    showDeletedArchives: viewingDeleted,
    setShowDeletedArchives,
    needsFullContactsList,
    isContactsLoading,
    useServerWork,
    workPageData,
    isWorkPageFetching,
    setListPage,
    workContacts,
    shownCount,
    workTruncated,
  } = state;

  useEffect(() => {
    if (prevConflictCount.current === 0 && conflictCount > 0) {
      setConflictPanelOpen(true);
    }
    prevConflictCount.current = conflictCount;
  }, [conflictCount]);

  useEffect(() => {
    const code = readGoogleContactsOAuthCodeFromUrl();
    if (code) {
      clearGoogleContactsOAuthUrlParams();
      if (!relayGoogleContactsOAuthPopup(code)) {
        stashGoogleContactsOAuthCode(code);
        setActiveTab("setup");
      }
    }

    const handleOAuthMessage = (event: MessageEvent): void => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== GOOGLE_CONTACTS_OAUTH_MESSAGE || typeof event.data.code !== "string") return;
      stashGoogleContactsOAuthCode(event.data.code);
      setActiveTab("setup");
    };
    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [setActiveTab]);

  const linkSourceContacts = useMemo(() => {
    const rows = [...workContacts];
    if (editContact) rows.push(editContact);
    return rows;
  }, [workContacts, editContact]);
  const linkedContactIds = useMemo(
    () => collectLinkedContactIds(linkSourceContacts),
    [linkSourceContacts],
  );
  const { data: resolvedLinkContacts = [] } = useContactsByIds(
    needsFullContactsList ? [] : linkedContactIds,
  );
  const allContactsForLinks = useMemo(() => {
    if (needsFullContactsList) return contacts;
    return mergeContactLinkDirectory(linkSourceContacts, resolvedLinkContacts);
  }, [needsFullContactsList, contacts, linkSourceContacts, resolvedLinkContacts]);

  const [openingDuplicates, setOpeningDuplicates] = useState(false);

  const handleOpenDuplicates = useCallback(async () => {
    if (openingDuplicates) return;
    const needsAsyncScan = shownCount >= CONTACTS_MODULE_CONTRACT.duplicateScanAsyncMinContacts;
    if (needsAsyncScan) {
      setOpeningDuplicates(true);
      try {
        const job = await startContactsDuplicateScan(t("contacts.jobs.duplicateScanLabel"));
        await queryClient.invalidateQueries({ queryKey: CONTACTS_DUPLICATES_QUERY_KEY });
        const pairCount = job.progress?.current ?? 0;
        notify.success(t("contacts.duplicates.scanComplete", { count: pairCount }));
      } catch {
        notify.error(t("contacts.duplicates.scanFailed"));
        return;
      } finally {
        setOpeningDuplicates(false);
      }
    }
    setShowDuplicates(true);
  }, [openingDuplicates, shownCount, queryClient, t, setShowDuplicates]);

  const handleWhatsApp = useCallback((targets: Contact[]) => {
    setMessagingTarget({ channel: "whatsapp", contacts: targets });
  }, [setMessagingTarget]);

  const handleSms = useCallback((targets: Contact[]) => {
    setMessagingTarget({ channel: "sms", contacts: targets });
  }, [setMessagingTarget]);

  const handleEmail = useCallback((targets: Contact[]) => {
    setMessagingTarget({ channel: "email", contacts: targets });
  }, [setMessagingTarget]);

  const selectedTargets = useMemo(() => {
    if (selected.length === 0) return { waTargets: [], smsReady: [] };
    const targets = workContacts.filter((contact) => selected.includes(contact.id));
    const waTargets = targets.filter((contact) => hasWhatsApp(contact));
    const smsReady = targets.filter((contact) => Boolean(getPrimaryPhone(contact)));
    return { waTargets, smsReady };
  }, [selected, workContacts]);

  const handleSelectAllWork = useCallback(() => {
    setSelected((selectedIds) => (selectedIds.length === workContacts.length ? [] : workContacts.map((contact) => contact.id)));
  }, [workContacts, setSelected]);

  const commonDirectoryProps = useMemo(() => ({
    contacts: workContacts,
    selected,
    onSelect: handleSelect,
    onSelectAll: handleSelectAllWork,
    onView: setViewContact,
    onEdit: handleEdit,
    onDelete: handleDelete,
    onRestore: handleRestore,
    showArchived: viewingDeleted,
    onWhatsApp: handleWhatsApp,
    onSms: handleSms,
    onEmail: handleEmail,
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
    handleSelectAllWork,
    setViewContact,
    handleEdit,
    handleDelete,
    handleRestore,
    viewingDeleted,
    handleWhatsApp,
    handleSms,
    handleEmail,
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
          {canWrite && (
            <ActionButton variant="primary" icon={UserPlus} onClick={handleNew}>{t("contacts.addContact")}</ActionButton>
          )}
        </>
      }
      metricsStrip={
        <ContactsCommandMetrics
          total={contacts.length}
          shown={shownCount}
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
          <motion.div key="work" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <ErrorBoundary>
              <ContactsToolbar
                search={search}             onSearchChange={setSearch}
                filterGender={filterGender} onGenderChange={setFilterGender}
                sortField={sortField}       onSort={handleSort}
                hasActiveFilters={hasActiveFilters}
                activeFilterCount={activeFilterCount}
                onClearFilters={clearFilters}
                showDeletedArchives={viewingDeleted}
                onShowDeletedChange={(next) => {
                  setShowDeletedArchives(next);
                  setSelected([]);
                }}
                canViewDeleted={canDelete}
                viewMode={viewModeOverride ?? "table"}
                onViewModeChange={setViewModeOverride}
              />
            </ErrorBoundary>

            {workTruncated && (
              <div
                className="flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-4 py-2.5 text-xs text-warning"
                role="status"
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                {t("contacts.workTruncated", {
                  limit: CONTACTS_MODULE_CONTRACT.maxPageSize,
                  total: shownCount,
                })}
              </div>
            )}

            <AnimatePresence>
              {filterGender && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="flex flex-wrap gap-1.5">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                    {t("contacts.genderFilter")}: {genderLabel(filterGender)}{" "}
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      onClick={() => setFilterGender("")}
                      className="h-4 w-4 p-0 hover:bg-transparent hover:opacity-70"
                      aria-label={t("contacts.clearFilters")}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {selected.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-card/90 border border-primary/20 shadow-md backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">{t("contacts.selectedCount", { count: selected.length })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {bulkActions.includes("whatsapp") && !viewingDeleted && (
                      <Button
                        type="button"
                        size="sm"
                        disabled={selectedTargets.waTargets.length === 0}
                        onClick={() => setMessagingTarget({ channel: "whatsapp", contacts: selectedTargets.waTargets })}
                        aria-label={t("contacts.whatsappBulk", { count: selectedTargets.waTargets.length })}
                        className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> {t("contacts.whatsappBulk", { count: selectedTargets.waTargets.length })}
                      </Button>
                    )}
                    {bulkActions.includes("sms") && !viewingDeleted && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={selectedTargets.smsReady.length === 0}
                        onClick={() => setMessagingTarget({ channel: "sms", contacts: selectedTargets.smsReady })}
                        aria-label={t("contacts.smsBulk", { count: selectedTargets.smsReady.length })}
                        className="gap-1.5 border-primary/40 bg-primary/10 text-primary font-semibold hover:bg-primary/20"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> {t("contacts.smsBulk", { count: selectedTargets.smsReady.length })}
                      </Button>
                    )}
                    {bulkActions.includes("export") && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleBulkExport}
                        disabled={!canExport}
                        className="gap-1.5 font-semibold"
                      >
                        <Download className="w-3.5 h-3.5" /> {t("contacts.bulkExport")}
                      </Button>
                    )}
                    {bulkActions.includes("delete") && canDelete && !viewingDeleted && (
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={requestBulkDelete}
                        className="gap-1.5 font-semibold"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> {t("contacts.bulkDelete")}
                      </Button>
                    )}
                    {viewingDeleted && canDelete && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={requestBulkRestore}
                        className="gap-1.5 border-primary/40 text-primary font-semibold hover:bg-primary/10"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> {t("contacts.bulkRestore")}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelected([])}
                      className="text-muted-foreground hover:text-foreground font-medium"
                    >
                      {t("contacts.deselect")}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {isContactsLoading ? (
                <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <TableSkeleton rows={6} cols={tableColumns.length} />
                </motion.div>
              ) : (
                <motion.div key="list-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  {workContacts.length === 0 ? (
                    <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-xl p-6">
                      <EmptyState
                        icon={UserX}
                        title={
                          hasActiveFilters
                            ? t("contacts.noContactsMatchFilters")
                            : viewingDeleted
                              ? t("contacts.noDeletedContacts")
                              : t("contacts.noContactsYet")
                        }
                        description={
                          hasActiveFilters
                            ? t("contacts.tryAdjustingFilters")
                            : viewingDeleted
                              ? t("contacts.showActive")
                              : t("contacts.clickAddContact")
                        }
                        action={
                          hasActiveFilters ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={clearFilters}
                              className="gap-1.5"
                            >
                              <RefreshCw className="w-3 h-3" /> {t("contacts.clearFilters")}
                            </Button>
                          ) : null
                        }
                      />
                    </div>
                  ) : (
                    <ErrorBoundary>
                      {viewModeOverride === "cards" ? (
                        <ContactCards {...commonDirectoryProps} />
                      ) : viewModeOverride === "table" ? (
                        <ContactsTable {...tableProps} />
                      ) : (
                        <>
                          <div className="lg:hidden">
                            <ContactCards {...commonDirectoryProps} />
                          </div>
                          <div className="hidden lg:block space-y-2">
                            <ContactsTable {...tableProps} />
                          </div>
                        </>
                      )}
                      {useServerWork && workPageData && (
                         <ListPagination
                           page={workPageData.page}
                           total={workPageData.total}
                           limit={workPageData.limit}
                           hasMore={workPageData.hasMore}
                           onPageChange={setListPage}
                           i18nNamespace="contacts"
                           variant="range"
                         />
                      )}
                      {useServerWork && isWorkPageFetching && (
                        <p className="text-xs text-muted-foreground px-1">{t("common.loading")}</p>
                      )}
                    </ErrorBoundary>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
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
              recipients={messagingTarget.contacts.map((c) => ({
                id: c.id,
                name: getDisplayName(c),
                phone: getPrimaryPhone(c) || "",
                email: getPrimaryEmail(c) || "",
              }))}
              onClose={() => setMessagingTarget(null)}
            />
          )}
          {viewContact && (
            <ContactDetailDrawer
              contact={viewContact}
              onClose={() => setViewContact(null)}
              onEdit={(contactToEdit) => {
                setViewContact(null);
                if (canWrite) handleEdit(contactToEdit);
              }}
              onWhatsApp={handleWhatsApp}
              onSms={handleSms}
              onEmail={handleEmail}
              allContacts={allContactsForLinks}
              onUpdateContact={canWrite ? handleUpdateContact : undefined}
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
