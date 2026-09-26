import {
  DEFAULT_TEACHER_EXPORT_COLUMNS,
  teacherColumnLabelKey,
  type AppTranslationKey,
  type TeacherExportColumn,
  type TeachersListQuery,
  type TeachersQuickFilter,
} from "@mms/shared";
import { startServerFacultyCsvExport } from "@/lib/backgroundJobs/startServerFacultyCsvExport";
import { useModuleServerCsvExportActions } from "@/lib/backgroundJobs/useModuleServerCsvExportActions";
import { buildTeachersDirectoryQuery } from "@/tenant/features/faculty/hooks/facultyQueryShared";
import type { TeacherSortField } from "@/tenant/features/faculty/components/FacultyList";
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
  /** Whether any directory filter is applied — selects the audit scope. */
  hasActiveFilters: boolean;
  selectedIds: string[];
  logExportAudit: {
    mutateAsync: (payload: {
      count: number;
      scope: ExportAuditScope;
    }) => Promise<unknown>;
  };
}

/** Server CSV export actions for Faculty Work (Students-shaped shared factory). */
export function useFacultyExportActions({
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
  hasActiveFilters,
  selectedIds,
  logExportAudit,
}: UseTeachersExportActionsOptions) {
  const { t } = useTranslation();

  const buildFilteredQuery = (): TeachersListQuery =>
    buildTeachersDirectoryQuery({
      search,
      filterStatus,
      filterSpecialization,
      filterGender,
      quickFilter,
      sortField,
      sortDir,
    });

  const onError = (err: unknown, _scope: string) => {
    notify.error(t("faculty.exportFailed"), {
      description: err instanceof Error ? err.message : String(err),
    });
  };

  return useModuleServerCsvExportActions<TeacherExportColumn, TeachersListQuery>({
    canExport,
    trashMode: viewingDeleted,
    selectedIds,
    columns: tableColumns,
    filename: t("faculty.exportFilename"),
    label: t("faculty.jobs.exportLabelServer"),
    successMessage: t("faculty.exportSuccess"),
    auditScope: "faculty.export_audit",
    filteredErrorScope: "faculty.server_export_csv",
    selectionErrorScope: "faculty.server_export_csv_selection",
    hasActiveFilters,
    buildFilteredQuery,
    startExport: startServerFacultyCsvExport,
    logExportAudit,
    onError,
  });
}

export const useTeachersExportActions = useFacultyExportActions;

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

export type UseFacultyExportActionsOptions = UseTeachersExportActionsOptions;
export const defaultFacultyExportColumns = defaultTeachersExportColumns;
export const resolveFacultyExportColumns = resolveTeachersExportColumns;

