import { useMemo, useCallback } from "react";
import type { Contact, ContactsQuickFilter, AppTranslationKey } from "@mms/shared";
import { CONTACTS_MODULE_MANIFEST } from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
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
import { notify } from "@/lib/notify";
import { fetchAllContactsForQuery } from "@/tenant/features/contacts/hooks/useContacts";
import { safeAudit } from "@/tenant/features/contacts/hooks/useContactsCrudActions";

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
      const filename = t("contacts.exportFilename");
      const finish = () => {
        notify.success(t("contacts.exportSuccess"));
        safeAudit(logExportAudit.mutateAsync({ count: rows.length, scope }), "contacts.export_audit");
      };
      const fail = (err?: unknown) => {
        notify.error(t("contacts.exportFailed"));
        if (err) reportClientError(err, { scope: "contacts.export_csv" });
      };

      if (rows.length > CONTACTS_MODULE_MANIFEST.exportInlineMaxRows) {
        const jobId = startContactsBackgroundJob(
          "export",
          t("contacts.jobs.exportLabel", { count: rows.length }),
          rows.length,
        );
        void downloadContactsCsvChunked(rows, tableColumns, exportLabels, filename, {
          chunkSize: CONTACTS_MODULE_MANIFEST.exportChunkSize,
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

  const handleExportCSV = useCallback(async () => {
    if (!canExport) return;

    const filename = t("contacts.exportFilename");
    if (showDeletedArchives) {
      try {
        const rows = await fetchAllContactsForQuery({
          search,
          gender: filterGender || undefined,
          sortField,
          sortDir,
          quickFilter,
          includeDeleted: true,
        });
        runExport(rows, "filtered");
      } catch (err) {
        handleError(err, "contacts.export_deleted_csv", "contacts.exportFailed");
      }
      return;
    }

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
    runExport,
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
    if (!canExport) return;
    const rows = workContacts.filter((contact) => selected.includes(contact.id));
    if (rows.length === 0) return;
    runExport(rows, "selection");
  }, [workContacts, selected, runExport, canExport]);

  return {
    runExport,
    handleExportCSV,
    handleBulkExport,
  };
}
