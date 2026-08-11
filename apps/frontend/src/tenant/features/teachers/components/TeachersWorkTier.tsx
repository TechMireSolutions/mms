import type {
  ModuleColumnRegistryEntry,
  Teacher,
  TeacherSortField,
  TeachersListPageResult,
  TeachersQuickFilter,
} from "@mms/shared";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { FilterChips } from "@/components/ui/FilterChips";
import { type ModuleColumnCustomizerLabels } from "@/components/ui/ModuleColumnCustomizer";
import { ModuleTierMotion } from "@/components/ui/ModuleTierMotion";
import { ModuleWorkListStateShell } from "@/components/ui/ModuleWorkListStateShell";
import { useTranslation } from "@/hooks/useTranslation";
import type { WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import { TeacherList } from "@/tenant/features/teachers/components/TeacherList";
import { buildTeachersWorkFilterChips } from "@/tenant/features/teachers/components/buildTeachersWorkFilterChips";
import { TeachersBulkActionBar } from "@/tenant/features/teachers/components/TeachersBulkActionBar";
import { TeachersWorkTierToolbar } from "@/tenant/features/teachers/components/TeachersWorkTierToolbar";
import { computeTeachersSelectionTargets } from "@/tenant/features/teachers/hooks/teachersSelectionTargets";
import { useTeacherStatusConfig } from "@/tenant/features/teachers/hooks/useTeacherStatusConfig";
import type { TeachersWorkOverlayInteractions } from "@/tenant/features/teachers/hooks/teachersPageOverlaysTypes";

export interface TeachersWorkTierProps {
  search: string;
  filterStatus: string[];
  filterSpecialization: string;
  filterGender: string;
  quickFilter: TeachersQuickFilter;
  onQuickFilterChange: (preset: string) => void;
  genderFilters: string[];
  activeFilterCount: number;
  statusOptions: string[];
  specializationOptions: string[];
  showDeleted: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canExport?: boolean;
  hasActiveFilters: boolean;
  columnRegistry: ModuleColumnRegistryEntry[];
  isColumnVisible: (key: string) => boolean;
  getColumnWidth: (key: string) => number | undefined;
  onColumnResize: (key: string, width: number) => void;
  updateUserColumnLayout: (columnRegistry: ModuleColumnRegistryEntry[]) => void;
  onResetLayout: () => void;
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
  onSearchChange: (value: string) => void;
  onToggleStatus: (status: string) => void;
  onSpecializationChange: (value: string) => void;
  onGenderChange: (value: string) => void;
  onToggleDeleted: () => void;
  onClearFilters: () => void;
  onRetry: () => unknown;
  onEdit: (teacher: Teacher) => void;
  onRestore: (id: string) => void | Promise<void>;
  onBulkStatusChange?: (ids: string[], status: string) => void | Promise<void>;
  bulkStatusPending?: boolean;
  onWhatsApp?: (teachers: Teacher[]) => void;
  onSms?: (teachers: Teacher[]) => void;
  onEmail?: (teachers: Teacher[]) => void;
  onSortChange: (field: TeacherSortField, dir: "asc" | "desc") => void;
  onPageChange: (page: number) => void;
  viewMode: WorkDirectoryViewMode;
  onViewModeChange: (mode: WorkDirectoryViewMode) => void;
  /** Page-owned overlay interactions (composer, confirms, drawer target). */
  workOverlays: TeachersWorkOverlayInteractions;
}

export function TeachersWorkTier(props: TeachersWorkTierProps): React.JSX.Element {
  const { t } = useTranslation();
  const filterChips = buildTeachersWorkFilterChips({
    filterStatus: props.filterStatus,
    filterSpecialization: props.filterSpecialization,
    filterGender: props.filterGender,
    onToggleStatus: props.onToggleStatus,
    onSpecializationChange: props.onSpecializationChange,
    onGenderChange: props.onGenderChange,
    t,
  });

  const statusConfig = useTeacherStatusConfig();

  const handleBulkStatusChange = async (status: string): Promise<void> => {
    try {
      await props.onBulkStatusChange?.(props.selectedIds, status);
      props.onClearSelection();
    } catch {
      // Toast already emitted by the crud action; keep selection for retry.
    }
  };

  const handleSortFieldChange = (field: TeacherSortField): void => {
    if (field === props.sortField) {
      props.onSortChange(field, props.sortDir === "asc" ? "desc" : "asc");
    } else {
      props.onSortChange(field, "asc");
    }
  };

  const selectionTargets = computeTeachersSelectionTargets({
    selectedIds: props.selectedIds,
    workTeachers: props.teachers,
  });

  return (
    <ErrorBoundary>
      <ModuleTierMotion
        tier="work"
        className="space-y-5"
        aria-busy={props.useServerWork && props.isWorkPageFetching ? true : undefined}
      >
        <TeachersWorkTierToolbar
          search={props.search}
          filterStatus={props.filterStatus}
          filterSpecialization={props.filterSpecialization}
          filterGender={props.filterGender}
          quickFilter={props.quickFilter}
          onQuickFilterChange={props.onQuickFilterChange}
          genderFilters={props.genderFilters}
          activeFilterCount={props.activeFilterCount}
          statusOptions={props.statusOptions}
          specializationOptions={props.specializationOptions}
          showDeleted={props.showDeleted}
          canDelete={props.canDelete}
          hasActiveFilters={props.hasActiveFilters}
          onClearFilters={props.onClearFilters}
          shownCount={props.workPageData?.total ?? 0}
          columnRegistry={props.columnRegistry}
          isColumnVisible={props.isColumnVisible}
          updateUserColumnLayout={props.updateUserColumnLayout}
          onResetLayout={props.onResetLayout}
          customizerLabels={props.customizerLabels}
          viewMode={props.viewMode}
          onViewModeChange={props.onViewModeChange}
          sortField={props.sortField}
          onSortChange={handleSortFieldChange}
          onSearchChange={props.onSearchChange}
          onToggleStatus={props.onToggleStatus}
          onSpecializationChange={props.onSpecializationChange}
          onGenderChange={props.onGenderChange}
          onToggleDeleted={props.onToggleDeleted}
        />

        <FilterChips chips={filterChips} onClearAll={props.onClearFilters} />

        <TeachersBulkActionBar
          selectedIds={props.selectedIds}
          selectionTargets={selectionTargets}
          showDeleted={props.showDeleted}
          canWrite={props.canWrite}
          canDelete={props.canDelete}
          canWriteMessaging={props.workOverlays.canWriteMessaging}
          statusConfig={statusConfig}
          onSms={props.onSms}
          onWhatsApp={props.onWhatsApp}
          onEmail={props.onEmail}
          onBulkStatusChange={handleBulkStatusChange}
          onRequestBulkDelete={() => props.workOverlays.setConfirmBulkDeleteOpen(true)}
          onRequestBulkRestore={() => props.workOverlays.setConfirmBulkRestoreOpen(true)}
          onClearSelection={props.onClearSelection}
          canExport={props.canExport}
          onBulkExport={props.onBulkExport ? () => void props.onBulkExport?.() : undefined}
          statusPending={props.bulkStatusPending}
        />

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
            onRestore={props.onRestore}
            onDeleteTargetChange={props.workOverlays.setDeleteTarget}
            onView={props.workOverlays.setViewTeacher}
            onWhatsApp={props.onWhatsApp}
            onSms={props.onSms}
            onEmail={props.onEmail}
            canWrite={props.canWrite}
            canDelete={props.canDelete}
            showDeleted={props.showDeleted}
            selectedIds={props.selectedIds}
            onSelectOne={props.onSelectOne}
            onSelectAll={props.onSelectAll}
            isColumnVisible={props.isColumnVisible}
            columnRegistry={props.columnRegistry}
            getColumnWidth={props.getColumnWidth}
            onColumnResize={props.onColumnResize}
            sortField={props.sortField}
            sortDir={props.sortDir}
            onSortChange={props.onSortChange}
            onClearFilters={props.onClearFilters}
            onShowActive={() => {
              if (props.showDeleted) props.onToggleDeleted();
            }}
          />
        </ModuleWorkListStateShell>
      </ModuleTierMotion>
    </ErrorBoundary>
  );
}
