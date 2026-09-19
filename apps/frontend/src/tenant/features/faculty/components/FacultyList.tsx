import React from 'react';
import type { Faculty, Teacher } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { FacultyListContent } from '@/tenant/features/faculty/components/FacultyListContent';
import type { FacultyListProps } from '@/tenant/features/faculty/components/facultyListTypes';
import { resolveFacultyDisplayName, resolveTeacherDisplayName } from '@/tenant/features/faculty/components/facultyFieldDisplay';
import { useTeacherListState } from '@/tenant/features/faculty/components/useFacultyListState';

export type {
  FacultyListProps,
  FacultySortField,
  TeacherListProps,
  TeacherSortField,
} from '@/tenant/features/faculty/components/facultyListTypes';

/** Work directory content (table/cards + empty state) — confirms/drawer live at page level. */
export function FacultyList(props: FacultyListProps): React.JSX.Element {
  const {
    faculty,
    teachers: rawTeachers,
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
  } = props;

  const listItems = faculty ?? rawTeachers ?? [];
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
    teachers: listItems,
    showDeleted,
    selectedIds,
    onSelectOne,
    onSelectAll,
    controlledSortField,
    controlledSortDir,
    onSortChange,
    isColumnVisible,
  });

  const resolveName = resolveFacultyDisplayName || resolveTeacherDisplayName;

  const handleRequestDelete = (id: string) => {
    const member = listItems.find((candidate: Faculty | Teacher) => String(candidate.id) === String(id));
    const name = member ? resolveName(member, t, undefined) : undefined;
    onDeleteTargetChange({ id, name });
  };

  return (
    <div className="space-y-4">
      <FacultyListContent
        teachers={sorted}
        faculty={sorted}
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

export const TeachersList = FacultyList;

