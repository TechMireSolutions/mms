import React from 'react';
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
import { TaskFormAssigneePicker } from './TaskFormAssigneePicker';
import { useTaskFormController } from './useTaskFormController';

export interface TaskFormModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: TaskRecord | null;
  onSave: (data: TaskInsert) => Promise<void>;
  saving?: boolean;
}

export function TaskFormModal({
  open,
  onClose,
  initialData,
  onSave,
  saving = false,
}: TaskFormModalProps): React.JSX.Element {
  const {
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
  } = useTaskFormController({ open, onClose, initialData, onSave });

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

          <TaskFormAssigneePicker
            eligibleList={eligibleList}
            selectedAssignees={selectedAssignees}
            onAddAssignee={handleAddAssignee}
            onRemoveAssignee={handleRemoveAssignee}
          />
        </div>
      </div>
    </FormModal>
  );
}
