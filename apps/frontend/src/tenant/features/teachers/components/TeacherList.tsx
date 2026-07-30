import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { SEMANTIC_BADGE } from '@/lib/semanticTone';
import { DEFAULT_TEACHERS_SETTINGS, type AppTranslationKey, toTitleCase } from '@mms/shared';
import { useTeacherConfig } from '@/hooks/useStandardModuleConfig';
import type { Teacher } from '@/lib/data/teachersData';
import { TeacherListConfirmDialogs } from '@/tenant/features/teachers/components/TeacherListConfirmDialogs';
import { TeacherListContent } from '@/tenant/features/teachers/components/TeacherListContent';
import { TeacherListDetailDrawer } from '@/tenant/features/teachers/components/TeacherListDetailDrawer';
import { TeacherListSelectionBar } from '@/tenant/features/teachers/components/TeacherListSelectionBar';
import type { TeacherListProps, TeacherSortField } from '@/tenant/features/teachers/components/TeacherListTypes';

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
}: TeacherListProps): React.JSX.Element {
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

  const allSelected = sorted.length > 0 && selectedIds.length === sorted.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < sorted.length;
  const selectedTeachers = teachers.filter((teacher) => selectedIds.includes(String(teacher.id)));

  const handleSelectAll = () => {
    if (selectedIds.length === sorted.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sorted.map((teacher) => String(teacher.id)));
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((previousSelectedIds) =>
      previousSelectedIds.includes(id)
        ? previousSelectedIds.filter((selectedId) => selectedId !== id)
        : [...previousSelectedIds, id],
    );
  };

  const showSelectColumn = canWrite || canDelete;
  const showActionsColumn = canWrite || canDelete || !showDeleted;

  return (
    <div className="space-y-4">
      <TeacherListContent
        teachers={sorted}
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
        showDeleted={showDeleted}
        onClose={() => setViewTeacher(null)}
        onEdit={(teacherToEdit) => {
          setViewTeacher(null);
          onEdit(teacherToEdit);
        }}
      />
    </div>
  );
}
