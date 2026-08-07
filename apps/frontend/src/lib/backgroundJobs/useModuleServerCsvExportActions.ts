import { useCallback } from "react";
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
    columns: TColumn[];
    filename: string;
    label: string;
    ids?: Array<string | number>;
  }) => Promise<BackgroundJobRecord>;
  logExportAudit: {
    mutateAsync: (payload: {
      count: number;
      scope: ModuleCsvExportAuditScope;
    }) => Promise<unknown>;
  };
  onError: (err: unknown, scope: string) => void;
}

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
  const handleExportCSV = useCallback(async () => {
    if (!canExport || trashMode) return;

    try {
      const job = await startExport({
        query: buildFilteredQuery(),
        columns,
        filename,
        label,
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
    }
  }, [
    canExport,
    trashMode,
    buildFilteredQuery,
    columns,
    filename,
    label,
    successMessage,
    startExport,
    logExportAudit,
    auditScope,
    filteredErrorScope,
    onError,
  ]);

  const handleBulkExport = useCallback(async () => {
    if (!canExport || trashMode) return;
    if (selectedIds.length === 0) return;

    try {
      const job = await startExport({
        query: {} as TQuery,
        columns,
        filename,
        label,
        ids: selectedIds,
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
    }
  }, [
    canExport,
    trashMode,
    selectedIds,
    columns,
    filename,
    label,
    successMessage,
    startExport,
    logExportAudit,
    auditScope,
    selectionErrorScope,
    onError,
  ]);

  return {
    handleExportCSV,
    handleBulkExport,
  };
}
