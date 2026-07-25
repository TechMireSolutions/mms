import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePersistedTabState } from "@/hooks/usePersistedTabState";
import type { Contact } from "@mms/shared";
import {
  getPrimaryPhone,
  hasWhatsApp,
  resolveModuleTierTab,
  contactMatchesSearch,
  filterActiveContacts,
  isContactDeleted,
  CONTACTS_MODULE_CONTRACT,
  syncContactScalarFields,
} from "@mms/shared";
import { useFilteredModuleTierTabs } from "@/tenant/hooks/useModuleTierTabs";
import { useTranslation } from "@/hooks/useTranslation";
import { downloadContactsCsv, downloadContactsCsvChunked } from "@/lib/contacts/exportContactsCsv";
import {
  completeContactsBackgroundJob,
  failContactsBackgroundJob,
  startContactsBackgroundJob,
  updateContactsBackgroundJobProgress,
} from "@/lib/contacts/contactsBackgroundJobs";
import { downloadBackgroundJobArtifact } from "@/lib/backgroundJobs/backgroundJobApi";
import { reportClientError } from "@/lib/clientErrorReporting";
import { formatContactGenderLabel } from "@/lib/contacts/contactI18n";
import { startServerContactsCsvExport, startContactsDuplicateScan } from "@/lib/backgroundJobs/startServerContactsCsvExport";
import {
  CONTACTS_WORK_DRILLDOWN_EVENT,
  consumeContactsWorkDrillDown,
  type ContactsWorkDrillDown,
} from "@/lib/contacts/contactsWorkDrillDown";
import { collectLinkedContactIds, mergeContactLinkDirectory } from "@/lib/contacts/contactLinkIds";
import { sortContacts } from "@/lib/contacts/contactSortUtils";
import { notify } from "@/lib/notify";
import {
  useContactMutations,
  useContactsCollectionState,
  useContactsPaginated,
  useContactsByIds,
  CONTACTS_DUPLICATES_QUERY_KEY,
} from "@/tenant/features/contacts/hooks/useContacts";
import { useContactsSyncOutbox } from "@/tenant/features/contacts/hooks/useContactsSyncOutbox";

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

