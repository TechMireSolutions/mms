import React from 'react';
import type { Teacher } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { TeachersListContent } from '@/tenant/features/teachers/components/TeachersListContent';
import type { TeacherListProps } from '@/tenant/features/teachers/components/teachersListTypes';
import { resolveTeacherDisplayName } from '@/tenant/features/teachers/components/teacherFieldDisplay';
import { useTeacherListState } from '@/tenant/features/teachers/components/useTeacherListState';

export type { TeacherListProps, TeacherSortField } from '@/tenant/features/teachers/components/teachersListTypes';

/** Work directory content (table/cards + empty state) — confirms/drawer live at page level. */
export function TeachersList({
  teachers,
  onEdit,
  onRestore,
  onSms,
  onWhatsApp,
  onEmail,
  onDeleteTargetChange,
  onView,
  canWrite = true,
  canDelete = true,
  showDeleted = false,
  hasActiveFilters = false,
  onClearFilters,
  onShowActive,
  selectedIds,
  onSelectOne,
  onSelectAll,
  isColumnVisible,
  getColumnWidth,
  onColumnResize,
  sortField: controlledSortField,
  sortDir: controlledSortDir,
  onSortChange,
  viewMode,
  columnRegistry = [],
}: TeacherListProps): React.JSX.Element {
  const { t } = useTranslation();
  const {
    sorted,
    sortField,
    sortDir,
    statusConfig,
    isColumnVisible: columnVisible,
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

  const handleRequestDelete = (id: string) => {
    const teacher = teachers.find((candidate: Teacher) => String(candidate.id) === String(id));
    const name = teacher ? resolveTeacherDisplayName(teacher, t, undefined) : undefined;
    onDeleteTargetChange({ id, name });
  };

  return (
    <div className="space-y-4">
      <TeachersListContent
        teachers={sorted}
        viewMode={viewMode}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={onClearFilters}
        onShowActive={onShowActive}
        selectedIds={selectedIds}
        allSelected={allSelected}
        someSelected={someSelected}
        showDeleted={showDeleted}
        canWrite={canWrite}
        canDelete={canDelete}
        isColumnVisible={columnVisible}
        columnRegistry={columnRegistry}
        statusConfig={statusConfig}
        sortField={sortField}
        sortDir={sortDir}
        getColumnWidth={getColumnWidth}
        onColumnResize={onColumnResize}
        onSort={handleSort}
        onSelectAll={handleSelectAll}
        onSelectOne={handleSelectOne}
        onView={onView}
        onEdit={onEdit}
        onRequestDelete={handleRequestDelete}
        onRestore={onRestore}
        onSms={onSms}
        onWhatsApp={onWhatsApp}
        onEmail={onEmail}
      />
    </div>
  );
}
