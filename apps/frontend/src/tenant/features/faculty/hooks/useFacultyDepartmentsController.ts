import { useMemo, useState } from 'react';
import type { FacultyDepartmentEntity } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { notify } from '@/lib/notify';
import {
  useFacultyDepartments,
  useSaveFacultyDepartment,
  useDeleteFacultyDepartment,
} from './useFacultyDepartments';

export function slugifyDepartmentCode(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32);
}

export function getDescendantDepartmentIds(all: FacultyDepartmentEntity[], rootId: string): Set<string> {
  const ids = new Set<string>([rootId]);
  let added = true;
  while (added) {
    added = false;
    for (const d of all) {
      if (d.parentId && ids.has(d.parentId) && !ids.has(d.id)) {
        ids.add(d.id);
        added = true;
      }
    }
  }
  return ids;
}

export function useFacultyDepartmentsController() {
  const { t } = useTranslation();
  const { data: departments = [], isLoading } = useFacultyDepartments();
  const saveMutation = useSaveFacultyDepartment();
  const deleteMutation = useDeleteFacultyDepartment();

  const [editingDepartment, setEditingDepartment] = useState<FacultyDepartmentEntity | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [parentId, setParentId] = useState('');

  const isPending = saveMutation.isPending || deleteMutation.isPending || isLoading;

  const handleStartEdit = (dept: FacultyDepartmentEntity) => {
    setEditingDepartment(dept);
    setName(dept.name);
    setCode(dept.code);
    setParentId(dept.parentId || '');
  };

  const handleCancelEdit = () => {
    setEditingDepartment(null);
    setName('');
    setCode('');
    setParentId('');
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const trimmedCode = code.trim() || slugifyDepartmentCode(trimmedName);
    const editingId = editingDepartment?.id;
    const isDuplicate = departments.some(
      (d) => d.id !== editingId && d.code.toLowerCase() === trimmedCode.toLowerCase(),
    );
    if (isDuplicate) {
      notify.error(t('faculty.setup.departmentCodeDuplicate'));
      return;
    }

    try {
      await saveMutation.mutateAsync({
        id: editingId || crypto.randomUUID(),
        name: trimmedName,
        code: trimmedCode,
        parentId: parentId.trim() || null,
      });
      notify.success(t('faculty.setup.departmentSaved'));
      handleCancelEdit();
    } catch {
      notify.error(t('faculty.setup.lookupsSaveFailed'));
    }
  };

  const handleDelete = async (dept: FacultyDepartmentEntity) => {
    try {
      await deleteMutation.mutateAsync(dept.id);
      if (editingDepartment?.id === dept.id) {
        handleCancelEdit();
      }
      notify.success(t('faculty.setup.departmentSaved'));
    } catch (err) {
      const msg = err instanceof Error ? err.message.toLowerCase() : '';
      const isConflict =
        msg.includes('assignment') || msg.includes('children') || msg.includes('dependents');
      notify.error(
        isConflict
          ? t('faculty.setup.departmentInUse')
          : t('faculty.setup.lookupsSaveFailed'),
      );
    }
  };

  const availableParents = useMemo(() => {
    if (!editingDepartment) return departments;
    const forbidden = getDescendantDepartmentIds(departments, editingDepartment.id);
    return departments.filter((d) => !forbidden.has(d.id));
  }, [departments, editingDepartment]);

  const orderedDepartments = useMemo(() => {
    const roots = departments.filter((d) => !d.parentId);
    const withParents = departments.filter((d) => Boolean(d.parentId));
    return [...roots, ...withParents.filter((d) => !roots.some((r) => r.id === d.id))];
  }, [departments]);

  const parentOptions = useMemo(() => [
    { value: '', label: t('faculty.setup.noParentDepartment') },
    ...availableParents.map((d) => ({
      value: d.id,
      label: `${d.name} (${d.code})`,
    })),
  ], [availableParents, t]);

  return {
    t,
    departments,
    orderedDepartments,
    availableParents,
    parentOptions,
    isLoading,
    isPending,
    editingDepartment,
    name,
    setName,
    code,
    setCode,
    parentId,
    setParentId,
    handleStartEdit,
    handleCancelEdit,
    handleSubmit,
    handleDelete,
  };
}
