/**
 * @file useFacultyAssignmentsController.ts
 * @description Controller for Faculty multi-role assignment list + position occupancy edits.
 */

import { useMemo, useState } from 'react';
import type { FacultyAssignmentEntity, FacultyAssignmentWrite, FacultyMember } from '@mms/shared';
import { notify } from '@/lib/notify';
import { useTranslation } from '@/hooks/useTranslation';
import { useQueryClient } from '@tanstack/react-query';
import {
  invalidateOrganizationQueries,
  useOrganizationPositions,
} from '@/tenant/hooks/collections/organization';
import { useFacultyDepartments } from './useFacultyDepartments';
import { useFacultyDesignations } from './useFacultyDesignations';
import {
  useCloseFacultyAssignment,
  useDeleteFacultyAssignment,
  useFacultyAssignments,
  useSaveFacultyAssignment,
} from './useFacultyAssignments';

export interface AssignmentFormState {
  id: string;
  departmentId: string;
  designationId: string;
  positionId: string;
  /** Position id present when the edit form opened; empty for legacy null rows. */
  originalPositionId: string;
  isPrimary: boolean;
  startDate: string;
  endDate: string;
  notes: string;
}

export const EMPTY_ASSIGNMENT_FORM: AssignmentFormState = {
  id: '',
  departmentId: '',
  designationId: '',
  positionId: '',
  originalPositionId: '',
  isPrimary: false,
  startDate: '',
  endDate: '',
  notes: '',
};

export function useFacultyAssignmentsController(faculty: FacultyMember) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const [mode, setMode] = useState<'idle' | 'add' | 'edit'>('idle');
  const [form, setForm] = useState<AssignmentFormState>(EMPTY_ASSIGNMENT_FORM);

  const assignmentsQuery = useFacultyAssignments(faculty.id, { activeOnly: false });
  const { data: departments = [] } = useFacultyDepartments();
  const designationsQuery = useFacultyDesignations();
  const { data: positions = [] } = useOrganizationPositions();
  const saveMutation = useSaveFacultyAssignment(faculty.id);
  const closeMutation = useCloseFacultyAssignment(faculty.id);
  const deleteMutation = useDeleteFacultyAssignment(faculty.id);

  const assignments = assignmentsQuery.data ?? [];
  const designationOptions = (designationsQuery.data ?? [])
    .filter((d) => d.isActive !== false || d.id === form.designationId)
    .map((d) => ({ value: d.id, label: d.name }));
  const departmentOptions = departments
    .filter((d) => d.isActive !== false || d.id === form.departmentId)
    .map((d) => ({ value: d.id, label: d.name }));

  const positionOptions = useMemo(() => {
    return positions
      .filter((p) => p.isActive !== false)
      .filter((p) => !form.departmentId || !p.departmentId || p.departmentId === form.departmentId)
      .filter((p) => !form.designationId || !p.designationId || p.designationId === form.designationId)
      .map((p) => ({
        value: p.id,
        label: `${p.name} (${p.code}) · cap ${p.capacity}`,
      }));
  }, [positions, form.departmentId, form.designationId]);

  const positionNameById = useMemo(
    () => new Map(positions.map((p) => [p.id, p.name])),
    [positions],
  );

  function reset() {
    setMode('idle');
    setForm(EMPTY_ASSIGNMENT_FORM);
  }

  function openEdit(assignment: FacultyAssignmentEntity) {
    setMode('edit');
    setForm({
      id: assignment.id,
      departmentId: assignment.departmentId,
      designationId: assignment.designationId,
      positionId: assignment.positionId ?? '',
      originalPositionId: assignment.positionId ?? '',
      isPrimary: assignment.isPrimary,
      startDate: assignment.startDate,
      endDate: assignment.endDate ?? '',
      notes: assignment.notes ?? '',
    });
  }

  function openAdd() {
    setMode('add');
    const firstActiveDepartment = departments.find((d) => d.isActive !== false);
    const firstActiveDesignation = (designationsQuery.data ?? []).find((d) => d.isActive !== false);
    setForm({
      ...EMPTY_ASSIGNMENT_FORM,
      startDate: today,
      departmentId: firstActiveDepartment?.id ?? '',
      designationId: firstActiveDesignation?.id ?? '',
    });
  }

  const activePositionsExist = positions.some((p) => p.isActive !== false);
  const requiresPosition =
    mode === 'add' || Boolean(form.originalPositionId) || activePositionsExist;
  const allowEmptyPosition = mode === 'edit' && !form.originalPositionId && !activePositionsExist;
  const showLegacyPositionWarning = mode === 'edit' && !form.originalPositionId;

  async function handleSubmit() {
    if (!form.departmentId || !form.designationId || !form.startDate) {
      notify.error(t('faculty.assignments.validationRequired'));
      return;
    }
    if (requiresPosition && !form.positionId) {
      notify.error(t('faculty.assignments.positionRequired'));
      return;
    }
    if (form.originalPositionId && !form.positionId) {
      notify.error(t('faculty.assignments.cannotClearPosition'));
      return;
    }
    const payload: FacultyAssignmentWrite & { id: string } = {
      id: form.id || crypto.randomUUID(),
      facultyId: faculty.id,
      departmentId: form.departmentId,
      designationId: form.designationId,
      isPrimary: form.isPrimary,
      status: 'active',
      startDate: form.startDate,
      endDate: form.endDate || null,
      notes: form.notes || null,
      // Omit positionId on legacy null edits so the backend preserves null until backfill.
      ...(form.positionId
        ? { positionId: form.positionId }
        : mode === 'add'
          ? { positionId: null }
          : {}),
    };
    try {
      await saveMutation.mutateAsync(payload);
      void invalidateOrganizationQueries(queryClient);
      notify.success(t('faculty.assignments.saved'));
      reset();
    } catch {
      notify.error(t('faculty.assignments.saveFailed'));
    }
  }

  async function handleClose(assignmentId: string) {
    try {
      await closeMutation.mutateAsync({
        id: assignmentId,
        endDate: today,
      });
      void invalidateOrganizationQueries(queryClient);
      notify.success(t('faculty.assignments.closed'));
    } catch {
      notify.error(t('faculty.assignments.closeFailed'));
    }
  }

  async function handleDelete(assignmentId: string) {
    try {
      await deleteMutation.mutateAsync(assignmentId);
      void invalidateOrganizationQueries(queryClient);
      notify.success(t('faculty.assignments.deleted'));
    } catch {
      notify.error(t('faculty.assignments.deleteFailed'));
    }
  }

  return {
    assignments,
    isPending: assignmentsQuery.isPending,
    isError: assignmentsQuery.isError,
    refetch: assignmentsQuery.refetch,
    mode,
    form,
    setForm,
    departmentOptions,
    designationOptions,
    positionOptions,
    positionNameById,
    requiresPosition,
    allowEmptyPosition,
    showLegacyPositionWarning,
    isBusy: saveMutation.isPending || closeMutation.isPending || deleteMutation.isPending,
    reset,
    openEdit,
    openAdd,
    handleSubmit,
    handleClose,
    handleDelete,
  };
}
