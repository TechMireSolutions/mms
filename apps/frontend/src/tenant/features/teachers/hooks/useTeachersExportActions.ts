import { useCallback } from "react";
import type { TeacherExportColumn, TeachersListQuery } from "@mms/shared";
import { startServerTeachersCsvExport } from "@/lib/backgroundJobs/startServerTeachersCsvExport";
import { useModuleServerCsvExportActions } from "@/lib/backgroundJobs/useModuleServerCsvExportActions";
import type { TeacherSortField } from "@/tenant/features/teachers/components/TeacherList";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";

type ExportAuditScope = "all" | "filtered" | "selection";

export interface UseTeachersExportActionsOptions {
  tableColumns: TeacherExportColumn[];
  canExport: boolean;
  search: string;
  filterStatus: string[];
  filterSpecialization: string;
  sortField: TeacherSortField | null;
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

/** Server CSV export actions for Teachers Work (Students-shaped shared factory). */
export function useTeachersExportActions({
  tableColumns,
  canExport,
  search,
  filterStatus,
  filterSpecialization,
  sortField,
  sortDir,
  viewingDeleted,
  selectedIds,
  logExportAudit,
}: UseTeachersExportActionsOptions) {
  const { t } = useTranslation();

  const buildFilteredQuery = useCallback(
    (): TeachersListQuery => ({
      search: search.trim() || undefined,
      status: filterStatus.length > 0 ? filterStatus.join(",") : undefined,
      specialization: filterSpecialization || undefined,
      sortField: sortField ?? undefined,
      sortDir: sortField ? sortDir : undefined,
    }),
    [search, filterStatus, filterSpecialization, sortField, sortDir],
  );

  const onError = useCallback(
    (err: unknown, _scope: string) => {
      notify.error(t("teachers.exportFailed"), {
        description: err instanceof Error ? err.message : String(err),
      });
    },
    [t],
  );

  return useModuleServerCsvExportActions<TeacherExportColumn, TeachersListQuery>({
    canExport,
    trashMode: viewingDeleted,
    selectedIds,
    columns: tableColumns,
    filename: t("teachers.exportFilename"),
    label: t("teachers.jobs.exportLabelServer"),
    successMessage: t("teachers.exportSuccess"),
    auditScope: "teachers.export_audit",
    filteredErrorScope: "teachers.server_export_csv",
    selectionErrorScope: "teachers.server_export_csv_selection",
    buildFilteredQuery,
    startExport: startServerTeachersCsvExport,
    logExportAudit,
    onError,
  });
}

/** Default Work export columns when registry is unavailable. */
export function defaultTeachersExportColumns(
  t: (
    key:
      | "teachers.field.name"
      | "teachers.field.employeeId"
      | "teachers.field.specialization"
      | "teachers.field.status"
      | "teachers.field.qualification"
      | "teachers.field.joinDate",
  ) => string,
): TeacherExportColumn[] {
  return [
    { id: "name", label: t("teachers.field.name") },
    { id: "employeeId", label: t("teachers.field.employeeId") },
    { id: "specialization", label: t("teachers.field.specialization") },
    { id: "status", label: t("teachers.field.status") },
    { id: "qualification", label: t("teachers.field.qualification") },
    { id: "joinDate", label: t("teachers.field.joinDate") },
  ];
}
