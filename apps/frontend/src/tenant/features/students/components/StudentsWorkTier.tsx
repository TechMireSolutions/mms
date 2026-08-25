import { motion } from "framer-motion";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { FilterChips } from "@/components/ui/FilterChips";
import { useTranslation } from "@/hooks/useTranslation";
import { buildStudentsWorkFilterChips } from "@/tenant/features/students/components/buildStudentsWorkFilterChips";
import { StudentsBulkActionBar } from "@/tenant/features/students/components/StudentsBulkActionBar";
import { StudentsWorkListBody } from "@/tenant/features/students/components/StudentsWorkListBody";
import { StudentsListFilters } from "@/tenant/features/students/components/StudentsListFilters";
import type { StudentsWorkTierProps } from "@/tenant/features/students/components/StudentsWorkTierTypes";

export function StudentsWorkTier({
  studentSearch,
  studentFilterStatus,
  studentFilterGender,
  quickFilter,
  onQuickFilterChange,
  studentStatusOptions,
  genderFilters,
  viewingDeleted,
  canWrite,
  canDelete,
  canExport,
  isStatusEnabled = true,
  isGenderEnabled = true,
  bulkActions,
  hasActiveFilters,
  activeFilterCount,
  workStudents,
  workPageData,
  isWorkPageLoading,
  isWorkPageError,
  isWorkPageFetching,
  useServerWork,
  viewMode,
  onViewModeChange,
  columnLayout,
  onSearchChange,
  onToggleStatus,
  onGenderChange,
  onToggleDeleted,
  onClearFilters,
  selectedIds,
  selectedTargets,
  allSelected,
  someSelected,
  onSelectOne,
  onSelectAll,
  onClearSelection,
  onRetry,
  onPageChange,
  onEdit,
  onRestore,
  onBulkStatusChange,
  onBulkEnroll,
  bulkEnrollPending,
  onBulkPrintIdCards,
  onBulkExport,
  bulkStatusPending,
  sortField,
  sortDir,
  onServerSort,
  workOverlays,
}: StudentsWorkTierProps) {
  const { t } = useTranslation();

  const studentFilterChips = buildStudentsWorkFilterChips({
    studentFilterStatus,
    studentFilterGender,
    onToggleStatus,
    onGenderChange,
    t,
  });

  return (
    <ErrorBoundary>
      <motion.div
        key="work"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="space-y-5"
        aria-busy={useServerWork && isWorkPageFetching ? true : undefined}
      >
        <StudentsListFilters
          studentSearch={studentSearch}
          studentFilterStatus={studentFilterStatus}
          studentFilterGender={studentFilterGender}
          quickFilter={quickFilter}
          onQuickFilterChange={onQuickFilterChange}
          studentStatusOptions={studentStatusOptions}
          genderFilters={genderFilters}
          viewingDeleted={viewingDeleted}
          canDelete={canDelete}
          isStatusEnabled={isStatusEnabled}
          isGenderEnabled={isGenderEnabled}
          hasActiveFilters={hasActiveFilters}
          activeFilterCount={activeFilterCount}
          columnLayout={columnLayout}
          viewMode={viewMode}
          sortField={sortField}
          onViewModeChange={onViewModeChange}
          onSearchChange={onSearchChange}
          onToggleStatus={onToggleStatus}
          onGenderChange={onGenderChange}
          onSortChange={onServerSort}
          onToggleDeleted={onToggleDeleted}
          onClearFilters={onClearFilters}
          shownCount={workPageData?.total ?? 0}
        />

        <FilterChips chips={studentFilterChips} onClearAll={onClearFilters} />

        <StudentsBulkActionBar
          selectedCount={selectedIds.length}
          viewingDeleted={viewingDeleted}
          canWrite={canWrite}
          canDelete={canDelete}
          canWriteMessaging={workOverlays.canWriteMessaging}
          canExport={canExport}
          bulkActions={bulkActions}
          selectedTargets={selectedTargets}
          studentStatusOptions={studentStatusOptions}
          statusBadgeConfig={workOverlays.statusBadgeConfig}
          onWhatsApp={(targets) => workOverlays.openSelectionMessage("whatsapp", targets)}
          onSms={(targets) => workOverlays.openSelectionMessage("sms", targets)}
          onEmail={(targets) => workOverlays.openSelectionMessage("email", targets)}
          onBulkStatusChange={async (status) => {
            try {
              await onBulkStatusChange(selectedIds, status);
              onClearSelection();
            } catch {
              // Toast already emitted by the crud action; keep selection for retry.
            }
          }}
          onBulkEnroll={onBulkEnroll}
          isBulkEnrollPending={bulkEnrollPending}
          onBulkPrintIdCards={onBulkPrintIdCards}
          onBulkExport={() => {
            void onBulkExport();
          }}
          onRequestBulkDelete={() => {
            if (canDelete && selectedIds.length > 0) workOverlays.setConfirmBulkDeleteOpen(true);
          }}
          onRequestBulkRestore={() => {
            if (canDelete && selectedIds.length > 0) workOverlays.setConfirmBulkRestoreOpen(true);
          }}
          onClearSelection={onClearSelection}
          statusPending={bulkStatusPending}
        />

        <StudentsWorkListBody
          isWorkPageLoading={isWorkPageLoading}
          isWorkPageError={isWorkPageError}
          isWorkPageFetching={isWorkPageFetching}
          onRetry={onRetry}
          workStudents={workStudents}
          workPageData={workPageData}
          useServerWork={useServerWork}
          viewMode={viewMode}
          columnLayout={columnLayout}
          onPageChange={onPageChange}
          selectedIds={selectedIds}
          allSelected={allSelected}
          someSelected={someSelected}
          onSelectOne={onSelectOne}
          onSelectAll={onSelectAll}
          viewingDeleted={viewingDeleted}
          canWrite={canWrite}
          canDelete={canDelete}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={onClearFilters}
          onShowActive={() => {
            if (viewingDeleted) onToggleDeleted();
          }}
          sortField={sortField}
          sortDir={sortDir}
          onServerSort={onServerSort}
          onEdit={onEdit}
          onRestore={onRestore}
          onViewStudent={workOverlays.setViewStudent}
          openComposer={workOverlays.openComposer}
          canWriteMessaging={workOverlays.canWriteMessaging}
          onDeleteTargetChange={workOverlays.setDeleteTarget}
        />
      </motion.div>
    </ErrorBoundary>
  );
}
