import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { FilterChips } from "@/components/ui/FilterChips";
import { ModuleTierMotion } from "@/components/ui/ModuleTierMotion";
import { ModuleWorkListStateShell } from "@/components/ui/ModuleWorkListStateShell";
import { useTranslation } from "@/hooks/useTranslation";
import { FacultyList } from "@/tenant/features/faculty/components/FacultyList";
import { FacultyBulkActionBar } from "@/tenant/features/faculty/components/FacultyBulkActionBar";
import { FacultyListFilters } from "@/tenant/features/faculty/components/FacultyListFilters";
import { useFacultyWorkTierActions } from "@/tenant/features/faculty/hooks/useFacultyWorkTierActions";
import type {
  FacultyWorkTierProps,
  TeachersWorkTierProps,
} from "@/tenant/features/faculty/components/facultyWorkTierProps";

export type { FacultyWorkTierProps, TeachersWorkTierProps };

export function FacultyWorkTier(props: FacultyWorkTierProps): React.JSX.Element {
  const { t } = useTranslation();
  const {
    filterChips,
    statusConfig,
    selectionTargets,
    handleBulkStatusChange,
    handleBulkSpecializationChange,
    handleSortFieldChange,
  } = useFacultyWorkTierActions(props);
  const items = props.faculty ?? props.teachers ?? [];

  return (
    <ErrorBoundary>
      <ModuleTierMotion
        tier="work"
        className="space-y-5"
        aria-busy={props.useServerWork && props.isWorkPageFetching ? true : undefined}
      >
        <FacultyListFilters
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
          filterChips={
            filterChips.length > 0 ? (
              <FilterChips chips={filterChips} onClearAll={props.onClearFilters} />
            ) : undefined
          }
        />

        <FacultyBulkActionBar
          selectedIds={props.selectedIds}
          selectionTargets={selectionTargets}
          showDeleted={props.showDeleted}
          canWrite={props.canWrite}
          canDelete={props.canDelete}
          canWriteMessaging={props.workOverlays.canWriteMessaging}
          statusConfig={statusConfig}
          specializationOptions={props.specializationOptions}
          onSms={props.onSms}
          onWhatsApp={props.onWhatsApp}
          onEmail={props.onEmail}
          onBulkStatusChange={handleBulkStatusChange}
          onBulkSpecializationChange={handleBulkSpecializationChange}
          onRequestBulkDelete={() => props.workOverlays.setConfirmBulkDeleteOpen(true)}
          onRequestBulkRestore={() => props.workOverlays.setConfirmBulkRestoreOpen(true)}
          onClearSelection={props.onClearSelection}
          canExport={props.canExport}
          onBulkExport={props.onBulkExport ? () => void props.onBulkExport?.() : undefined}
          statusPending={props.bulkStatusPending}
          specializationPending={props.bulkSpecializationPending}
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
          showPagination={items.length > 0}
          loadingLabel={t("common.loading")}
        >
          <FacultyList
            faculty={items}
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

export const TeachersWorkTier = FacultyWorkTier;

