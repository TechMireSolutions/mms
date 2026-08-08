import React from 'react';
import { TEACHERS_MODULE_MANIFEST } from '@mms/shared';
import { TeacherListConfirmDialogs } from '@/tenant/features/teachers/components/TeacherListConfirmDialogs';
import { TeacherListContent } from '@/tenant/features/teachers/components/TeacherListContent';
import { TeacherListDetailDrawer } from '@/tenant/features/teachers/components/TeacherListDetailDrawer';
import { TeachersBulkActionBar } from '@/tenant/features/teachers/components/TeachersBulkActionBar';
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
  canExport = false,
  showDeleted = false,
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
  onBulkExport,
}: TeacherListProps): React.JSX.Element {
  const {
    sorted,
    sortField,
    sortDir,
    statusConfig,
    isColumnVisible: columnVisible,
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
    selectedIds,
    onSelectOne,
    onSelectAll,
    controlledSortField,
    controlledSortDir,
    onSortChange,
    isColumnVisible,
  });

  const showSelectColumn = canWrite || canDelete;
  const showActionsColumn = canWrite || canDelete || !showDeleted;
  const resolveColumnVisible = columnVisible;

  const showBulkExport =
    canExport &&
    !showDeleted &&
    TEACHERS_MODULE_MANIFEST.work.bulkActions.includes('export') &&
    Boolean(onBulkExport);

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
          onClearSelection={onClearSelection}
          canExport={showBulkExport}
          onBulkExport={showBulkExport ? () => void onBulkExport?.() : undefined}
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
          onClearSelection();
          setConfirmBulkDeleteOpen(false);
        }}
        onConfirmBulkRestore={() => {
          onBulkRestore?.(selectedIds);
          onClearSelection();
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
