import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePersistedTabState } from "@/hooks/usePersistedTabState";
import type { Contact } from "@mms/shared";
import {
  getDisplayName,
  getPrimaryPhone,
  getPrimaryEmail,
  hasWhatsApp,
  resolveModuleTierTab,
  CONTACTS_MODULE_MANIFEST,
  syncContactScalarFields,
  toMessagingRecipient,
} from "@mms/shared";
import { useFilteredModuleTierTabs } from "@/tenant/hooks/useModuleTierTabs";
import { useTranslation } from "@/hooks/useTranslation";
import { useMessageComposerState } from "@/hooks/useMessageComposerState";
import { notify } from "@/lib/notify";
import { startContactsDuplicateScan } from "@/lib/backgroundJobs/startServerContactsCsvExport";
import { CONTACTS_DUPLICATES_QUERY_KEY } from "@/tenant/features/contacts/hooks/useContacts";
import { useContactsCrudActions } from "@/tenant/features/contacts/hooks/useContactsCrudActions";
import { useContactsSyncOutbox } from "@/tenant/features/contacts/hooks/useContactsSyncOutbox";
import { useContactsDirectory } from "@/tenant/features/contacts/hooks/useContactsDirectory";
import { useContactsExportActions } from "@/tenant/features/contacts/hooks/useContactsExportActions";

export interface UseContactsPageStateOptions {
  prefs: {
    defaultCountry?: string;
    defaultCity?: string;
    defaultProvince?: string;
  };
  tableColumns: Array<{ id: string; label: string }>;
  canWrite: boolean;
  canDelete: boolean;
  canExport: boolean;
  canViewReports: boolean;
  canViewSetup: boolean;
  initialShowDeletedArchives?: boolean;
}

