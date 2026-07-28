import type { Contact } from "@mms/shared";
import { CONTACTS_MODULE_MANIFEST } from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { downloadContactsCsv, downloadContactsCsvChunked } from "@/lib/contacts/exportContactsCsv";
import {
  completeContactsBackgroundJob,
  failContactsBackgroundJob,
  startContactsBackgroundJob,
  updateContactsBackgroundJobProgress,
} from "@/lib/contacts/contactsBackgroundJobs";
import { reportClientError } from "@/lib/clientErrorReporting";
import { notify } from "@/lib/notify";
import { safeAudit } from "@/tenant/features/contacts/hooks/useContactsCrudActions";

export function runContactsCsvExport({
  rows,
  scope,
  tableColumns,
  exportLabels,
  t,
  logExportAudit,
}: {
  rows: Contact[];
  scope: "filtered" | "selection";
  tableColumns: Array<{ id: string; label: string }>;
  exportLabels: { yes: string; no: string };
  t: TranslationFunction;
  logExportAudit: {
    mutateAsync: (payload: {
      count: number;
      scope: "all" | "filtered" | "selection";
    }) => Promise<unknown>;
  };
}): void {
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
}
