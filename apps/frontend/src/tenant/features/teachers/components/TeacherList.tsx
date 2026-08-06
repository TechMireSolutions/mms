import React from 'react';
import { TeacherListConfirmDialogs } from '@/tenant/features/teachers/components/TeacherListConfirmDialogs';
import { TeacherListContent } from '@/tenant/features/teachers/components/TeacherListContent';
import { TeacherListDetailDrawer } from '@/tenant/features/teachers/components/TeacherListDetailDrawer';
import { TeacherListSelectionBar } from '@/tenant/features/teachers/components/TeacherListSelectionBar';
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
  selectionResetKey,
  isColumnVisible,
  getColumnWidth,
  onColumnResize,
  sortField: controlledSortField,
  sortDir: controlledSortDir,
  onSortChange,
  viewMode,
}: TeacherListProps): React.JSX.Element {
  const {
    sorted,
    sortField,
    sortDir,
    statusConfig,
    showSpecialization,
    showQualification,
    showJoinDate,
    showStatus,
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

  const showSelectColumn = canWrite || canDelete;
  const showActionsColumn = canWrite || canDelete || !showDeleted;

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
        showSpecialization={showSpecialization}
        showQualification={showQualification}
        showJoinDate={showJoinDate}
        showStatus={showStatus}
        showDeleted={showDeleted}
        canWrite={canWrite}
        canDelete={canDelete}
        isColumnVisible={isColumnVisible}
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
        <TeacherListSelectionBar
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
        onConfirmBulkDelete={() => {
          onBulkDelete?.(selectedIds);
          setSelectedIds([]);
          setConfirmBulkDeleteOpen(false);
        }}
        onConfirmBulkRestore={() => {
          onBulkRestore?.(selectedIds);
          setSelectedIds([]);
          setConfirmBulkRestoreOpen(false);
        }}
        onConfirmDelete={() => {
          if (pendingDeleteId) onDelete(pendingDeleteId);
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
