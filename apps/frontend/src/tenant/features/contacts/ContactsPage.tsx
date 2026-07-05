import React, { useMemo, useState, lazy, Suspense, useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, AlertTriangle, MessageCircle, MessageSquare, Download, Users, UserX, RefreshCw, X, Loader2, Trash2, RotateCcw } from "lucide-react";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { getPrimaryPhone, hasWhatsApp, Contact, CONTACTS_MODULE_CONTRACT, resolveModuleTierTab, getDisplayName } from "@mms/shared";
import type { AppTranslationKey } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { useModuleTierTabs } from "@/tenant/hooks/useModuleTierTabs";
import { usePermissions } from "@/tenant/hooks/usePermissions";
import { useContacts, useContactsCollection, useContactsPaginated, useContactsByIds, CONTACTS_DUPLICATES_QUERY_KEY } from "@/tenant/features/contacts/hooks/useContacts";
import { useContactsSyncOutbox } from "@/tenant/features/contacts/hooks/useContactsSyncOutbox";
import { useContactsPageActions } from "@/tenant/features/contacts/hooks/useContactsPageActions";
import { useContactsPageState } from "@/tenant/features/contacts/hooks/useContactsPageState";
import { useContactConfig, useContactColumns } from "@/lib/contexts/ContactConfigContext";
import ModuleReports from "@/tenant/features/reports/components/ModuleReports";
import KPISummary from "@/tenant/features/reports/components/KPISummary";
import { PageHeader } from "@/components/ui/PageHeader";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { ActionButton } from "@/components/ui/ActionButton";
import ContactsTable from "@/tenant/features/contacts/components/ContactsTable";
import ContactCards from "@/tenant/features/contacts/components/ContactCards";
import ContactsToolbar from "@/tenant/features/contacts/components/ContactsToolbar";
import ContactsCommandMetrics from "@/tenant/features/contacts/components/ContactsCommandMetrics";
import ContactsDataBanner from "@/tenant/features/contacts/components/ContactsDataBanner";
import ContactsSyncConflictPanel from "@/tenant/features/contacts/components/ContactsSyncConflictPanel";
import ContactsListPagination from "@/tenant/features/contacts/components/ContactsListPagination";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { startContactsDuplicateScan } from "@/lib/backgroundJobs/startServerContactsCsvExport";
import { collectLinkedContactIds, mergeContactLinkDirectory } from "@/lib/contacts/contactLinkIds";
import { notify } from "@/lib/notify";
import {
  clearGoogleContactsOAuthUrlParams,
  readGoogleContactsOAuthCodeFromUrl,
  relayGoogleContactsOAuthPopup,
  stashGoogleContactsOAuthCode,
  GOOGLE_CONTACTS_OAUTH_MESSAGE,
  shouldOpenContactsSyncSetup,
} from "@/lib/contacts/googleContactsOAuth";

const ContactForm = lazy(() => import("@/tenant/features/contacts/components/ContactForm"));
const DuplicateDetection = lazy(() => import("@/tenant/features/contacts/components/DuplicateDetection"));
const MessageComposer = lazy(() => import("@/components/ui/MessageComposer"));
const ContactsSetupPanel = lazy(() => import("@/tenant/features/contacts/components/ContactsSetupPanel"));
const ContactSyncPanel = lazy(() => import("@/tenant/features/contacts/components/ContactSyncPanel"));

function LazyFallback(): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" aria-hidden="true" />
      <span className="sr-only">{t("common.loading")}</span>
    </div>
  );
}

function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="w-10 px-4 py-3"><div className="w-4 h-4 rounded bg-muted animate-pulse" /></th>
            {Array.from({ length: cols }).map((_, i) => <th key={i} className="px-4 py-3"><div className="h-3 w-20 rounded bg-muted animate-pulse" /></th>)}
            <th className="w-16 px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              <td className="px-4 py-3"><div className="w-4 h-4 rounded bg-muted animate-pulse" /></td>
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c} className="px-4 py-3">
                  <div className="h-3 rounded bg-muted animate-pulse" style={{ width: `${50 + (c * 17 + r * 11) % 40}%` }} />
                </td>
              ))}
              <td className="px-4 py-3"><div className="w-6 h-6 rounded-lg bg-muted animate-pulse" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface SettingsPanelProps {
  contacts: Contact[];
  onImport: (list: Contact[]) => void;
  canWrite: boolean;
}

const SETUP_TAB_LABEL_KEYS: Record<string, AppTranslationKey> = {
  fields: "contacts.setup.fields",
  preferences: "contacts.setup.preferences",
  sync: "contacts.setup.sync",
};