function safeAudit(promise: Promise<unknown>, scope: string): void {
  void promise.catch((auditError) => {
    reportClientError(auditError, { scope });
  });
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
  const [showDeletedArchives, setShowDeletedArchives] = useState(initialShowDeletedArchives);
  const [listPage, setListPage] = useState(1);
  const {
    upsertContact,
    updateContact,
    deleteContact,
    bulkDeleteContacts: bulkDeleteMutation,
    bulkRestoreContacts: bulkRestoreMutation,
    restoreContact: restoreMutation,
    logExportAudit,
    logMergeAudit,
  } = useContactMutations();

  const handleError = useCallback(
    (err: unknown, scope: string, messageKey = "contacts.saveFailed") => {
      notify.error(t(messageKey as any));
      reportClientError(err, { scope });
    },
    [t],
  );

  const saveFailed = useCallback(() => {
    notify.error(t("contacts.saveFailed"));
  }, [t]);

  const saveContact = useCallback(
    async (contact: Contact, isNew: boolean): Promise<void> => {
      try {
        if (isNew) {
          await upsertContact.mutateAsync(contact);
        } else {
          await updateContact.mutateAsync({ id: String(contact.id), contact });
        }
      } catch (err) {
        handleError(err, "contacts.save_contact");
        throw err;
      }
    },
    [upsertContact, updateContact, handleError],
  );

  const removeContact = useCallback(
    async (id: string | number, name?: string, deletionReason?: string): Promise<void> => {
      try {
        await deleteContact.mutateAsync({
          id: String(id),
          ...(deletionReason ? { deletionReason } : {}),
        });
        notify.info(t("contacts.deletedTitle"), {
          description: name
            ? t("contacts.deletedDescription", { name })
            : t("contacts.deletedDescriptionDefault"),
        });
      } catch (err) {
        handleError(err, "contacts.remove_contact");
      }
    },
    [deleteContact, t, handleError],
  );

  const mergeContacts = useCallback(
    async (keepId: string | number, deleteId: string | number, merged: Contact): Promise<void> => {
      try {
        await updateContact.mutateAsync({ id: String(keepId), contact: merged });
        await deleteContact.mutateAsync({ id: String(deleteId) });
        safeAudit(
          logMergeAudit.mutateAsync({
            keepId,
            deleteId,
            mergedName: merged.name || merged.firstName,
          }),
          "contacts.merge_audit",
        );
        notify.success(t("contacts.mergeSuccessTitle"), {
          description: t("contacts.mergeSuccessDesc"),
        });
      } catch (err) {
        handleError(err, "contacts.merge_contacts");
      }
    },
    [updateContact, deleteContact, logMergeAudit, t, handleError],
  );

  const importContacts = useCallback(
    async (list: Contact[]): Promise<void> => {
      let succeeded = 0;
      let failed = 0;
      for (const contact of list) {
        try {
          await upsertContact.mutateAsync(contact);
          succeeded += 1;
        } catch (err) {
          failed += 1;
          reportClientError(err, { scope: "contacts.import_contact_item" });
        }
      }
      if (succeeded > 0 && failed === 0) {
        notify.success(
          list.length === 1
            ? t("contacts.importSuccessOne")
            : t("contacts.importSuccess", { count: succeeded }),
        );
      } else if (succeeded > 0 && failed > 0) {
        notify.warning(t("contacts.bulkPartialFailure", { succeeded, failed }));
      } else {
        saveFailed();
      }
    },
    [upsertContact, t, saveFailed],
  );

  const bulkDeleteContactsAction = useCallback(
    async (ids: (string | number)[], deletionReason?: string): Promise<void> => {
      if (ids.length === 0) return;
      try {
        const result = await bulkDeleteMutation.mutateAsync({
          ids,
          ...(deletionReason ? { deletionReason } : {}),
        });
        if (result.succeeded > 0 && result.failed === 0) {
          notify.success(
            result.succeeded === 1
              ? t("contacts.deletedTitle")
              : t("contacts.bulkDeleteSuccess", { count: result.succeeded }),
          );
        } else if (result.succeeded > 0 && result.failed > 0) {
          notify.warning(t("contacts.bulkPartialFailure", { succeeded: result.succeeded, failed: result.failed }));
        } else {
          saveFailed();
        }
      } catch (err) {
        handleError(err, "contacts.bulk_delete");
      }
    },
    [bulkDeleteMutation, t, saveFailed, handleError],
  );

  const restoreContactAction = useCallback(
    async (id: string): Promise<void> => {
      await restoreMutation.mutateAsync(id);
    },
    [restoreMutation],
  );

  const bulkRestoreContactsAction = useCallback(
    async (ids: (string | number)[]): Promise<{ succeeded: number; failed: number }> => {
      return bulkRestoreMutation.mutateAsync(ids);
    },
    [bulkRestoreMutation],
  );

  const visibleTopTabs = useFilteredModuleTierTabs({
    canViewSetup,
    canViewReports,
  });

  const queryClient = useQueryClient();
  const [viewModeOverride, setViewModeOverride] = useState<"table" | "cards" | null>(null);
  const [conflictPanelOpen, setConflictPanelOpen] = useState(false);
  const [openingDuplicates, setOpeningDuplicates] = useState(false);
  const { conflictCount } = useContactsSyncOutbox();
  const prevConflictCount = useRef(conflictCount);
  const openConflictReview = useCallback(() => setConflictPanelOpen(true), []);
  const closeConflictReview = useCallback(() => setConflictPanelOpen(false), []);

  useEffect(() => {
    if (prevConflictCount.current === 0 && conflictCount > 0) {
      setConflictPanelOpen(true);
    }
    prevConflictCount.current = conflictCount;
  }, [conflictCount]);

  const [search, setSearch] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selected, setSelected] = useState<(string | number)[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [viewContact, setViewContact] = useState<Contact | null>(null);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [messagingTarget, setMessagingTarget] = useState<{ channel: "sms" | "whatsapp" | "email"; contacts: Contact[] } | null>(null);
  const [activeTab, setActiveTab] = usePersistedTabState<string>("contacts_active_tab", "work");
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkRestoreOpen, setBulkRestoreOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string | number; name?: string } | null>(null);

  const effectiveTab = resolveModuleTierTab(activeTab, visibleTopTabs.map((tab) => tab.id));

  useEffect(() => {
    setListPage(1);
  }, [search, filterGender, sortField, sortDir, showDeletedArchives]);

  const needsFullContactsList = showDeletedArchives || effectiveTab === "setup";

  const { contacts: rawContacts, isLoading: isContactsLoading } = useContactsCollectionState({
    enabled: needsFullContactsList,
    includeDeleted: showDeletedArchives && canDelete,
  });

  const useServerWork = !showDeletedArchives && effectiveTab === "work";
  const workLimit = CONTACTS_MODULE_CONTRACT.defaultPageSize;

  const { data: workPageData, isFetching: isWorkPageFetching } = useContactsPaginated({
    page: listPage,
    limit: workLimit,
    search,
    gender: filterGender,
    sortField,
    sortDir,
    enabled: useServerWork,
  });

  const contacts = useMemo(() => {
    return showDeletedArchives
      ? (rawContacts || []).filter(isContactDeleted)
      : filterActiveContacts(rawContacts || []);
  }, [rawContacts, showDeletedArchives]);

  const applyDrillDown = useCallback(
    (filter: ContactsWorkDrillDown) => {
      if (filter.gender) setFilterGender(filter.gender);
      if (filter.search) setSearch(filter.search);
      setActiveTab("work");
    },
    [setActiveTab],
  );

  useEffect(() => {
    const pending = consumeContactsWorkDrillDown();
    if (pending) applyDrillDown(pending);

    const handler = (event: Event) => {
      const detail = (event as CustomEvent<ContactsWorkDrillDown>).detail;
      if (detail) applyDrillDown(detail);
    };
    window.addEventListener(CONTACTS_WORK_DRILLDOWN_EVENT, handler);
    return () => window.removeEventListener(CONTACTS_WORK_DRILLDOWN_EVENT, handler);
  }, [applyDrillDown]);

  const exportLabels = useMemo(
    () => ({ yes: t("common.yes"), no: t("common.no") }),
    [t],
  );

  const runExport = useCallback(
    (rows: Contact[], scope: "filtered" | "selection") => {
      const filename = t("contacts.exportFilename");
      const finish = () => {
        notify.success(t("contacts.exportSuccess"));
        safeAudit(logExportAudit.mutateAsync({ count: rows.length, scope }), "contacts.export_audit");
      };
      const fail = (err?: unknown) => {
        notify.error(t("contacts.exportFailed"));
        if (err) reportClientError(err, { scope: "contacts.export_csv" });
      };

      if (rows.length > CONTACTS_MODULE_CONTRACT.exportInlineMaxRows) {
        const jobId = startContactsBackgroundJob(
          "export",
          t("contacts.jobs.exportLabel", { count: rows.length }),
          rows.length,
        );
        void downloadContactsCsvChunked(rows, tableColumns, exportLabels, filename, {
          chunkSize: CONTACTS_MODULE_CONTRACT.exportChunkSize,
          onProgress: (processed, total) => {
            updateContactsBackgroundJobProgress(jobId, processed, total);
          },
        })
          .then(() => {
            completeContactsBackgroundJob(jobId);
            finish();
          })
          .catch((err) => {
            failContactsBackgroundJob(jobId, t("contacts.exportFailed"));
            fail(err);
          });
        return;
      }

      try {
        downloadContactsCsv(rows, tableColumns, exportLabels, filename);
        finish();
      } catch (err) {
        fail(err);
      }
    },
    [tableColumns, exportLabels, t, logExportAudit],
  );

  const defaultCountry = prefs.defaultCountry || "";
  const defaultCity = prefs.defaultCity || "";
  const defaultProvince = prefs.defaultProvince || "";

  const genderLabel = useCallback(
    (gender: string) => formatContactGenderLabel(gender, t),
    [t],
  );

  const filtered = useMemo(() => {
    const list = contacts.filter((contact) => {
      if (!contactMatchesSearch(contact, search)) return false;
      if (filterGender && contact.gender !== filterGender) return false;
      return true;
    });
    return sortContacts(list, sortField, sortDir);
  }, [contacts, search, filterGender, sortField, sortDir]);

  const workContacts = useMemo(() => {
    return useServerWork ? (workPageData?.contacts ?? []) : filtered;
  }, [useServerWork, workPageData?.contacts, filtered]);

  // Centralized linked contact directory resolution (SSOT)
  const linkSourceContacts = useMemo(() => {
    const rows = [...workContacts];
    if (editContact) rows.push(editContact);
    if (viewContact) rows.push(viewContact);
    return rows;
  }, [workContacts, editContact, viewContact]);

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

  const selectedTargets = useMemo(() => {
    if (selected.length === 0) return { waTargets: [], smsReady: [] };
    const pool = showDeletedArchives ? contacts : workContacts;
    const targets = pool.filter((contact) => selected.includes(contact.id));
    const waTargets = targets.filter((contact) => hasWhatsApp(contact));
    const smsReady = targets.filter((contact) => Boolean(getPrimaryPhone(contact)));
    return { waTargets, smsReady };
  }, [selected, workContacts, contacts, showDeletedArchives]);

  const shownCount = useServerWork && workPageData ? workPageData.total : filtered.length;
  const workTruncated = useServerWork && Boolean(workPageData?.hasMore);

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

  const hasActiveFilters = !!(filterGender || search);
  const activeFilterCount = filterGender ? 1 : 0;

  const handleSort = useCallback((field: string) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("asc");
    }
  }, [sortField]);

  const handleSelect = useCallback(
    (id: string | number) => setSelected((selectedIds) => (selectedIds.includes(id) ? selectedIds.filter((selectedId) => selectedId !== id) : [...selectedIds, id])),
    [],
  );
  const handleSelectAll = useCallback(
    () => setSelected((selectedIds) => (selectedIds.length === workContacts.length ? [] : workContacts.map((contact) => contact.id))),
    [workContacts],
  );

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

  const handleSave = useCallback(
    (contactDraft: Contact) => {
      if (!canWrite) return;
      const isCreatingContact = !editContact;
      const basePayload = syncContactScalarFields(contactDraft);

      const payload: Contact = {
        ...(editContact || {}),
        ...contactDraft,
        ...basePayload,
        phones: contactDraft.phones || [],
        emails: contactDraft.emails || [],
        addresses: contactDraft.addresses || [],
        socials: contactDraft.socials || [],
        emergencyContacts: contactDraft.emergencyContacts || [],
      } as Contact;

      void saveContact(payload, isCreatingContact)
        .then(() => {
          setShowForm(false);
          setEditContact(null);
        })
        .catch(() => {
          /* saveContact handles error reporting */
        });
    },
    [editContact, saveContact, canWrite],
  );

  const handleDelete = useCallback(
    (id: string | number) => {
      if (!canDelete) return;
      const selectedContact = workContacts.find((contact) => contact.id === id) ?? contacts.find((contact) => contact.id === id);
      setDeleteTarget({ id, name: selectedContact?.name || selectedContact?.firstName });
    },
    [workContacts, contacts, canDelete],
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

  const handleExportCSV = useCallback(async () => {
    if (!canExport) return;
    if (showDeletedArchives) {
      runExport(filtered, "filtered");
      return;
    }

    const filename = t("contacts.exportFilename");
    const label = t("contacts.jobs.exportLabelServer");

    try {
      const job = await startServerContactsCsvExport({
        query: {
          search,
          gender: filterGender || undefined,
          sortField,
          sortDir,
        },
        columns: tableColumns,
        filename,
        label,
      });
      if (job.hasDownload && job.status === "completed") {
        await downloadBackgroundJobArtifact(job.id, filename);
      }
      notify.success(t("contacts.exportSuccess"));
      safeAudit(
        logExportAudit.mutateAsync({ count: job.progress?.total ?? 0, scope: "filtered" }),
        "contacts.export_audit",
      );
    } catch (err) {
      handleError(err, "contacts.server_export_csv", "contacts.exportFailed");
    }
  }, [
    filtered,
    runExport,
    canExport,
    showDeletedArchives,
    search,
    filterGender,
    sortField,
    sortDir,
    tableColumns,
    t,
    logExportAudit,
    handleError,
  ]);

  const handleBulkExport = useCallback(() => {
    if (!canExport) return;
    const rows = workContacts.filter((contact) => selected.includes(contact.id));
    if (rows.length === 0) return;
    runExport(rows, "selection");
  }, [workContacts, selected, runExport, canExport]);

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
    [checkBulkAllowed, selected, bulkDeleteContactsAction],
  );

  const requestBulkRestore = useCallback(() => {
    if (checkBulkAllowed()) setBulkRestoreOpen(true);
  }, [checkBulkAllowed]);

  const confirmBulkRestore = useCallback(() => {
    if (!checkBulkAllowed()) return;
    setBulkRestoreOpen(false);
    void bulkRestoreContactsAction(selected)
      .then((result) => {
        if (result.succeeded > 0) {
          notify.success(
            result.succeeded === 1
              ? t("contacts.restoreSuccessTitle")
              : t("contacts.bulkRestoreSuccess", { count: result.succeeded }),
          );
        }
        setSelected([]);
      })
      .catch((err) => {
        handleError(err, "contacts.bulk_restore", "contacts.restoreFailed");
      });
  }, [checkBulkAllowed, selected, bulkRestoreContactsAction, t, handleError]);

  const clearFilters = useCallback(() => {
    setFilterGender("");
    setSearch("");
  }, []);

  const handleImport = useCallback(
    (list: Contact[]) => {
      if (!canWrite) return;
      void importContacts(list);
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
      const selectedContact = contacts.find((contact) => contact.id === id);
      void restoreContactAction(String(id))
        .then(() => {
          notify.success(t("contacts.restoreSuccessTitle"), {
            description: selectedContact?.name
              ? t("contacts.restoreSuccessDescription", { name: selectedContact.name })
              : t("contacts.restoreSuccessDescriptionDefault"),
          });
        })
        .catch((err) => {
          handleError(err, "contacts.restore_single", "contacts.restoreFailed");
        });
    },
    [canDelete, contacts, restoreContactAction, t, handleError],
  );

  const createMessagingHandler = useCallback(
    (channel: "sms" | "whatsapp" | "email") => (targets: Contact[]) => {
      setMessagingTarget({ channel, contacts: targets });
    },
    [],
  );

  const handleWhatsApp = useMemo(() => createMessagingHandler("whatsapp"), [createMessagingHandler]);
  const handleSms = useMemo(() => createMessagingHandler("sms"), [createMessagingHandler]);
  const handleEmail = useMemo(() => createMessagingHandler("email"), [createMessagingHandler]);

  return {
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
    viewContact,
    setViewContact,
    showDuplicates,
    setShowDuplicates,
    messagingTarget,
    setMessagingTarget,
    handleWhatsApp,
    handleSms,
    handleEmail,
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
    rawContacts,
    isContactsLoading,
    useServerWork,
    workPageData,
    isWorkPageFetching,
    listPage,
    setListPage,
    workContacts,
    allContactsForLinks,
    selectedTargets,
    shownCount,
    workTruncated,
  };
}
