import React, { useEffect } from 'react';
import { TEACHERS_MODULE_MANIFEST } from '@mms/shared';
import { TeacherListConfirmDialogs } from '@/tenant/features/teachers/components/TeacherListConfirmDialogs';
import { TeacherListContent } from '@/tenant/features/teachers/components/TeacherListContent';
import { TeacherListDetailDrawer } from '@/tenant/features/teachers/components/TeacherListDetailDrawer';
import { TeachersBulkActionBar } from '@/tenant/features/teachers/components/TeachersBulkActionBar';
import type { TeacherListProps } from '@/tenant/features/teachers/components/TeacherListTypes';
import { useTeacherListState } from '@/tenant/features/teachers/components/useTeacherListState';
import { useTeachersExportActions } from '@/tenant/features/teachers/hooks/useTeachersExportActions';

export type { TeacherListProps, TeacherSortField } from '@/tenant/features/teachers/components/TeacherListTypes';

export function TeacherList({
  teachers,
  onEdit,
  onDelete,
  onRestore,
  onBulkDelete,
  onBulkRestore,
  onSms,
  onWhatsApp,
  onEmail,
  onBulkStatusChange,
  canWrite = true,
  canDelete = true,
  canExport = false,
  showDeleted = false,
  selectionResetKey,
  isColumnVisible,
  getColumnWidth,
  onColumnResize,
  sortField: controlledSortField,
  sortDir: controlledSortDir,
  onSortChange,
  viewMode,
  exportColumns = [],
  exportSearch = '',
  exportFilterStatus = [],
  exportFilterSpecialization = '',
  exportSortField = null,
  exportSortDir = 'asc',
  logExportAudit,
  onSelectedCountChange,
}: TeacherListProps): React.JSX.Element {
  const {
    sorted,
    sortField,
    sortDir,
    statusConfig,
    isColumnVisible: columnVisible,
    visibleCustomFields,
    selectedIds,
    setSelectedIds,
    confirmBulkDeleteOpen,
    setConfirmBulkDeleteOpen,
    confirmBulkRestoreOpen,
    setConfirmBulkRestoreOpen,
    pendingDeleteId,
    setPendingDeleteId,
    viewTeacher,
    setViewTeacher,
    allSelected,
    someSelected,
    selectedTeachers,
    handleSort,
    handleSelectAll,
    handleSelectOne,
  } = useTeacherListState({
    teachers,
    showDeleted,
    selectionResetKey,
    controlledSortField,
    controlledSortDir,
    onSortChange,
    isColumnVisible,
  });

  useEffect(() => {
    onSelectedCountChange?.(selectedIds.length);
  }, [selectedIds.length, onSelectedCountChange]);

  const showSelectColumn = canWrite || canDelete;
  const showActionsColumn = canWrite || canDelete || !showDeleted;
  const resolveColumnVisible = columnVisible;

  const { handleBulkExport } = useTeachersExportActions({
    tableColumns: exportColumns,
    canExport,
    search: exportSearch,
    filterStatus: exportFilterStatus,
    filterSpecialization: exportFilterSpecialization,
    sortField: exportSortField,
    sortDir: exportSortDir,
    viewingDeleted: showDeleted,
    selectedIds,
    logExportAudit: logExportAudit ?? { mutateAsync: async () => undefined },
  });

  const showBulkExport =
    canExport &&
    !showDeleted &&
    TEACHERS_MODULE_MANIFEST.work.bulkActions.includes('export') &&
    Boolean(logExportAudit);

  return (
    <div className="space-y-4">
      <TeacherListContent
        teachers={sorted}
        viewMode={viewMode}
        selectedIds={selectedIds}
        allSelected={allSelected}
        someSelected={someSelected}
        showSelectColumn={showSelectColumn}
        showActionsColumn={showActionsColumn}
        showDeleted={showDeleted}
        canWrite={canWrite}
        canDelete={canDelete}
        isColumnVisible={resolveColumnVisible}
        visibleCustomFields={visibleCustomFields}
        statusConfig={statusConfig}
        sortField={sortField}
        sortDir={sortDir}
        getColumnWidth={getColumnWidth}
        onColumnResize={onColumnResize}
        onSort={handleSort}
        onSelectAll={handleSelectAll}
        onSelectOne={handleSelectOne}
        onView={setViewTeacher}
        onEdit={onEdit}
        onRequestDelete={setPendingDeleteId}
        onRestore={onRestore}
        onSms={onSms}
        onWhatsApp={onWhatsApp}
        onEmail={onEmail}
      />

      {showSelectColumn && (
        <TeachersBulkActionBar
          selectedIds={selectedIds}
          selectedTeachers={selectedTeachers}
          showDeleted={showDeleted}
          canWrite={canWrite}
          canDelete={canDelete}
          statusConfig={statusConfig}
          onSms={onSms}
          onWhatsApp={onWhatsApp}
          onEmail={onEmail}
          onBulkStatusChange={onBulkStatusChange}
          onRequestBulkDelete={() => {
            if (onBulkDelete) setConfirmBulkDeleteOpen(true);
          }}
          onRequestBulkRestore={() => {
            if (onBulkRestore) setConfirmBulkRestoreOpen(true);
          }}
          onClearSelection={() => setSelectedIds([])}
          canExport={showBulkExport}
          onBulkExport={showBulkExport ? () => void handleBulkExport() : undefined}
        />
      )}

      <TeacherListConfirmDialogs
        selectedCount={selectedIds.length}
        confirmBulkDeleteOpen={confirmBulkDeleteOpen}
        confirmBulkRestoreOpen={confirmBulkRestoreOpen}
        pendingDeleteId={pendingDeleteId}
        onBulkDeleteOpenChange={setConfirmBulkDeleteOpen}
        onBulkRestoreOpenChange={setConfirmBulkRestoreOpen}
        onPendingDeleteChange={setPendingDeleteId}
        onConfirmBulkDelete={(reason) => {
          onBulkDelete?.(selectedIds, reason);
          setSelectedIds([]);
          setConfirmBulkDeleteOpen(false);
        }}
        onConfirmBulkRestore={() => {
          onBulkRestore?.(selectedIds);
          setSelectedIds([]);
          setConfirmBulkRestoreOpen(false);
        }}
        onConfirmDelete={(reason) => {
          if (pendingDeleteId) onDelete(pendingDeleteId, reason);
          setPendingDeleteId(null);
        }}
      />

      <TeacherListDetailDrawer
        teacher={viewTeacher}
        canWrite={canWrite}
        canDelete={canDelete}
        showDeleted={showDeleted}
        onClose={() => setViewTeacher(null)}
        onEdit={(teacherToEdit) => {
          setViewTeacher(null);
          onEdit(teacherToEdit);
        }}
        onRestore={onRestore}
      />
    </div>
  );
}