function SettingsPanel({ contacts, onImport, canWrite, canEditSetup }: SettingsPanelProps & { canEditSetup: boolean }) {
  const { t } = useTranslation();
  const { fieldConfig, updateConfig } = useContactConfig();
  const settingsSubTabs = useMemo(() => {
    const tabsFromConfig = fieldConfig.settingsSubTabs || [];
    return CONTACTS_MODULE_CONTRACT.setupSubTabs
      .map((key, index) => {
        const setupTabConfig = tabsFromConfig.find((tab) => tab.key === key);
        return {
          key,
          label: SETUP_TAB_LABEL_KEYS[key] ? t(SETUP_TAB_LABEL_KEYS[key]) : setupTabConfig?.label ?? key,
          order: setupTabConfig?.order ?? index,
          enabled: setupTabConfig?.enabled ?? true,
        };
      })
      .filter((tab) => tab.enabled)
      .sort((a, b) => a.order - b.order);
  }, [fieldConfig.settingsSubTabs, t]);

  const [sub, setSub] = useState<string>(() => {
    if (shouldOpenContactsSyncSetup()) return 'sync';
    return settingsSubTabs[0]?.key || "preferences";
  });
  return (
    <div className="space-y-4">
      <SubTabBar
        tabs={settingsSubTabs.map((tab) => ({ key: tab.key, label: tab.label }))}
        value={sub}
        onChange={setSub}
      />
      <Suspense fallback={<LazyFallback />}>
        {sub === "preferences" && !canEditSetup ? (
          <p className="text-sm text-muted-foreground rounded-xl border border-border bg-muted/20 px-4 py-6">
            {t("contacts.setupReadOnly")}
          </p>
        ) : null}
        {sub === "preferences" && canEditSetup && (
          <ContactsSetupPanel config={fieldConfig} onConfigChange={updateConfig as (config: object) => void} mode="preferences" />
        )}
        {sub === "sync" && (
          <ContactSyncPanel contacts={contacts} onImport={onImport as (contacts: object[]) => void} canWrite={canWrite} />
        )}
      </Suspense>
    </div>
  );
}

