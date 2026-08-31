import type { EnrollmentExportColumn, EnrollmentsListQuery } from "@mms/shared";
import { startServerEnrollmentsCsvExport } from "@/lib/backgroundJobs/startServerEnrollmentsCsvExport";
import { useModuleServerCsvExportActions } from "@/lib/backgroundJobs/useModuleServerCsvExportActions";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";

type ExportAuditScope = "all" | "filtered" | "selection";

export interface UseEnrollmentsExportActionsOptions {
  tableColumns: EnrollmentExportColumn[];
  canExport: boolean;
  search: string;
  statusFilter: string;
  sessionFilter: string;
  viewingDeleted: boolean;
  selectedIds: string[];
  logExportAudit: {
    mutateAsync: (payload: {
      count: number;
      scope: ExportAuditScope;
    }) => Promise<unknown>;
  };
}

/** Server CSV export actions for Enrollments Work (Sessions-shaped shared factory). */
export function useEnrollmentsExportActions({
  tableColumns,
  canExport,
  search,
  statusFilter,
  sessionFilter,
  viewingDeleted,
  selectedIds,
  logExportAudit,
}: UseEnrollmentsExportActionsOptions) {
  const { t } = useTranslation();

  const buildFilteredQuery = ((): EnrollmentsListQuery => ({
      search: search.trim() || undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      sessionId: sessionFilter !== "all" ? sessionFilter : undefined,
    }));

  const onError = ((err: unknown, _scope: string) => {
      notify.error(t("enrollments.exportFailed"), {
        description: err instanceof Error ? err.message : String(err),
      });
    });

  return useModuleServerCsvExportActions<EnrollmentExportColumn, EnrollmentsListQuery>({
    canExport,
    trashMode: viewingDeleted,
    selectedIds,
    columns: tableColumns,
    filename: t("enrollments.exportFilename"),
    label: t("enrollments.jobs.exportLabelServer"),
    successMessage: t("enrollments.exportSuccess"),
    auditScope: "enrollments.export_audit",
    filteredErrorScope: "enrollments.server_export_csv",
    selectionErrorScope: "enrollments.server_export_csv_selection",
    buildFilteredQuery,
    startExport: startServerEnrollmentsCsvExport,
    logExportAudit,
    onError,
  });
}

/** Default Work export columns when registry is unavailable. */
export function defaultEnrollmentsExportColumns(
  t: (
    key:
      | "enrollments.columns.student"
      | "enrollments.columns.session"
      | "enrollments.columns.class"
      | "enrollments.columns.enrolledDate"
      | "enrollments.columns.finalFee"
      | "enrollments.columns.status"
      | "enrollments.columns.payment",
  ) => string,
): EnrollmentExportColumn[] {
  return [
    { id: "studentName", label: t("enrollments.columns.student") },
    { id: "sessionName", label: t("enrollments.columns.session") },
    { id: "className", label: t("enrollments.columns.class") },
    { id: "enrolledDate", label: t("enrollments.columns.enrolledDate") },
    { id: "finalFee", label: t("enrollments.columns.finalFee") },
    { id: "status", label: t("enrollments.columns.status") },
    { id: "paymentStatus", label: t("enrollments.columns.payment") },
  ];
}
