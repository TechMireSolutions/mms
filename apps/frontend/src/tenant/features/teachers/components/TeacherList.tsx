import React from 'react';
import { TeacherListConfirmDialogs } from '@/tenant/features/teachers/components/TeacherListConfirmDialogs';
import { TeacherListContent } from '@/tenant/features/teachers/components/TeacherListContent';
import { TeacherListDetailDrawer } from '@/tenant/features/teachers/components/TeacherListDetailDrawer';
import type { TeacherListProps } from '@/tenant/features/teachers/components/TeacherListTypes';
import { useTeacherListState } from '@/tenant/features/teachers/components/useTeacherListState';

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
  showDeleted = false,
  hasActiveFilters = false,
  onClearFilters,
  onShowActive,
  selectedIds,
  onSelectOne,
  onSelectAll,
  onClearSelection,
  isColumnVisible,
  getColumnWidth,
  onColumnResize,
  sortField: controlledSortField,
  sortDir: controlledSortDir,
  onSortChange,
  viewMode,
  columnRegistry = [],
  confirmBulkDeleteOpen,
  confirmBulkRestoreOpen,
  onBulkDeleteOpenChange,
  onBulkRestoreOpenChange,
  openComposer,
  canWriteMessaging,
}: TeacherListProps): React.JSX.Element {
  const {
    sorted,
    sortField,
    sortDir,
    statusConfig,
    isColumnVisible: columnVisible,
    pendingDeleteId,
    setPendingDeleteId,
    viewTeacher,
    setViewTeacher,
    allSelected,
    someSelected,
    handleSort,
    handleSelectAll,
    handleSelectOne,
  } = useTeacherListState({
    teachers,
    showDeleted,
    selectedIds,
    onSelectOne,
    onSelectAll,
    controlledSortField,
    controlledSortDir,
    onSortChange,
    isColumnVisible,
  });

  const showSelectColumn = true;
  const showActionsColumn = true;
  const resolveColumnVisible = columnVisible;

  return (
    <div className="space-y-4">
      <TeacherListContent
        teachers={sorted}
        viewMode={viewMode}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={onClearFilters}
        onShowActive={onShowActive}
        selectedIds={selectedIds}
        allSelected={allSelected}
        someSelected={someSelected}
        showSelectColumn={showSelectColumn}
        showActionsColumn={showActionsColumn}
        showDeleted={showDeleted}
        canWrite={canWrite}
        canDelete={canDelete}
        isColumnVisible={resolveColumnVisible}
        columnRegistry={columnRegistry}
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

      <TeacherListConfirmDialogs
        selectedCount={selectedIds.length}
        confirmBulkDeleteOpen={confirmBulkDeleteOpen}
        confirmBulkRestoreOpen={confirmBulkRestoreOpen}
        pendingDeleteId={pendingDeleteId}
        onBulkDeleteOpenChange={onBulkDeleteOpenChange}
        onBulkRestoreOpenChange={onBulkRestoreOpenChange}
        onPendingDeleteChange={setPendingDeleteId}
        onConfirmBulkDelete={async (reason) => {
          if (onBulkDelete) await onBulkDelete(selectedIds, reason);
          onClearSelection();
          onBulkDeleteOpenChange(false);
        }}
        onConfirmBulkRestore={async () => {
          if (onBulkRestore) await onBulkRestore(selectedIds);
          onClearSelection();
          onBulkRestoreOpenChange(false);
        }}
        onConfirmDelete={async (reason) => {
          if (pendingDeleteId) await onDelete(pendingDeleteId, reason);
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
        openComposer={openComposer}
        canWriteMessaging={canWriteMessaging}
      />
    </div>
  );
}
