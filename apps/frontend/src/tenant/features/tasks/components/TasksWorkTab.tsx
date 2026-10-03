import React from 'react';
import { Plus, Pencil, Trash2, RotateCcw } from 'lucide-react';
import type { TaskRecord, TaskStatus } from '@mms/shared';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ModuleTrashToggle } from '@/components/ui/ModuleTrashToggle';
import { DataTable, DataTableRowActions } from '@/components/common/data-table';
import { useTranslation } from '@/hooks/useTranslation';
import { TaskCardItem } from './TaskCardItem';
import {
  TASK_NEXT_STATUS,
  buildTasksWorkColumns,
  buildTasksWorkFilters,
} from './tasksWorkColumns';

export interface TasksWorkTabProps {
  tasks: TaskRecord[];
  isLoading: boolean;
  canWrite: boolean;
  canDelete: boolean;
  viewingDeleted?: boolean;
  onToggleTrash?: (next: boolean) => void;
  onAddNew: () => void;
  onEdit: (task: TaskRecord) => void;
  onDelete: (id: string) => void;
  onRestore?: (id: string) => void;
  onUpdateStatus: (id: string, status: TaskStatus) => void;
}

export function TasksWorkTab({
  tasks,
  isLoading,
  canWrite,
  canDelete,
  viewingDeleted = false,
  onToggleTrash,
  onAddNew,
  onEdit,
  onDelete,
  onRestore,
  onUpdateStatus,
}: TasksWorkTabProps): React.JSX.Element {
  const { t } = useTranslation();

  const handleCycleStatus = (task: TaskRecord) => {
    if (viewingDeleted) return;
    onUpdateStatus(task.id, TASK_NEXT_STATUS[task.status] || 'todo');
  };

  const trashToggle = onToggleTrash && canDelete ? (
    <ModuleTrashToggle
      viewingDeleted={viewingDeleted}
      onToggle={() => onToggleTrash(!viewingDeleted)}
    />
  ) : null;

  const primaryAction = (
    <div className="flex items-center gap-2">
      {trashToggle}
      {canWrite && !viewingDeleted ? (
        <Button type="button" className="min-h-11 gap-1.5" onClick={onAddNew}>
          <Plus className="h-4 w-4" />
          {t('tasks.create')}
        </Button>
      ) : null}
    </div>
  );

  return (
    <DataTable
      tableId="tasks.work"
      label={t('nav.tasks')}
      data={tasks}
      columns={buildTasksWorkColumns(t, canWrite, handleCycleStatus)}
      filters={buildTasksWorkFilters(t)}
      isLoading={isLoading}
      primaryAction={primaryAction}
      renderCard={(task) => (
        <TaskCardItem
          task={task}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusCycle={handleCycleStatus}
          canWrite={canWrite && !viewingDeleted}
          canDelete={canDelete}
        />
      )}
      renderRowActions={(task) => {
        const actions = [];
        if (viewingDeleted && canDelete && onRestore) {
          actions.push({
            id: 'restore',
            label: t('tasks.restore'),
            icon: RotateCcw,
            onClick: () => onRestore(task.id),
          });
        } else {
          if (canWrite) {
            actions.push({ id: 'edit', label: t('common.edit'), icon: Pencil, onClick: () => onEdit(task) });
          }
          if (canDelete) {
            actions.push({
              id: 'delete',
              label: t('common.delete'),
              icon: Trash2,
              tone: 'destructive' as const,
              onClick: () => onDelete(task.id),
            });
          }
        }
        return actions.length > 0 ? <DataTableRowActions actions={actions} /> : null;
      }}
      emptyState={
        <EmptyState
          title={viewingDeleted ? t('tasks.trashEmptyTitle') : t('tasks.emptyTitle')}
          description={viewingDeleted ? t('tasks.trashEmptyDescription') : t('tasks.emptyDescription')}
          action={!viewingDeleted ? primaryAction : undefined}
        />
      }
    />
  );
}
