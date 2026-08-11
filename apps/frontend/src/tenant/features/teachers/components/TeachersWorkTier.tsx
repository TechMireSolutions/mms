import { useState } from "react";
import type { ModuleColumnRegistryEntry, Teacher, TeachersListPageResult } from "@mms/shared";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { FilterChips } from "@/components/ui/FilterChips";
import { type ModuleColumnCustomizerLabels } from "@/components/ui/ModuleColumnCustomizer";
import { ModuleTierMotion } from "@/components/ui/ModuleTierMotion";
import { ModuleWorkListStateShell } from "@/components/ui/ModuleWorkListStateShell";
import { useTranslation } from "@/hooks/useTranslation";
import type { useMessageComposerState } from "@/hooks/useMessageComposerState";
import type { WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import { TeacherList, type TeacherSortField } from "@/tenant/features/teachers/components/TeacherList";
import { buildTeachersWorkFilterChips } from "@/tenant/features/teachers/components/buildTeachersWorkFilterChips";
import { TeachersBulkActionBar } from "@/tenant/features/teachers/components/TeachersBulkActionBar";
import { TeachersWorkTierToolbar } from "@/tenant/features/teachers/components/TeachersWorkTierToolbar";
import { computeTeachersSelectionTargets } from "@/tenant/features/teachers/hooks/teachersSelectionTargets";
import { useTeacherStatusConfig } from "@/tenant/features/teachers/hooks/useTeacherStatusConfig";

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
  onDelete: (id: string, deletionReason?: string) => void | Promise<void>;
  onRestore: (id: string) => void | Promise<void>;
  onBulkDelete: (ids: string[], deletionReason?: string) => void | Promise<void>;
  onBulkRestore: (ids: string[]) => void | Promise<void>;
  onBulkStatusChange?: (ids: string[], status: string) => void | Promise<void>;
  onWhatsApp?: (teachers: Teacher[]) => void;
  onSms?: (teachers: Teacher[]) => void;
  onEmail?: (teachers: Teacher[]) => void;
  onSortChange: (field: TeacherSortField, dir: "asc" | "desc") => void;
  onPageChange: (page: number) => void;
  viewMode: WorkDirectoryViewMode;
  onViewModeChange: (mode: WorkDirectoryViewMode) => void;
  /** Page-owned composer passed to the detail drawer (Students parity). */
  openComposer: ReturnType<typeof useMessageComposerState>["openComposer"];
  canWriteMessaging: boolean;
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

  const statusConfig = useTeacherStatusConfig();
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);
  const [confirmBulkRestoreOpen, setConfirmBulkRestoreOpen] = useState(false);

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
          statusOptions={props.statusOptions}
          specializationOptions={props.specializationOptions}
          showDeleted={props.showDeleted}
          canDelete={props.canDelete}
          hasActiveFilters={props.hasActiveFilters}
          onClearFilters={props.onClearFilters}
          shownCount={props.workPageData?.total ?? 0}
          columnRegistry={props.columnRegistry}
          updateUserColumnLayout={props.updateUserColumnLayout}
          onResetLayout={props.onResetLayout}
          customizerLabels={props.customizerLabels}
          viewMode={props.viewMode}
          onViewModeChange={props.onViewModeChange}
          onSearchChange={props.onSearchChange}
          onToggleStatus={props.onToggleStatus}
          onSpecializationChange={props.onSpecializationChange}
          onToggleDeleted={props.onToggleDeleted}
        />

        <FilterChips chips={filterChips} onClearAll={props.onClearFilters} />

        <TeachersBulkActionBar
          selectedIds={props.selectedIds}
          selectionTargets={selectionTargets}
          showDeleted={props.showDeleted}
          canWrite={props.canWrite}
          canDelete={props.canDelete}
          statusConfig={statusConfig}
          onSms={props.onSms}
          onWhatsApp={props.onWhatsApp}
          onEmail={props.onEmail}
          onBulkStatusChange={props.onBulkStatusChange}
          onRequestBulkDelete={() => setConfirmBulkDeleteOpen(true)}
          onRequestBulkRestore={() => setConfirmBulkRestoreOpen(true)}
          onClearSelection={props.onClearSelection}
          canExport={props.canExport}
          onBulkExport={props.onBulkExport ? () => void props.onBulkExport?.() : undefined}
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
            onClearFilters={props.onClearFilters}
            onShowActive={props.onToggleDeleted}
            confirmBulkDeleteOpen={confirmBulkDeleteOpen}
            confirmBulkRestoreOpen={confirmBulkRestoreOpen}
            onBulkDeleteOpenChange={setConfirmBulkDeleteOpen}
            onBulkRestoreOpenChange={setConfirmBulkRestoreOpen}
            openComposer={props.openComposer}
            canWriteMessaging={props.canWriteMessaging}
          />
        </ModuleWorkListStateShell>
      </ModuleTierMotion>
    </ErrorBoundary>
  );
}
