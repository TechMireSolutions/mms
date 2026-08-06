import { useEffect, useMemo, useState } from 'react';
import { SEMANTIC_BADGE } from '@/lib/semanticTone';
import { DEFAULT_TEACHERS_SETTINGS, type AppTranslationKey, toTitleCase } from '@mms/shared';
import { useTeacherConfig } from '@/hooks/useStandardModuleConfig';
import {
  getDirectoryPageSelection,
  toggleIdInSelection,
  togglePageIdsInSelection,
} from '@/lib/directorySelection';
import type { Teacher } from '@/lib/data/teachersData';
import type { TeacherSortField } from '@/tenant/features/teachers/components/TeacherListTypes';
import { useTranslation } from '@/hooks/useTranslation';

interface UseTeacherListStateOptions {
  teachers: Teacher[];
  showDeleted: boolean;
  selectionResetKey?: string | number;
  controlledSortField?: TeacherSortField;
  controlledSortDir?: 'asc' | 'desc';
  onSortChange?: (field: TeacherSortField, dir: 'asc' | 'desc') => void;
  isColumnVisible?: (columnId: string) => boolean;
}

export function useTeacherListState({
  teachers,
  showDeleted,
  selectionResetKey,
  controlledSortField,
  controlledSortDir,
  onSortChange,
  isColumnVisible,
}: UseTeacherListStateOptions) {
  const { t } = useTranslation();
  const { settings, statuses } = useTeacherConfig();

  const customFields = useMemo(() => settings.customFields ?? [], [settings.customFields]);
  const sortedCustomFields = useMemo(() => {
    const order = settings.fieldOrder ?? DEFAULT_TEACHERS_SETTINGS.fieldOrder ?? [];
    const orderByFieldId = Object.fromEntries(order.map((fieldId, index) => [fieldId, index]));
    return [...customFields].sort((firstField, secondField) => {
      const firstFieldOrder = orderByFieldId[firstField.id] ?? 9999;
      const secondFieldOrder = orderByFieldId[secondField.id] ?? 9999;
      return firstFieldOrder - secondFieldOrder;
    });
  }, [customFields, settings.fieldOrder]);

  const showSpecialization = isColumnVisible ? isColumnVisible('specialization') : true;
  const showQualification = isColumnVisible ? isColumnVisible('qualification') : true;
  const showJoinDate = isColumnVisible ? isColumnVisible('joinDate') : true;
  const showStatus = isColumnVisible ? isColumnVisible('status') : true;
  const visibleCustomFields = sortedCustomFields.filter((field) =>
    isColumnVisible ? isColumnVisible(`custom:${field.id}`) : true,
  );

  const statusConfig = useMemo(() => {
    const configByStatus: Record<string, { label: string; cls: string }> = {};
    const statusValues = statuses.length > 0 ? statuses : ['active', 'inactive', 'on_leave'];
    for (const statusValue of statusValues) {
      const translationKey = `teachers.status.${statusValue}` as AppTranslationKey;
      const translated = t(translationKey);
      const label = translated === translationKey ? toTitleCase(statusValue) : translated;

      let cls: string = SEMANTIC_BADGE.muted;
      if (statusValue === 'active') cls = SEMANTIC_BADGE.success;
      else if (statusValue === 'on_leave') cls = SEMANTIC_BADGE.warning;
      else if (statusValue === 'inactive') cls = SEMANTIC_BADGE.muted;

      configByStatus[statusValue] = { label, cls };
    }
    return configByStatus;
  }, [statuses, t]);

  const [localSortField, setLocalSortField] = useState<TeacherSortField>('name');
  const [localSortDir, setLocalSortDir] = useState<'asc' | 'desc'>('asc');
  const sortField = controlledSortField ?? localSortField;
  const sortDir = controlledSortDir ?? localSortDir;
  const serverSorted = Boolean(onSortChange);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);
  const [confirmBulkRestoreOpen, setConfirmBulkRestoreOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [viewTeacher, setViewTeacher] = useState<Teacher | null>(null);

  useEffect(() => {
    setSelectedIds([]);
  }, [selectionResetKey, showDeleted]);

  const sorted = useMemo(() => {
    if (serverSorted) return teachers;
    const sortedTeachers = [...teachers];
    sortedTeachers.sort((firstTeacher, secondTeacher) => {
      const firstSortValue = sortField === 'name'
        ? (firstTeacher.name ?? '').toLowerCase()
        : String(firstTeacher[sortField] ?? '');
      const secondSortValue = sortField === 'name'
        ? (secondTeacher.name ?? '').toLowerCase()
        : String(secondTeacher[sortField] ?? '');
      const comparison = firstSortValue.localeCompare(secondSortValue);
      return sortDir === 'asc' ? comparison : -comparison;
    });
    return sortedTeachers;
  }, [teachers, sortField, sortDir, serverSorted]);

  const handleSort = (field: TeacherSortField) => {
    const resolvedDir = sortField === field && sortDir === 'asc' ? 'desc' : 'asc';
    if (onSortChange) {
      onSortChange(field, resolvedDir);
      return;
    }
    if (sortField === field) {
      setLocalSortDir(resolvedDir);
    } else {
      setLocalSortField(field);
      setLocalSortDir('asc');
    }
  };

  const pageIds = sorted.map((teacher) => String(teacher.id));
  const { allSelected, someSelected } = getDirectoryPageSelection(pageIds, selectedIds);
  const selectedTeachers = teachers.filter((teacher) => selectedIds.includes(String(teacher.id)));

  const handleSelectAll = () => {
    setSelectedIds((current) => togglePageIdsInSelection(current, pageIds));
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((previousSelectedIds) => toggleIdInSelection(previousSelectedIds, id));
  };

  return {
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
  };
}
