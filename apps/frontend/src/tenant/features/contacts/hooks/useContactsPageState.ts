import { useState, useMemo, useCallback, useEffect } from "react";
import { usePersistedTabState } from "@/hooks/usePersistedTabState";
import type { Contact } from "@mms/shared";
import {
  getPrimaryPhone,
  getPrimaryEmail,
  getPrimaryAddress,
  resolveModuleTierTab,
  contactMatchesSearch,
  filterActiveContacts,
  isContactDeleted,
  CONTACTS_MODULE_CONTRACT,
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
import { startServerContactsCsvExport } from "@/lib/backgroundJobs/startServerContactsCsvExport";
import {
  CONTACTS_WORK_DRILLDOWN_EVENT,
  consumeContactsWorkDrillDown,
  type ContactsWorkDrillDown,
} from "@/lib/contacts/contactsWorkDrillDown";
import { notify } from "@/lib/notify";
import { useContactMutations, useContactsCollectionState, useContactsPaginated } from "@/tenant/features/contacts/hooks/useContacts";

export interface UseContactsPageStateOptions {
  prefs: {
    defaultCountry?: string;
    defaultCity?: string;
    defaultProvince?: string;
  };
  countryCodesMap: Record<string, string>;
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
      } catch {
        saveFailed();
        throw new Error("contact_save_failed");
      }
    },
    [upsertContact, updateContact, saveFailed],
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
      } catch {
        saveFailed();
      }
    },
    [deleteContact, t, saveFailed],
  );

  const mergeContacts = useCallback(
    async (keepId: string | number, deleteId: string | number, merged: Contact): Promise<void> => {
      try {
        await updateContact.mutateAsync({ id: String(keepId), contact: merged });
        await deleteContact.mutateAsync({ id: String(deleteId) });
        void logMergeAudit
          .mutateAsync({
            keepId,
            deleteId,
            mergedName: merged.name || merged.firstName,
          })
          .catch((auditError) => {
            reportClientError(auditError, { scope: "contacts.merge_audit" });
          });
        notify.success(t("contacts.mergeSuccessTitle"), {
          description: t("contacts.mergeSuccessDesc"),
        });
      } catch {
        saveFailed();
      }
    },
    [updateContact, deleteContact, logMergeAudit, t, saveFailed],
  );

  const importContacts = useCallback(
    async (list: Contact[]): Promise<void> => {
      let succeeded = 0;
      let failed = 0;
      for (const contact of list) {
        try {
          await upsertContact.mutateAsync(contact);
          succeeded += 1;
        } catch {
          failed += 1;
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
      } catch {
        saveFailed();
      }
    },
    [bulkDeleteMutation, t, saveFailed],
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

  const [search, setSearch] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selected, setSelected] = useState<(string | number)[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
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

  useEffect(() => {
    if (effectiveTab !== activeTab) {
      setActiveTab(effectiveTab);
    }
  }, [activeTab, effectiveTab, setActiveTab]);

  const exportLabels = useMemo(
    () => ({ yes: t("common.yes"), no: t("common.no") }),
    [t],
  );

  const runExport = useCallback(
    (rows: Contact[], scope: "filtered" | "selection") => {
      const filename = t("contacts.exportFilename");
      const finish = () => {
        notify.success(t("contacts.exportSuccess"));
        void logExportAudit.mutateAsync({ count: rows.length, scope }).catch((auditError) => {
          reportClientError(auditError, { scope: "contacts.export_audit" });
        });
      };
      const fail = () => notify.error(t("contacts.exportFailed"));

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
          .catch(() => {
            failContactsBackgroundJob(jobId, t("contacts.exportFailed"));
            fail();
          });
        return;
      }

      try {
        downloadContactsCsv(rows, tableColumns, exportLabels, filename);
        finish();
      } catch {
        fail();
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
    return [...list].sort((a, b) => {
      const recA = a as Record<string, unknown>;
      const recB = b as Record<string, unknown>;
      const av = typeof recA[sortField] === "number" ? (recA[sortField] as number) : String(recA[sortField] || "").toLowerCase();
      const bv = typeof recB[sortField] === "number" ? (recB[sortField] as number) : String(recB[sortField] || "").toLowerCase();

      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, [contacts, search, filterGender, sortField, sortDir]);

  const workContacts = useMemo(() => {
    return useServerWork ? (workPageData?.contacts ?? []) : filtered;
  }, [useServerWork, workPageData?.contacts, filtered]);

  const shownCount = useServerWork && workPageData ? workPageData.total : filtered.length;
  const workTruncated = useServerWork && Boolean(workPageData?.hasMore);

  const rowSource = useMemo(
    () => (useServerWork ? (workPageData?.contacts ?? []) : filtered),
    [useServerWork, workPageData?.contacts, filtered],
  );

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
    () => setSelected((selectedIds) => (selectedIds.length === rowSource.length ? [] : rowSource.map((contact) => contact.id))),
    [rowSource],
  );

  const handleEdit = useCallback(
    (contact: Contact) => {
      if (!canWrite) return;
      setEditContact(contact);
      setShowForm(true);
    },
    [canWrite],
  );

  const handleCreateContact = useCallback(() => {
    if (!canWrite) return;
    setEditContact(null);
    setShowForm(true);
  }, [canWrite]);

  const handleSave = useCallback(
    (contactDraft: Contact) => {
      if (!canWrite) return;
      const isCreatingContact = !editContact;
      const primaryPhoneStr = getPrimaryPhone(contactDraft);
      const primaryEmailStr = getPrimaryEmail(contactDraft);
      const firstAddr = getPrimaryAddress(contactDraft);

      const basePayload = {
        phone: primaryPhoneStr || undefined,
        email: primaryEmailStr || undefined,
        line1: firstAddr?.line1 || undefined,
        city: firstAddr?.city || undefined,
        state: firstAddr?.state || undefined,
        country: firstAddr?.country || undefined,
      };

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
          /* saveContact notifies on failure */
        });
    },
    [editContact, saveContact, canWrite],
  );

  const handleDelete = useCallback(
    (id: string | number) => {
      if (!canDelete) return;
      const selectedContact = rowSource.find((contact) => contact.id === id) ?? contacts.find((contact) => contact.id === id);
      setDeleteTarget({ id, name: selectedContact?.name || selectedContact?.firstName });
    },
    [rowSource, contacts, canDelete],
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
          notify.error(t("contacts.saveFailed"));
          throw err;
        });
    },
    [canWrite, updateContact, t],
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
      void logExportAudit
        .mutateAsync({ count: job.progress?.total ?? 0, scope: "filtered" })
        .catch((auditError) => {
          reportClientError(auditError, { scope: "contacts.export_audit" });
        });
    } catch {
      notify.error(t("contacts.exportFailed"));
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
  ]);

  const handleBulkExport = useCallback(() => {
    if (!canExport) return;
    const rows = rowSource.filter((contact) => selected.includes(contact.id));
    if (rows.length === 0) return;
    runExport(rows, "selection");
  }, [rowSource, selected, runExport, canExport]);

  const requestBulkDelete = useCallback(() => {
    if (!canDelete || selected.length === 0) return;
    setBulkDeleteOpen(true);
  }, [canDelete, selected.length]);

  const confirmBulkDelete = useCallback(
    (deletionReason?: string) => {
      if (!canDelete || selected.length === 0) return;
      setBulkDeleteOpen(false);
      void bulkDeleteContactsAction(selected, deletionReason).then(() => setSelected([]));
    },
    [canDelete, selected, bulkDeleteContactsAction],
  );

  const requestBulkRestore = useCallback(() => {
    if (!canDelete || selected.length === 0) return;
    setBulkRestoreOpen(true);
  }, [canDelete, selected.length]);

  const confirmBulkRestore = useCallback(() => {
    if (!canDelete || selected.length === 0) return;
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
      .catch(() => {
        notify.error(t("contacts.restoreFailed"));
      });
  }, [canDelete, selected, bulkRestoreContactsAction, t]);

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
    (keepId: string | number, deleteId: string | number, mergedData: Contact) => {
      if (!canWrite) return;
      void mergeContacts(keepId, deleteId, mergedData);
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
        .catch(() => {
          notify.error(t("contacts.restoreFailed"));
        });
    },
    [canDelete, contacts, restoreContactAction, t],
  );

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
    shownCount,
    workTruncated,
  };
}
