import { useCallback } from "react";
import {
  DEFAULT_STUDENT_EXPORT_COLUMNS,
  studentColumnLabelKey,
  type AppTranslationKey,
  type StudentExportColumn,
  type StudentsListQuery,
} from "@mms/shared";
import { startServerStudentsCsvExport } from "@/lib/backgroundJobs/startServerStudentsCsvExport";
import { useModuleServerCsvExportActions } from "@/lib/backgroundJobs/useModuleServerCsvExportActions";
import type { StudentListSortField } from "@/tenant/features/students/components/StudentListContentTypes";
import type { StudentsQuickFilter } from "@mms/shared";
import { useStudentsCrudNotify } from "@/tenant/features/students/hooks/useStudentsCrudNotify";

type ExportAuditScope = "all" | "filtered" | "selection";

export interface UseStudentsExportActionsOptions {
  tableColumns: StudentExportColumn[];
  canExport: boolean;
  search: string;
  filterStatus: string[];
  filterGender: string;
  quickFilter: StudentsQuickFilter;
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
  quickFilter,
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
      quickFilter: quickFilter === "all" ? undefined : quickFilter,
      sortField: sortField ?? undefined,
      sortDir: sortField ? sortDir : undefined,
    }),
    [search, filterStatus, filterGender, quickFilter, sortField, sortDir],
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
  t: (key: AppTranslationKey) => string,
): StudentExportColumn[] {
  return DEFAULT_STUDENT_EXPORT_COLUMNS.map((column) => ({
    id: column.id,
    label: t(studentColumnLabelKey(column.id)),
  }));
}
