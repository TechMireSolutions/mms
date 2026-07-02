import { useState, useMemo, useCallback, useEffect } from "react";
import type { AppTranslationKey, Contact, PhoneNumber } from "@mms/shared";
import {
  parsePhoneNumber,
  resolveModuleTierTab,
  contactMatchesSearch,
  filterActiveContacts,
  isContactDeleted,
  CONTACTS_MODULE_CONTRACT,
} from "@mms/shared";
import { useModuleTierTabs } from "@/tenant/hooks/useModuleTierTabs";
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
import { startServerContactsCsvExport } from "@/lib/backgroundJobs/startServerContactsCsvExport";
import {
  CONTACTS_WORK_DRILLDOWN_EVENT,
  consumeContactsWorkDrillDown,
  type ContactsWorkDrillDown,
} from "@/lib/contacts/contactsWorkDrillDown";
import { notify } from "@/lib/notify";
import type { useContactsPageActions } from "@/tenant/features/contacts/hooks/useContactsPageActions";

type PageActions = ReturnType<typeof useContactsPageActions>;

export interface UseContactsPageStateOptions {
  rawContacts: Contact[];
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
  pageActions: PageActions;
  updatePrefs: (patch: Record<string, unknown>) => void;
  showDeletedArchives?: boolean;
  /** Server-paginated Work rows; when set, used for select-all, bulk export, and row lookup. */
  directoryRows?: Contact[];
  /** Ref updated after paginated Work fetch — avoids hook order cycle with useContactsPaginated. */
  directoryRowsRef?: React.MutableRefObject<Contact[] | undefined>;
}

export function useContactsPageState({
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
  updatePrefs,
  showDeletedArchives = false,
  directoryRows,
  directoryRowsRef,
}: UseContactsPageStateOptions) {
  const PAGE_TABS = useModuleTierTabs();
  const { t } = useTranslation();
  const { saveContact, removeContact, mergeContacts, importContacts, updateContact, bulkDeleteContacts, bulkRestoreContacts, restoreContact, logExportAudit } =
    pageActions;

  const visibleTopTabs = useMemo(
    () =>
      PAGE_TABS.filter((tab) => {
        if (tab.id === "setup") return canViewSetup;
        if (tab.id === "reports") return canViewReports;
        return true;
      }),
    [PAGE_TABS, canViewSetup, canViewReports],
  );

  const contacts = useMemo(() => {
    const country = prefs?.defaultCountry || "";
    const defaultCode = countryCodesMap[country] || "";
    const source = showDeletedArchives
      ? rawContacts.filter(isContactDeleted)
      : filterActiveContacts(rawContacts);
    return source.map((contact) => {
      const base = {
        relationships: [],
        activities: [],
        ...contact,
      } as Contact;
      if (base.phones && Array.isArray(base.phones)) {
        return {
          ...base,
          phones: base.phones.map((phone: PhoneNumber) => {
            if (phone.countryCode) return phone;
            const parsed = parsePhoneNumber(phone.number, defaultCode, Object.values(countryCodesMap));
            return {
              ...phone,
              countryCode: parsed.countryCode,
              number: parsed.number,
            };
          }),
        };
      }
      return base;
    });
  }, [rawContacts, showDeletedArchives, prefs?.defaultCountry, countryCodesMap]);

  const [search, setSearch] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selected, setSelected] = useState<(string | number)[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [messagingTarget, setMessagingTarget] = useState<{ channel: 'sms' | 'whatsapp'; contacts: Contact[] } | null>(null);
  const [activeTab, setActiveTab] = useState("work");
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkRestoreOpen, setBulkRestoreOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string | number; name?: string } | null>(null);

  const effectiveTab = resolveModuleTierTab(activeTab, visibleTopTabs.map((tab) => tab.id));

  const applyDrillDown = useCallback(
    (filter: ContactsWorkDrillDown) => {
      if (filter.gender) setFilterGender(filter.gender);
      if (filter.search) setSearch(filter.search);
      setActiveTab("work");
    },
    [],
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
  }, [activeTab, effectiveTab]);

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
    (gender: string) => {
      const key = `contacts.gender.${gender.toLowerCase()}` as AppTranslationKey;
      const translated = t(key);
      return translated === key ? gender.charAt(0).toUpperCase() + gender.slice(1) : translated;
    },
    [t],
  );

  const filtered = useMemo(() => {
    const list = contacts.filter((contact) => {
      if (!contactMatchesSearch(contact, search)) return false;
      if (filterGender && contact.gender !== filterGender) return false;
      return true;
    });
    return [...list].sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";

      av = typeof a[sortField] === "number" ? (a[sortField] as number) : String(a[sortField] || "").toLowerCase();
      bv = typeof b[sortField] === "number" ? (b[sortField] as number) : String(b[sortField] || "").toLowerCase();

      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, [contacts, search, filterGender, sortField, sortDir]);

  const rowSource = directoryRowsRef?.current ?? directoryRows ?? filtered;

  const hasActiveFilters = !!(filterGender || search);
  const activeFilterCount = (filterGender ? 1 : 0);

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
      const payload = editContact ? { ...editContact, ...contactDraft } : contactDraft;
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
    (updated: Contact) => {
      if (!canWrite) return;
      void updateContact.mutateAsync({ id: String(updated.id), contact: updated }).catch(() => {
        notify.error(t("contacts.saveFailed"));
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
      void bulkDeleteContacts(selected, deletionReason).then(() => setSelected([]));
    },
    [canDelete, selected, bulkDeleteContacts],
  );

  const requestBulkRestore = useCallback(() => {
    if (!canDelete || selected.length === 0) return;
    setBulkRestoreOpen(true);
  }, [canDelete, selected.length]);

  const confirmBulkRestore = useCallback(() => {
    if (!canDelete || selected.length === 0) return;
    setBulkRestoreOpen(false);
    void bulkRestoreContacts(selected)
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
  }, [canDelete, selected, bulkRestoreContacts, t]);

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
      void restoreContact(String(id))
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
    [canDelete, contacts, restoreContact, t],
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
  };
}
