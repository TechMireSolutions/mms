import type { ModuleColumnRegistryEntry, Teacher, TeachersListPageResult } from "@mms/shared";
import { FilterChips } from "@/components/ui/FilterChips";
import { type ModuleColumnCustomizerLabels } from "@/components/ui/ModuleColumnCustomizer";
import { ModuleTierMotion } from "@/components/ui/ModuleTierMotion";
import { ModuleWorkListStateShell } from "@/components/ui/ModuleWorkListStateShell";
import { useTranslation } from "@/hooks/useTranslation";
import type { WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import { TeacherList, type TeacherSortField } from "@/tenant/features/teachers/components/TeacherList";
import { buildTeachersWorkFilterChips } from "@/tenant/features/teachers/components/buildTeachersWorkFilterChips";
import { TeachersWorkTierToolbar } from "@/tenant/features/teachers/components/TeachersWorkTierToolbar";

interface TeachersWorkTierProps {
  search: string;
  filterStatus: string[];
  filterSpecialization: string;
  statusOptions: string[];
  specializationOptions: string[];
  showDeleted: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canExport?: boolean;
  hasActiveFilters: boolean;
  columnRegistry: ModuleColumnRegistryEntry[];
  updateUserColumnLayout: (columnRegistry: ModuleColumnRegistryEntry[]) => void;
  customizerLabels: ModuleColumnCustomizerLabels;
  teachers: Teacher[];
  workPageData?: TeachersListPageResult;
  isWorkPageLoading: boolean;
  isWorkPageError: boolean;
  isWorkPageFetching: boolean;
  useServerWork: boolean;
  selectedIds: string[];
  onSelectOne: (id: string) => void;
  onSelectAll: (pageIds: string[]) => void;
  onClearSelection: () => void;
  onBulkExport?: () => void | Promise<void>;
  sortField: TeacherSortField;
  sortDir: "asc" | "desc";
  isColumnVisible: (key: string) => boolean;
  getColumnWidth: (key: string) => number | undefined;
  onColumnResize: (key: string, width: number) => void;
  onSearchChange: (value: string) => void;
  onToggleStatus: (status: string) => void;
  onSpecializationChange: (value: string) => void;
  onToggleDeleted: () => void;
  onClearFilters: () => void;
  onRetry: () => unknown;
  onEdit: (teacher: Teacher) => void;
  onDelete: (id: string, deletionReason?: string) => void;
  onRestore: (id: string) => void;
  onBulkDelete: (ids: string[], deletionReason?: string) => void;
  onBulkRestore: (ids: string[]) => void;
  onBulkStatusChange?: (ids: string[], status: string) => void;
  onWhatsApp?: (teachers: Teacher[]) => void;
  onSms?: (teachers: Teacher[]) => void;
  onEmail?: (teachers: Teacher[]) => void;
  onSortChange: (field: TeacherSortField, dir: "asc" | "desc") => void;
  onPageChange: (page: number) => void;
  viewMode: WorkDirectoryViewMode;
  onViewModeChange: (mode: WorkDirectoryViewMode) => void;
}

export function TeachersWorkTier(props: TeachersWorkTierProps): React.JSX.Element {
  const { t } = useTranslation();
  const filterChips = buildTeachersWorkFilterChips({
    filterStatus: props.filterStatus,
    filterSpecialization: props.filterSpecialization,
    onToggleStatus: props.onToggleStatus,
    onSpecializationChange: props.onSpecializationChange,
    t,
  });

  return (
    <ModuleTierMotion
      tier="work"
      className="space-y-5"
      aria-busy={props.useServerWork && props.isWorkPageFetching ? true : undefined}
    >
      <TeachersWorkTierToolbar
        search={props.search}
        filterStatus={props.filterStatus}
        filterSpecialization={props.filterSpecialization}
        statusOptions={props.statusOptions}
        specializationOptions={props.specializationOptions}
        showDeleted={props.showDeleted}
        canDelete={props.canDelete}
        columnRegistry={props.columnRegistry}
        updateUserColumnLayout={props.updateUserColumnLayout}
        customizerLabels={props.customizerLabels}
        viewMode={props.viewMode}
        onViewModeChange={props.onViewModeChange}
        onSearchChange={props.onSearchChange}
        onToggleStatus={props.onToggleStatus}
        onSpecializationChange={props.onSpecializationChange}
        onToggleDeleted={props.onToggleDeleted}
      />

      <FilterChips chips={filterChips} onClearAll={props.onClearFilters} />

      <ModuleWorkListStateShell
        isError={props.isWorkPageError}
        isLoading={props.isWorkPageLoading}
        isFetching={props.isWorkPageFetching}
        onRetry={() => void props.onRetry()}
        errorTitle={t("teachers.loadFailed")}
        errorHint={t("teachers.loadFailedHint")}
        viewMode={props.viewMode}
        skeletonColumnCount={props.columnRegistry.length}
        useServerWork={props.useServerWork}
        pageData={props.workPageData}
        onPageChange={props.onPageChange}
        i18nNamespace="teachers"
        showPagination={props.teachers.length > 0}
        loadingLabel={t("common.loading")}
      >
        <TeacherList
          teachers={props.teachers}
          viewMode={props.viewMode}
          hasActiveFilters={props.hasActiveFilters}
          onEdit={props.onEdit}
          onDelete={props.onDelete}
          onRestore={props.onRestore}
          onBulkDelete={props.onBulkDelete}
          onBulkRestore={props.onBulkRestore}
          onBulkStatusChange={props.onBulkStatusChange}
          onWhatsApp={props.onWhatsApp}
          onSms={props.onSms}
          onEmail={props.onEmail}
          canWrite={props.canWrite}
          canDelete={props.canDelete}
          canExport={props.canExport}
          showDeleted={props.showDeleted}
          selectedIds={props.selectedIds}
          onSelectOne={props.onSelectOne}
          onSelectAll={props.onSelectAll}
          onClearSelection={props.onClearSelection}
          isColumnVisible={props.isColumnVisible}
          columnRegistry={props.columnRegistry}
          getColumnWidth={props.getColumnWidth}
          onColumnResize={props.onColumnResize}
          sortField={props.sortField}
          sortDir={props.sortDir}
          onSortChange={props.onSortChange}
          onBulkExport={props.onBulkExport}
          onClearFilters={props.onClearFilters}
          onShowActive={props.onToggleDeleted}
        />
      </ModuleWorkListStateShell>
    </ModuleTierMotion>
  );
}
