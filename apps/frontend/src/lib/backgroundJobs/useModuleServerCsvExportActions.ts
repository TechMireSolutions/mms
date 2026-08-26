import { useState } from "react";
import type { BackgroundJobRecord } from "@mms/shared";
import { downloadBackgroundJobArtifact } from "@/lib/backgroundJobs/backgroundJobApi";
import { notify } from "@/lib/notify";
import { safeAudit } from "@/lib/safeAudit";

export type ModuleCsvExportAuditScope = "all" | "filtered" | "selection";

export interface ModuleServerCsvExportColumn {
  id: string;
  label: string;
}

export interface UseModuleServerCsvExportActionsOptions<
  TColumn extends ModuleServerCsvExportColumn = ModuleServerCsvExportColumn,
  TQuery = Record<string, unknown>,
> {
  canExport: boolean;
  /** When true (trash / archived view), export handlers no-op. */
  trashMode: boolean;
  selectedIds: Array<string | number>;
  columns: TColumn[];
  filename: string;
  label: string;
  successMessage: string;
  auditScope: string;
  filteredErrorScope: string;
  selectionErrorScope: string;
  buildFilteredQuery: () => TQuery;
  startExport: (options: {
    query: TQuery;
    columns: ModuleServerCsvExportColumn[];
    filename: string;
    label: string;
    ids?: Array<string | number>;
    idempotencyKey?: string;
  }) => Promise<BackgroundJobRecord>;
  logExportAudit: {
    mutateAsync: (payload: {
      count: number;
      scope: ModuleCsvExportAuditScope;
    }) => Promise<unknown>;
  };
  onError: (err: unknown, scope: string) => void;
}

const sanitizeColumns = (cols: ModuleServerCsvExportColumn[]) =>
  cols.map((c) => ({ id: c.id, label: c.label }));

/** Shared filtered + selection server CSV export flow (Contacts / Students). */
export function useModuleServerCsvExportActions<
  TColumn extends ModuleServerCsvExportColumn = ModuleServerCsvExportColumn,
  TQuery = Record<string, unknown>,
>({
  canExport,
  trashMode,
  selectedIds,
  columns,
  filename,
  label,
  successMessage,
  auditScope,
  filteredErrorScope,
  selectionErrorScope,
  buildFilteredQuery,
  startExport,
  logExportAudit,
  onError,
}: UseModuleServerCsvExportActionsOptions<TColumn, TQuery>) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCSV = async () => {
    if (!canExport || trashMode || isExporting) return;
    setIsExporting(true);

    try {
      const job = await startExport({
        query: buildFilteredQuery(),
        columns: sanitizeColumns(columns),
        filename,
        label,
        idempotencyKey: crypto.randomUUID(),
      });
      if (job.hasDownload && job.status === "completed") {
        await downloadBackgroundJobArtifact(job.id, filename);
      }
      notify.success(successMessage);
      safeAudit(
        logExportAudit.mutateAsync({
          count: job.progress?.total ?? 0,
          scope: "filtered",
        }),
        auditScope,
      );
    } catch (err) {
      onError(err, filteredErrorScope);
    } finally {
      setIsExporting(false);
    }
  };

  const handleBulkExport = async () => {
    if (!canExport || trashMode || isExporting) return;
    if (selectedIds.length === 0) return;
    setIsExporting(true);

    try {
      const job = await startExport({
        query: {} as TQuery,
        columns: sanitizeColumns(columns),
        filename,
        label,
        ids: selectedIds,
        idempotencyKey: crypto.randomUUID(),
      });
      if (job.hasDownload && job.status === "completed") {
        await downloadBackgroundJobArtifact(job.id, filename);
      }
      notify.success(successMessage);
      safeAudit(
        logExportAudit.mutateAsync({
          count: job.progress?.total ?? selectedIds.length,
          scope: "selection",
        }),
        auditScope,
      );
    } catch (err) {
      onError(err, selectionErrorScope);
    } finally {
      setIsExporting(false);
    }
  };

  return {
    handleExportCSV,
    handleBulkExport,
    isExporting,
  };
}
