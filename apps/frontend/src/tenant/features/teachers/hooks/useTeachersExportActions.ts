import {
  DEFAULT_TEACHER_EXPORT_COLUMNS,
  teacherColumnLabelKey,
  type AppTranslationKey,
  type TeacherExportColumn,
  type TeachersListQuery,
  type TeachersQuickFilter,
} from "@mms/shared";
import { startServerTeachersCsvExport } from "@/lib/backgroundJobs/startServerTeachersCsvExport";
import { useModuleServerCsvExportActions } from "@/lib/backgroundJobs/useModuleServerCsvExportActions";
import { buildTeachersDirectoryQuery } from "@/tenant/features/teachers/hooks/teachersQueryShared";
import type { TeacherSortField } from "@/tenant/features/teachers/components/TeachersList";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";

type ExportAuditScope = "all" | "filtered" | "selection";

export interface UseTeachersExportActionsOptions {
  tableColumns: TeacherExportColumn[];
  canExport: boolean;
  search: string;
  filterStatus: string[];
  filterSpecialization: string;
  filterGender: string;
  quickFilter: TeachersQuickFilter;
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
  filterGender,
  quickFilter,
  sortField,
  sortDir,
  viewingDeleted,
  selectedIds,
  logExportAudit,
}: UseTeachersExportActionsOptions) {
  const { t } = useTranslation();

  const buildFilteredQuery = ((): TeachersListQuery =>
      buildTeachersDirectoryQuery({
        search,
        filterStatus,
        filterSpecialization,
        filterGender,
        quickFilter,
        sortField,
        sortDir,
      }));

  const onError = ((err: unknown, _scope: string) => {
      notify.error(t("teachers.exportFailed"), {
        description: err instanceof Error ? err.message : String(err),
      });
    });

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
  t: (key: AppTranslationKey) => string,
): TeacherExportColumn[] {
  return DEFAULT_TEACHER_EXPORT_COLUMNS.map((column) => ({
    id: column.id,
    label: t(teacherColumnLabelKey(column.id)),
  }));
}

/** Resolves active export columns from column registry and visibility state. */
export function resolveTeachersExportColumns(
  columnRegistry: Array<{ key: string; label?: string }>,
  isColumnVisible: (key: string) => boolean,
  t: (key: AppTranslationKey) => string,
): TeacherExportColumn[] {
  const visible = columnRegistry.filter((col) => isColumnVisible(col.key));
  if (visible.length === 0) return defaultTeachersExportColumns(t);
  const columns = visible.map((col) => ({
    id: col.key,
    label: col.label || col.key,
  }));
  if (!columns.some((col) => col.id === 'employeeId')) {
    const nameIndex = columns.findIndex((col) => col.id === 'name');
    columns.splice(nameIndex >= 0 ? nameIndex + 1 : 0, 0, {
      id: 'employeeId',
      label: t(teacherColumnLabelKey('employeeId')),
    });
  }
  return columns;
}
