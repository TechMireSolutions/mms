import { useMemo, useCallback } from "react";
import type { Contact, ContactsQuickFilter, AppTranslationKey } from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { downloadBackgroundJobArtifact } from "@/lib/backgroundJobs/backgroundJobApi";
import { startServerContactsCsvExport } from "@/lib/backgroundJobs/startServerContactsCsvExport";
import { notify } from "@/lib/notify";
import { safeAudit } from "@/tenant/features/contacts/hooks/useContactsCrudActions";
import { runContactsCsvExport } from "@/tenant/features/contacts/hooks/runContactsCsvExport";

export interface UseContactsExportActionsOptions {
  tableColumns: Array<{ id: string; label: string }>;
  canExport: boolean;
  search: string;
  filterGender: string;
  sortField: string;
  sortDir: "asc" | "desc";
  quickFilter: ContactsQuickFilter;
  showDeletedArchives: boolean;
  workContacts: Contact[];
  selected: (string | number)[];
  logExportAudit: {
    mutateAsync: (payload: {
      count: number;
      scope: "all" | "filtered" | "selection";
    }) => Promise<unknown>;
  };
  handleError: (err: unknown, scope: string, messageKey?: AppTranslationKey) => void;
  t: TranslationFunction;
}

export function useContactsExportActions({
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
}: UseContactsExportActionsOptions) {
  const exportLabels = useMemo(
    () => ({ yes: t("common.yes"), no: t("common.no") }),
    [t],
  );

  const runExport = useCallback(
    (rows: Contact[], scope: "filtered" | "selection") => {
      runContactsCsvExport({
        rows,
        scope,
        tableColumns,
        exportLabels,
        t,
        logExportAudit,
      });
    },
    [tableColumns, exportLabels, t, logExportAudit],
  );

  const handleExportCSV = useCallback(async () => {
    if (!canExport || showDeletedArchives) return;

    const filename = t("contacts.exportFilename");
    const label = t("contacts.jobs.exportLabelServer");

    try {
      const job = await startServerContactsCsvExport({
        query: {
          search,
          gender: filterGender || undefined,
          sortField,
          sortDir,
          quickFilter,
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
    canExport,
    showDeletedArchives,
    search,
    filterGender,
    sortField,
    sortDir,
    quickFilter,
    tableColumns,
    t,
    logExportAudit,
    handleError,
  ]);

  const handleBulkExport = useCallback(() => {
    if (!canExport || showDeletedArchives) return;
    const rows = workContacts.filter((contact) => selected.includes(contact.id));
    if (rows.length === 0) return;
    runExport(rows, "selection");
  }, [workContacts, selected, runExport, canExport, showDeletedArchives]);

  return {
    runExport,
    handleExportCSV,
    handleBulkExport,
  };
}