export function useContactsPageState({
  prefs,
  tableColumns,
  canWrite,
  canDelete,
  canExport,
  canViewReports,
  canViewSetup,
  initialShowDeletedArchives = false,
}: UseContactsPageStateOptions) {
  const { t } = useTranslation();

  const {
    updateContact,
    logExportAudit,
    handleError,
    notifyBulkResult,
    saveContact,
    removeContact,
    mergeContacts,
    importContacts,
    bulkDeleteContactsAction,
    restoreContactAction,
    bulkRestoreContactsAction,
  } = useContactsCrudActions();

  const visibleTopTabs = useFilteredModuleTierTabs({
    canViewSetup,
    canViewReports,
  });

  const queryClient = useQueryClient();
  const [viewModeOverride, setViewModeOverride] = useState<"table" | "cards" | null>(null);
  const [conflictPanelOpen, setConflictPanelOpen] = useState(false);
  const [openingDuplicates, setOpeningDuplicates] = useState(false);
  const { pendingCount, conflictCount, flushing, flush } = useContactsSyncOutbox();
  const prevConflictCount = useRef(conflictCount);
  const openConflictReview = useCallback(() => setConflictPanelOpen(true), []);
  const closeConflictReview = useCallback(() => setConflictPanelOpen(false), []);

  useEffect(() => {
    if (prevConflictCount.current === 0 && conflictCount > 0) {
      setConflictPanelOpen(true);
    }
    prevConflictCount.current = conflictCount;
  }, [conflictCount]);

  const [showForm, setShowForm] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [viewContact, setViewContact] = useState<Contact | null>(null);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const {
    messagingTarget,
    openComposer,
    closeComposer,
    canWriteMessaging,
  } = useMessageComposerState();
  const [activeTab, setActiveTab] = usePersistedTabState<string>("contacts_active_tab", "work");
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkRestoreOpen, setBulkRestoreOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string | number; name?: string } | null>(null);

  const effectiveTab = resolveModuleTierTab(activeTab, visibleTopTabs.map((tab) => tab.id));

  const {
    showDeletedArchives,
    setShowDeletedArchives,
    listPage,
    setListPage,
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
    needsFullContactsList,
    useServerWork,
    contacts,
    workPageData,
    isWorkLoading,
    isWorkError,
    refetchWork,
    isWorkFetching,
    workContacts,
    shownCount,
    workTruncated,
    allContactsForLinks,
    hasActiveFilters,
    activeFilterCount,
    handleSort,
    handleSelect,
    handleSelectAll,
    clearFilters,
  } = useContactsDirectory({
    effectiveTab,
    setActiveTab,
    editContact,
    viewContact,
    initialShowDeletedArchives,
  });

  const { handleExportCSV, handleBulkExport } = useContactsExportActions({
    tableColumns,
    canExport,
    search,
    filterGender,
    sortField,
    sortDir,
    quickFilter,
    showDeletedArchives,
    workContacts,
    selected,
    logExportAudit,
    handleError,
    t,
  });

  const defaultCountry = prefs.defaultCountry || "";
  const defaultCity = prefs.defaultCity || "";
  const defaultProvince = prefs.defaultProvince || "";

  const selectedTargets = useMemo(() => {
    if (selected.length === 0) return { waTargets: [], smsReady: [] };
    const selectedSet = new Set(selected);
    const waTargets: Contact[] = [];
    const smsReady: Contact[] = [];
    for (const contact of workContacts) {
      if (selectedSet.has(contact.id)) {
        if (hasWhatsApp(contact)) waTargets.push(contact);
        if (getPrimaryPhone(contact)) smsReady.push(contact);
      }
    }
    return { waTargets, smsReady };
  }, [selected, workContacts]);

  const handleOpenDuplicates = useCallback(async () => {
    if (openingDuplicates) return;
    const needsAsyncScan = shownCount >= CONTACTS_MODULE_MANIFEST.duplicateScanAsyncMinContacts;
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

  const openForm = useCallback(
    (contact: Contact | null = null) => {
      if (!canWrite) return;
      setEditContact(contact);
      setShowForm(true);
    },
    [canWrite],
  );

  const handleEdit = openForm;
  const handleCreateContact = useCallback(() => openForm(null), [openForm]);

  const findContactById = useCallback(
    (id: string | number): Contact | undefined =>
      workContacts.find((contact) => contact.id === id) ?? contacts.find((contact) => contact.id === id),
    [workContacts, contacts],
  );

  const handleSave = useCallback(
    async (contactDraft: Contact): Promise<void> => {
      if (!canWrite) return;
      const isCreatingContact = !editContact;
      const basePayload = syncContactScalarFields(contactDraft);

      const payload: Contact = {
        ...(editContact || {}),
        ...contactDraft,
        ...basePayload,
        phones: contactDraft.phones ?? [],
        emails: contactDraft.emails ?? [],
        addresses: contactDraft.addresses ?? [],
        socials: contactDraft.socials ?? [],
        emergencyContacts: contactDraft.emergencyContacts ?? [],
      };

      await saveContact(payload, isCreatingContact);
      setShowForm(false);
      setEditContact(null);
    },
    [editContact, saveContact, canWrite],
  );

  const handleDelete = useCallback(
    (id: string | number) => {
      if (!canDelete) return;
      const selectedContact = findContactById(id);
      setDeleteTarget({ id, name: selectedContact ? getDisplayName(selectedContact) : undefined });
    },
    [findContactById, canDelete],
  );

  const confirmSingleDelete = useCallback(
    (deletionReason?: string) => {
      if (!deleteTarget || !canDelete) return;
      setDeleteTarget(null);
      void removeContact(deleteTarget.id, deleteTarget.name, deletionReason);
    },
    [deleteTarget, canDelete, removeContact],
  );

  const handleUpdateContact = useCallback(
    (updated: Contact): Promise<void> => {
      if (!canWrite) return Promise.resolve();
      return updateContact.mutateAsync({ id: String(updated.id), contact: updated })
        .then(() => undefined)
        .catch((err: unknown) => {
          handleError(err, "contacts.update_contact");
          throw err;
        });
    },
    [canWrite, updateContact, handleError],
  );

  const checkBulkAllowed = useCallback(
    () => canDelete && selected.length > 0,
    [canDelete, selected.length],
  );

  const requestBulkDelete = useCallback(() => {
    if (checkBulkAllowed()) setBulkDeleteOpen(true);
  }, [checkBulkAllowed]);

  const confirmBulkDelete = useCallback(
    (deletionReason?: string) => {
      if (!checkBulkAllowed()) return;
      setBulkDeleteOpen(false);
      void bulkDeleteContactsAction(selected, deletionReason).then(() => setSelected([]));
    },
    [checkBulkAllowed, selected, bulkDeleteContactsAction, setSelected],
  );

  const requestBulkRestore = useCallback(() => {
    if (checkBulkAllowed()) setBulkRestoreOpen(true);
  }, [checkBulkAllowed]);

  const confirmBulkRestore = useCallback(() => {
    if (!checkBulkAllowed()) return;
    setBulkRestoreOpen(false);
    void bulkRestoreContactsAction(selected)
      .then((result) => {
        notifyBulkResult(
          result.succeeded,
          result.failed,
          "contacts.restoreSuccessTitle",
          "contacts.bulkRestoreSuccess",
        );
        setSelected([]);
      })
      .catch((err) => {
        handleError(err, "contacts.bulk_restore", "contacts.restoreFailed");
      });
  }, [
    checkBulkAllowed,
    selected,
    bulkRestoreContactsAction,
    notifyBulkResult,
    handleError,
    setSelected,
  ]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || "").toLowerCase();
      const isInputActive =
        activeTag === "input" ||
        activeTag === "textarea" ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      if ((event.key === "/" || (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey))) && !isInputActive) {
        event.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[type="search"], input[placeholder*="search" i], input[placeholder*="Search" i]',
        );
        searchInput?.focus();
        searchInput?.select();
      } else if (event.key === "Escape") {
        if (selected.length > 0) {
          setSelected([]);
        } else if (hasActiveFilters) {
          clearFilters();
        }
      } else if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "n" &&
        !isInputActive &&
        canWrite &&
        !showDeletedArchives
      ) {
        event.preventDefault();
        handleCreateContact();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selected.length,
    hasActiveFilters,
    clearFilters,
    canWrite,
    showDeletedArchives,
    handleCreateContact,
    setSelected,
  ]);

  const handleImport = useCallback(
    async (list: Contact[]): Promise<void> => {
      if (!canWrite) return;
      await importContacts(list);
    },
    [canWrite, importContacts],
  );

  const handleMerge = useCallback(
    async (keepId: string | number, deleteId: string | number, mergedData: Contact) => {
      if (!canWrite) return;
      await mergeContacts(keepId, deleteId, mergedData);
    },
    [canWrite, mergeContacts],
  );

  const handleRestore = useCallback(
    (id: string | number) => {
      if (!canDelete) return;
      const selectedContact = findContactById(id);
      const name = selectedContact ? getDisplayName(selectedContact) : undefined;
      void restoreContactAction(String(id))
        .then(() => {
          notify.success(t("contacts.restoreSuccessTitle"), {
            description: name
              ? t("contacts.restoreSuccessDescription", { name })
              : t("contacts.restoreSuccessDescriptionDefault"),
          });
        })
        .catch((err) => {
          handleError(err, "contacts.restore_single", "contacts.restoreFailed");
        });
    },
    [canDelete, findContactById, restoreContactAction, t, handleError],
  );

  const toComposerRecipients = useCallback(
    (contacts: Contact[]) =>
      contacts.map((c) =>
        toMessagingRecipient(c, { getDisplayName, getPrimaryPhone, getPrimaryEmail }),
      ),
    [],
  );

  const handleWhatsApp = useCallback(
    (contacts: Contact[]) => {
      openComposer("whatsapp", toComposerRecipients(contacts));
    },
    [openComposer, toComposerRecipients],
  );
  const handleSms = useCallback(
    (contacts: Contact[]) => {
      openComposer("sms", toComposerRecipients(contacts));
    },
    [openComposer, toComposerRecipients],
  );
  const handleEmail = useCallback(
    (contacts: Contact[]) => {
      openComposer("email", toComposerRecipients(contacts));
    },
    [openComposer, toComposerRecipients],
  );

  return {
    t,
    visibleTopTabs,
    effectiveTab,
    activeTab,
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
    handleNew: handleCreateContact,
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
    closeConflictReview,
    openingDuplicates,
    handleOpenDuplicates,
    showDeletedArchives,
    setShowDeletedArchives,
    needsFullContactsList,
    useServerWork,
    workPageData,
    isWorkLoading,
    isWorkError,
    refetchWork,
    isWorkFetching,
    listPage,
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
  };
}
