import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  type TaskRecord,
  type TaskInsert,
  type TaskPriority,
  type TaskStatus,
  type AppTranslationKey,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from '@mms/shared';
import { FormModal } from '@/components/ui/FormModal';
import { apiJson } from '@/lib/apiClient';
import { useTranslation } from '@/hooks/useTranslation';

export interface TaskFormModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: TaskRecord | null;
  onSave: (data: TaskInsert) => Promise<void>;
  saving?: boolean;
}

interface FacultyOption {
  id: string;
  name: string;
  userId?: string | null;
  positionId?: string | null;
  designationName?: string | null;
}

export function TaskFormModal({
  open,
  onClose,
  initialData,
  onSave,
  saving = false,
}: TaskFormModalProps): React.JSX.Element {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [dueAt, setDueAt] = useState('');
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: facultyList = [] } = useQuery({
    queryKey: ['faculty', 'selectable-list'],
    queryFn: async ({ signal }) => {
      const res = await apiJson<{ faculty: FacultyOption[] }>('/api/faculty?limit=200', { signal });
      return res.faculty ?? [];
    },
    enabled: open,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description ?? '');
      setPriority(initialData.priority);
      setStatus(initialData.status);
      setDueAt(initialData.dueAt ? new Date(initialData.dueAt).toISOString().slice(0, 16) : '');
      const firstAssignee = initialData.assignees?.[0];
      setSelectedFacultyId(firstAssignee?.facultyId ?? '');
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setStatus('todo');
      setDueAt('');
      setSelectedFacultyId('');
    }
    setError(null);
  }, [initialData, open]);

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Title is required');
      return;
    }

    const assignees = selectedFacultyId
      ? [
          {
            facultyId: selectedFacultyId,
            ...(facultyList.find((f) => f.id === selectedFacultyId)?.positionId
              ? { positionId: facultyList.find((f) => f.id === selectedFacultyId)?.positionId ?? undefined }
              : {}),
          },
        ]
      : [];

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

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={initialData ? t('tasks.edit') : t('tasks.create')}
      error={error ?? undefined}
      saving={saving}
      isDirty={Boolean(title.trim())}
      onSave={handleSubmit}
    >
      <div className="space-y-4 py-2">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            {t('tasks.title')} *
          </label>
          <input
            type="text"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter task title"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            {t('tasks.description')}
          </label>
          <textarea
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional detailed instructions"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t('tasks.priority')}
            </label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
            >
              {TASK_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {t(`tasks.priority.${p}` as AppTranslationKey)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t('tasks.status')}
            </label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
            >
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`tasks.status.${s}` as AppTranslationKey)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t('tasks.dueAt')}
            </label>
            <input
              type="datetime-local"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t('tasks.assignees')}
            </label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={selectedFacultyId}
              onChange={(e) => setSelectedFacultyId(e.target.value)}
            >
              <option value="">{t('tasks.noAssignees')}</option>
              {facultyList.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} {f.designationName ? `(${f.designationName})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </FormModal>
  );
}
