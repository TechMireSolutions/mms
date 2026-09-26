import { useState } from 'react';
import type { FacultyDesignationAssignment, FacultyMember } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { notify } from '@/lib/notify';
import {
  useFacultyDesignationHistory,
  useFacultyDesignations,
  useSaveFacultyDesignationAssignment,
  useDeleteFacultyDesignationAssignment,
  useTransitionFacultyDesignation,
} from './useFacultyDesignations';
import type {
  DesignationAssignmentFormState,
  DesignationHistoryMode,
} from '../components/FacultyDesignationFormCard';

export const EMPTY_DESIGNATION_FORM: DesignationAssignmentFormState = {
  id: '',
  designationId: '',
  startsOn: new Date().toISOString().slice(0, 10),
  endsOn: '',
  notes: '',
};

export function useFacultyDesignationHistoryController(faculty: FacultyMember) {
  const { t } = useTranslation();
  const history = useFacultyDesignationHistory(String(faculty.id));
  const definitions = useFacultyDesignations();
  const save = useSaveFacultyDesignationAssignment();
  const deleteMutation = useDeleteFacultyDesignationAssignment();
  const transition = useTransitionFacultyDesignation();

  const [mode, setMode] = useState<DesignationHistoryMode>('idle');
  const [form, setForm] = useState<DesignationAssignmentFormState>(EMPTY_DESIGNATION_FORM);

  const today = new Date().toISOString().slice(0, 10);
  const allAssignments = history.data ?? [];
  const currentAssignment: FacultyDesignationAssignment | null =
    allAssignments.find(
      (a) => a.startsOn <= today && (!a.endsOn || a.endsOn >= today),
    ) ?? null;

  const activeDefinitionOptions = (definitions.data ?? [])
    .filter((d) => d.isActive || d.id === form.designationId)
    .map((d) => ({ value: d.id, label: d.name }));

  const reset = () => {
    setMode('idle');
    setForm(EMPTY_DESIGNATION_FORM);
  };

  const openEdit = (assignment: FacultyDesignationAssignment) => {
    setMode('edit');
    setForm({
      id: assignment.id,
      designationId: assignment.designationId,
      startsOn: assignment.startsOn,
      endsOn: assignment.endsOn ?? '',
      notes: assignment.notes ?? '',
    });
  };

  const patchForm = (patch: Partial<DesignationAssignmentFormState>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const handleTransitionSubmit = async () => {
    if (!form.designationId || !form.startsOn) return;
    try {
      await transition.mutateAsync({
        facultyId: String(faculty.id),
        currentAssignment,
        newDesignationId: form.designationId,
        transitionDate: form.startsOn,
        notes: form.notes.trim() || null,
      });
      notify.success(t('faculty.designations.transitionSaved'));
      reset();
    } catch (error) {
      notify.error(
        error instanceof Error ? error.message : t('faculty.designations.assignmentFailed'),
      );
    }
  };

  const handleEditSubmit = async () => {
    if (!form.designationId || !form.startsOn || !form.id) return;
    try {
      await save.mutateAsync({
        id: form.id,
        facultyId: String(faculty.id),
        designationId: form.designationId,
        startsOn: form.startsOn,
        endsOn: form.endsOn || null,
        notes: form.notes.trim() || null,
      });
      notify.success(t('faculty.designations.assignmentSaved'));
      reset();
    } catch (error) {
      notify.error(
        error instanceof Error ? error.message : t('faculty.designations.assignmentFailed'),
      );
    }
  };

  const handleAddSubmit = async () => {
    if (!form.designationId || !form.startsOn) return;
    try {
      await save.mutateAsync({
        id: crypto.randomUUID(),
        facultyId: String(faculty.id),
        designationId: form.designationId,
        startsOn: form.startsOn,
        endsOn: form.endsOn || null,
        notes: form.notes.trim() || null,
      });
      notify.success(t('faculty.designations.assignmentSaved'));
      reset();
    } catch (error) {
      notify.error(
        error instanceof Error ? error.message : t('faculty.designations.assignmentFailed'),
      );
    }
  };

  const handleDelete = async (assignment: FacultyDesignationAssignment) => {
    try {
      await deleteMutation.mutateAsync({
        facultyId: String(faculty.id),
        assignmentId: assignment.id,
      });
      notify.success(t('faculty.designations.assignmentDeleted'));
      if (mode === 'edit' && form.id === assignment.id) reset();
    } catch (error) {
      notify.error(
        error instanceof Error ? error.message : t('faculty.designations.assignmentFailed'),
      );
    }
  };

  const isBusy = save.isPending || deleteMutation.isPending || transition.isPending;
  const canDeleteAny = allAssignments.length > 1;

  const handleSubmit =
    mode === 'transition'
      ? () => void handleTransitionSubmit()
      : mode === 'edit'
        ? () => void handleEditSubmit()
        : () => void handleAddSubmit();

  const minTransitionDate = (() => {
    if (!currentAssignment) return undefined;
    const d = new Date(`${currentAssignment.startsOn}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
  })();

  return {
    history,
    mode,
    setMode,
    form,
    setForm,
    today,
    allAssignments,
    currentAssignment,
    activeDefinitionOptions,
    reset,
    openEdit,
    patchForm,
    handleDelete,
    handleSubmit,
    isBusy,
    canDeleteAny,
    minTransitionDate,
    deleteMutation,
  };
}
