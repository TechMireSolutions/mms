import { useCallback } from "react";
import type { StudentExportColumn, StudentsListQuery } from "@mms/shared";
import { startServerStudentsCsvExport } from "@/lib/backgroundJobs/startServerStudentsCsvExport";
import { useModuleServerCsvExportActions } from "@/lib/backgroundJobs/useModuleServerCsvExportActions";
import type { StudentListSortField } from "@/tenant/features/students/components/StudentListContentTypes";
import { useStudentsCrudNotify } from "@/tenant/features/students/hooks/useStudentsCrudNotify";

type ExportAuditScope = "all" | "filtered" | "selection";

export interface UseStudentsExportActionsOptions {
  tableColumns: StudentExportColumn[];
  canExport: boolean;
  search: string;
  filterStatus: string[];
  filterGender: string;
  sortField: StudentListSortField | null;
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

/** Server CSV export actions for Students Work (Contacts-shaped shared factory). */
export function useStudentsExportActions({
  tableColumns,
  canExport,
  search,
  filterStatus,
  filterGender,
  sortField,
  sortDir,
  viewingDeleted,
  selectedIds,
  logExportAudit,
}: UseStudentsExportActionsOptions) {
  const { t, handleError } = useStudentsCrudNotify();

  const buildFilteredQuery = useCallback(
    (): StudentsListQuery => ({
      search: search.trim() || undefined,
      status: filterStatus.length > 0 ? filterStatus.join(",") : undefined,
      gender: filterGender || undefined,
      sortField: sortField ?? undefined,
      sortDir: sortField ? sortDir : undefined,
    }),
    [search, filterStatus, filterGender, sortField, sortDir],
  );

  const onError = useCallback(
    (err: unknown, scope: string) => {
      handleError(err, scope, "students.exportFailed");
    },
    [handleError],
  );

  return useModuleServerCsvExportActions<StudentExportColumn, StudentsListQuery>({
    canExport,
    trashMode: viewingDeleted,
    selectedIds,
    columns: tableColumns,
    filename: t("students.exportFilename"),
    label: t("students.jobs.exportLabelServer"),
    successMessage: t("students.exportSuccess"),
    auditScope: "students.export_audit",
    filteredErrorScope: "students.server_export_csv",
    selectionErrorScope: "students.server_export_csv_selection",
    buildFilteredQuery,
    startExport: startServerStudentsCsvExport,
    logExportAudit,
    onError,
  });
}

/** Default Work export columns when registry is unavailable. */
export function defaultStudentsExportColumns(
  t: (
    key:
      | "students.columns.name"
      | "students.columns.grNumber"
      | "students.columns.gender"
      | "students.columns.status"
      | "students.columns.parents",
  ) => string,
): StudentExportColumn[] {
  return [
    { id: "name", label: t("students.columns.name") },
    { id: "grNumber", label: t("students.columns.grNumber") },
    { id: "gender", label: t("students.columns.gender") },
    { id: "status", label: t("students.columns.status") },
    { id: "parents", label: t("students.columns.parents") },
  ];
}
