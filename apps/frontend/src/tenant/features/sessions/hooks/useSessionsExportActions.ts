import { useCallback } from "react";
import type { SessionExportColumn, SessionsListQuery } from "@mms/shared";
import { startServerSessionsCsvExport } from "@/lib/backgroundJobs/startServerSessionsCsvExport";
import { useModuleServerCsvExportActions } from "@/lib/backgroundJobs/useModuleServerCsvExportActions";
import type { SessionSortField } from "@/tenant/features/sessions/components/sessionPageTypes";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";

type ExportAuditScope = "all" | "filtered" | "selection";

export interface UseSessionsExportActionsOptions {
  tableColumns: SessionExportColumn[];
  canExport: boolean;
  search: string;
  filterStatus: string[];
  filterType: string[];
  sortField: SessionSortField;
  sortDir: "asc" | "desc";
  viewingDeleted: boolean;
  selectedIds: string[];
  logExportAudit: {
    mutateAsync: (payload: {
      count: number;
      scope: ExportAuditScope;
    }) => Promise<unknown>;
  };
}

/** Server CSV export actions for Sessions Work (Students-shaped shared factory). */
export function useSessionsExportActions({
  tableColumns,
  canExport,
  search,
  filterStatus,
  filterType,
  sortField,
  sortDir,
  viewingDeleted,
  selectedIds,
  logExportAudit,
}: UseSessionsExportActionsOptions) {
  const { t } = useTranslation();

  const buildFilteredQuery = useCallback(
    (): SessionsListQuery => ({
      search: search.trim() || undefined,
      status: filterStatus.length > 0 ? filterStatus.join(",") : undefined,
      type: filterType.length > 0 ? filterType.join(",") : undefined,
      sortField,
      sortDir,
    }),
    [search, filterStatus, filterType, sortField, sortDir],
  );

  const onError = useCallback(
    () => {
      notify.error(t("sessions.exportFailed"));
    },
    [t],
  );

  return useModuleServerCsvExportActions<SessionExportColumn, SessionsListQuery>({
    canExport,
    trashMode: viewingDeleted,
    selectedIds,
    columns: tableColumns,
    filename: t("sessions.exportFilename"),
    label: t("sessions.jobs.exportLabelServer"),
    successMessage: t("sessions.exportSuccess"),
    auditScope: "sessions.export_audit",
    filteredErrorScope: "sessions.server_export_csv",
    selectionErrorScope: "sessions.server_export_csv_selection",
    buildFilteredQuery,
    startExport: startServerSessionsCsvExport,
    logExportAudit,
    onError,
  });
}

/** Default Work export columns when registry is unavailable. */
export function defaultSessionsExportColumns(
  t: (
    key:
      | "sessions.columns.name"
      | "sessions.columns.type"
      | "sessions.columns.status"
      | "sessions.columns.duration"
      | "sessions.columns.fee",
  ) => string,
): SessionExportColumn[] {
  return [
    { id: "name", label: t("sessions.columns.name") },
    { id: "type", label: t("sessions.columns.type") },
    { id: "status", label: t("sessions.columns.status") },
    { id: "duration", label: t("sessions.columns.duration") },
    { id: "baseFee", label: t("sessions.columns.fee") },
  ];
}