function ContactsInner() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const perms = CONTACTS_MODULE_CONTRACT.permissions;
  const bulkActions = CONTACTS_MODULE_CONTRACT.work.bulkActions;
  const canWrite = can(perms.write);
  const canDelete = can(perms.delete);
  const canExport = can(perms.export);
  const canViewReports = can(perms.reports);
  const canViewSetup = can(perms.setupView);
  const canEditSetup = can(perms.setupWrite);
  const { prefs, countryCodesMap } = useContactConfig();
  const tableColumns = useContactColumns();
  const [showDeletedArchives, setShowDeletedArchives] = useState(false);
  const [listPage, setListPage] = useState(1);
  const [conflictPanelOpen, setConflictPanelOpen] = useState(false);
  const workDirectoryRowsRef = useRef<Contact[] | undefined>(undefined);
  const { conflictCount } = useContactsSyncOutbox();
  const prevConflictCount = useRef(conflictCount);
  const openConflictReview = useCallback(() => setConflictPanelOpen(true), []);
  const PAGE_TABS = useModuleTierTabs();
  const [fetchGateTab, setFetchGateTab] = useState("work");
  const visibleTopTabIds = useMemo(
    () =>
      PAGE_TABS.filter((tab) => {
        if (tab.id === "setup") return canViewSetup;
        if (tab.id === "reports") return canViewReports;
        return true;
      }).map((tab) => tab.id),
    [PAGE_TABS, canViewSetup, canViewReports],
  );
  const fetchGateEffectiveTab = resolveModuleTierTab(fetchGateTab, visibleTopTabIds);
  const needsFullContactsList = showDeletedArchives || fetchGateEffectiveTab === "setup";

  const { isLoading: isContactsLoading } = useContacts({
    enabled: needsFullContactsList,
    includeDeleted: showDeletedArchives && canDelete,
  });
  const pageActions = useContactsPageActions();
  const rawContacts = useContactsCollection({
    enabled: needsFullContactsList,
    includeDeleted: showDeletedArchives && canDelete,
  });

  const state = useContactsPageState({
    rawContacts,
    prefs,
    countryCodesMap,
    tableColumns,
    canWrite,
    canDelete,
    canExport,
    canViewReports,
    canViewSetup,
    pageActions,
    showDeletedArchives,
    directoryRowsRef: workDirectoryRowsRef,
  });

  const {
    t,
    visibleTopTabs,
    effectiveTab,
    activeTab,
    setActiveTab,
    contacts,
    filtered,
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
    showDeletedArchives: viewingDeleted,
  } = state;

  useEffect(() => {
    setFetchGateTab(activeTab);
  }, [activeTab]);

  const useServerWork = !viewingDeleted && effectiveTab === "work";
  const isListView = true;
  const workLimit = CONTACTS_MODULE_CONTRACT.defaultPageSize;

  const { data: workPageData, isFetching: isWorkPageFetching } = useContactsPaginated({
    page: isListView ? listPage : 1,
    limit: workLimit,
    search,
    gender: filterGender,
    sortField,
    sortDir,
    enabled: useServerWork,
  });

  React.useEffect(() => {
    setListPage(1);
  }, [search, filterGender, sortField, sortDir, showDeletedArchives]);

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
        setActiveTab('setup');
      }
    }

    const handleOAuthMessage = (event: MessageEvent): void => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== GOOGLE_CONTACTS_OAUTH_MESSAGE || typeof event.data.code !== 'string') return;
      stashGoogleContactsOAuthCode(event.data.code);
      setActiveTab('setup');
    };
    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [setActiveTab]);

  const workContacts = useMemo(() => {
    return useServerWork ? (workPageData?.contacts ?? []) : filtered;
  }, [useServerWork, workPageData?.contacts, filtered]);

  workDirectoryRowsRef.current = useServerWork ? workContacts : undefined;
  const shownCount = useServerWork && workPageData ? workPageData.total : filtered.length;
  const workTruncated = useServerWork && !isListView && Boolean(workPageData?.hasMore);

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

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <title>MMS - {t("nav.contacts")}</title>
      <meta name="description" content={t("contacts.pageDescription")} />
      <PageHeader
        icon={Users}
        title={t("nav.contacts")}
        subtitle={t("page.contacts.subtitle")}
        actions={
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
            <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <Download className="w-3.5 h-3.5" /> {t("common.export")}
            </button>
            )}
            {canWrite && (
              <ActionButton variant="primary" icon={UserPlus} onClick={handleNew}>{t("contacts.addContact")}</ActionButton>
            )}
          </>
        }
      />

      <ContactsCommandMetrics
        total={contacts.length}
        shown={shownCount}
        onOpenDuplicates={() => void handleOpenDuplicates()}
        onReviewConflicts={openConflictReview}
      />

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
                    {t("contacts.genderFilter")}: {genderLabel(filterGender)} <button type="button" onClick={() => setFilterGender("")} className="hover:opacity-70" aria-label={t("contacts.clearFilters")}><X className="w-3 h-3" /></button>
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {selected.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-primary/[0.05] border border-primary/20 backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">{t("contacts.selectedCount", { count: selected.length })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const targets = workContacts.filter((contact) => selected.includes(contact.id));
                      const waTargets = targets.filter((contact) => hasWhatsApp(contact));
                      const smsReady = targets.filter((contact) => Boolean(getPrimaryPhone(contact)));
                      const waClickable = waTargets.length > 0;
                      const smsClickable = smsReady.length > 0;
                      return (
                        <>
                          {bulkActions.includes("whatsapp") && !viewingDeleted && (
                          <button
                            type="button"
                            disabled={!waClickable}
                            onClick={() => setMessagingTarget({ channel: "whatsapp", contacts: waTargets })}
                            aria-label={t("contacts.whatsappBulk", { count: waTargets.length })}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold text-primary-foreground bg-success transition-all ${
                              waClickable ? "hover:scale-[1.02] active:scale-[0.98]" : "opacity-40 cursor-not-allowed"
                            }`}
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> {t("contacts.whatsappBulk", { count: waTargets.length })}
                          </button>
                          )}
                          {bulkActions.includes("sms") && !viewingDeleted && (
                          <button
                            type="button"
                            disabled={!smsClickable}
                            onClick={() => setMessagingTarget({ channel: "sms", contacts: smsReady })}
                            aria-label={t("contacts.smsBulk", { count: smsReady.length })}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-primary/40 bg-primary/10 text-sm font-semibold text-primary transition-all dark:border-primary/40 dark:bg-primary/20 dark:text-primary ${
                              smsClickable ? "hover:scale-[1.02] active:scale-[0.98]" : "opacity-40 cursor-not-allowed"
                            }`}
                          >
                            <MessageSquare className="w-3.5 h-3.5" /> {t("contacts.smsBulk", { count: smsReady.length })}
                          </button>
                          )}
                          {bulkActions.includes("export") && (
                          <button
                            type="button"
                            onClick={handleBulkExport}
                            disabled={!canExport}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted transition-all ${!canExport ? "opacity-40 cursor-not-allowed" : ""}`}
                          >
                            <Download className="w-3.5 h-3.5" /> {t("contacts.bulkExport")}
                          </button>
                          )}
                          {bulkActions.includes("delete") && canDelete && !viewingDeleted && (
                            <button
                              type="button"
                              onClick={requestBulkDelete}
                              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-destructive/30 bg-destructive/10 text-sm font-semibold text-destructive hover:bg-destructive/15 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> {t("contacts.bulkDelete")}
                            </button>
                          )}
                          {viewingDeleted && canDelete && (
                            <button
                              type="button"
                              onClick={requestBulkRestore}
                              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-primary/30 bg-primary/10 text-sm font-semibold text-primary hover:bg-primary/15 transition-all"
                            >
                              <RotateCcw className="w-3.5 h-3.5" /> {t("contacts.bulkRestore")}
                            </button>
                          )}
                        </>
                      );
                    })()}
                    <button onClick={() => setSelected([])} className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                      {t("contacts.deselect")}
                    </button>
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
                    <div className="flex flex-col items-center justify-center py-20 rounded-xl border-2 border-dashed border-border text-muted-foreground gap-3">
                      <UserX className="w-8 h-8 opacity-30" />
                      <p className="text-sm font-semibold">
                        {hasActiveFilters
                          ? t("contacts.noContactsMatchFilters")
                          : viewingDeleted
                            ? t("contacts.noDeletedContacts")
                            : t("contacts.noContactsYet")}
                      </p>
                      <p className="text-xs text-center max-w-xs">
                        {hasActiveFilters
                          ? t("contacts.tryAdjustingFilters")
                          : viewingDeleted
                            ? t("contacts.showActive")
                            : t("contacts.clickAddContact")}
                      </p>
                      {hasActiveFilters && (
                        <button type="button" onClick={clearFilters} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors">
                          <RefreshCw className="w-3 h-3" /> {t("contacts.clearFilters")}
                        </button>
                      )}
                    </div>
                  ) : (
                    <ErrorBoundary>
                      <div className="lg:hidden">
                        <ContactCards
                          contacts={workContacts}
                          selected={selected}
                          onSelect={handleSelect}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onRestore={handleRestore}
                          showArchived={viewingDeleted}
                          onWhatsApp={(targets) => setMessagingTarget({ channel: "whatsapp", contacts: targets })}
                          onSms={(targets) => setMessagingTarget({ channel: "sms", contacts: targets })}
                          onEmail={(targets) => setMessagingTarget({ channel: "email", contacts: targets })}
                          allContacts={allContactsForLinks}
                          canWrite={canWrite}
                          canDelete={canDelete}
                          columns={tableColumns}
                          onSelectAll={handleSelectAll}
                          allSelected={workContacts.length > 0 && selected.length === workContacts.length}
                        />
                      </div>
                      <div className="hidden lg:block space-y-2">
                        <ContactsTable
                          contacts={workContacts} selected={selected}
                          onSelect={handleSelect} onSelectAll={handleSelectAll}
                          onEdit={handleEdit} onDelete={handleDelete}
                          onRestore={handleRestore}
                          showArchived={viewingDeleted}
                          onWhatsApp={(targets) => setMessagingTarget({ channel: "whatsapp", contacts: targets })}
                          onSms={(targets) => setMessagingTarget({ channel: "sms", contacts: targets })}
                          onEmail={(targets) => setMessagingTarget({ channel: "email", contacts: targets })}
                          onSort={handleSort}
                          sortField={sortField} sortDir={sortDir}
                          columns={tableColumns}
                          allContacts={allContactsForLinks}
                          onUpdateContact={handleUpdateContact}
                          canWrite={canWrite}
                          canDelete={canDelete}
                        />
                      </div>
                      {useServerWork && workPageData && (
                        <ContactsListPagination
                          page={workPageData.page}
                          total={workPageData.total}
                          limit={workPageData.limit}
                          hasMore={workPageData.hasMore}
                          onPageChange={setListPage}
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
              <SettingsPanel
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
              onSave={handleSave as (contact: object) => void}
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
                email: c.email || "",
              }))}
              onClose={() => setMessagingTarget(null)}
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
    </div>
  );
}

export default ContactsInner;
