import { useState, useEffect } from 'react';
import {
  type TaskRecord,
  type TaskInsert,
  type TaskPriority,
  type TaskStatus,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useEligibleTaskAssignees } from '@/tenant/hooks/collections/tasks';
import type { SelectedAssignee } from './TaskFormAssigneePicker';

export interface UseTaskFormControllerProps {
  open: boolean;
  onClose: () => void;
  initialData?: TaskRecord | null;
  onSave: (data: TaskInsert) => Promise<void>;
}

export function useTaskFormController({
  open,
  onClose,
  initialData,
  onSave,
}: UseTaskFormControllerProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [dueAt, setDueAt] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState<SelectedAssignee[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { data: eligibleList = [] } = useEligibleTaskAssignees({ enabled: open });

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description ?? '');
      setPriority(initialData.priority);
      setStatus(initialData.status);
      setDueAt(initialData.dueAt ? new Date(initialData.dueAt).toISOString().slice(0, 16) : '');
      const current = initialData.assignees?.map((a) => ({
        facultyId: a.facultyId,
        name: a.facultyName || 'Staff Member',
        positionId: a.positionId ?? undefined,
        positionName: a.positionName ?? undefined,
      })) ?? [];
      setSelectedAssignees(current);
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setStatus('todo');
      setDueAt('');
      setSelectedAssignees([]);
    }
    setError(null);
  }, [initialData, open]);

  const handleAddAssignee = (facultyId: string) => {
    if (!facultyId) return;
    if (selectedAssignees.some((a) => a.facultyId === facultyId)) return;
    const match = eligibleList.find((item) => item.facultyId === facultyId);
    if (!match) return;
    setSelectedAssignees((prev) => [
      ...prev,
      {
        facultyId: match.facultyId,
        name: match.name,
        positionId: match.positionId ?? undefined,
        positionName: match.positionName ?? undefined,
      },
    ]);
  };

  const handleRemoveAssignee = (facultyId: string) => {
    setSelectedAssignees((prev) => prev.filter((a) => a.facultyId !== facultyId));
  };

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Title is required');
      return;
    }

    const assignees = selectedAssignees.map((a) => ({
      facultyId: a.facultyId,
      ...(a.positionId ? { positionId: a.positionId } : {}),
    }));

    const payload: TaskInsert = {
      title: trimmedTitle,
      description: description.trim() || undefined,
      priority,
      status,
      dueAt: dueAt ? new Date(dueAt).toISOString() : null,
      assignees,
    };

    try {
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save task');
    }
  };

  return {
    t,
    title,
    setTitle,
    description,
    setDescription,
    priority,
    setPriority,
    status,
    setStatus,
    dueAt,
    setDueAt,
    selectedAssignees,
    eligibleList,
    error,
    handleAddAssignee,
    handleRemoveAssignee,
    handleSubmit,
  };
}
