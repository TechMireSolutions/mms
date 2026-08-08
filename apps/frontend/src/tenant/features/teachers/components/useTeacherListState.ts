import { useState } from 'react';
import type { Teacher, TeacherSortField } from '@mms/shared';
import { getDirectoryPageSelection } from '@/lib/directorySelection';
import { useTeacherStatusConfig } from '@/tenant/features/teachers/hooks/useTeacherStatusConfig';

interface UseTeacherListStateOptions {
  teachers: Teacher[];
  showDeleted: boolean;
  selectedIds: string[];
  onSelectOne: (id: string) => void;
  onSelectAll: (pageIds: string[]) => void;
  controlledSortField?: TeacherSortField;
  controlledSortDir?: 'asc' | 'desc';
  /** Server SQL sort (Work list SSOT) — required; client re-sort removed. */
  onSortChange: (field: TeacherSortField, dir: 'asc' | 'desc') => void;
  isColumnVisible?: (columnId: string) => boolean;
}

export function useTeacherListState({
  teachers,
  showDeleted: _showDeleted,
  selectedIds,
  onSelectOne,
  onSelectAll,
  controlledSortField = 'name',
  controlledSortDir = 'asc',
  onSortChange,
  isColumnVisible,
}: UseTeacherListStateOptions) {
  const columnVisible = isColumnVisible ?? (() => true);

  const statusConfig = useTeacherStatusConfig();

  const sortField = controlledSortField;
  const sortDir = controlledSortDir;

  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);
  const [confirmBulkRestoreOpen, setConfirmBulkRestoreOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [viewTeacher, setViewTeacher] = useState<Teacher | null>(null);

  const handleSort = (field: TeacherSortField) => {
    const resolvedDir = sortField === field && sortDir === 'asc' ? 'desc' : 'asc';
    onSortChange(field, resolvedDir);
  };

  const pageIds = teachers.map((teacher) => String(teacher.id));
  const { allSelected, someSelected } = getDirectoryPageSelection(pageIds, selectedIds);

  const handleSelectAll = () => {
    onSelectAll(pageIds);
  };

  const handleSelectOne = (id: string) => {
    onSelectOne(id);
  };

  return {
    sorted: teachers,
    sortField,
    sortDir,
    statusConfig,
    isColumnVisible: columnVisible,
    selectedIds,
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
    handleSort,
    handleSelectAll,
    handleSelectOne,
  };
}
