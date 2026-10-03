import React from 'react';
import { Plus, Pencil, Trash2, User as UserIcon } from 'lucide-react';
import {
  type TaskRecord,
  type TaskStatus,
  type AppTranslationKey,
  TASK_STATUSES,
  TASK_PRIORITIES,
} from '@mms/shared';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  DataTable,
  DataTableRowActions,
  type DataTableColumn,
  type DataTableFilter,
} from '@/components/common/data-table';
import { useTranslation } from '@/hooks/useTranslation';
import { TaskPriorityBadge, TaskStatusBadge } from './TaskBadges';
import { TaskCardItem } from './TaskCardItem';

export interface TasksWorkTabProps {
  tasks: TaskRecord[];
  isLoading: boolean;
  canWrite: boolean;
  canDelete: boolean;
  onAddNew: () => void;
  onEdit: (task: TaskRecord) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: TaskStatus) => void;
}

const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  todo: 'in_progress',
  in_progress: 'in_review',
  in_review: 'completed',
  blocked: 'in_progress',
  completed: 'todo',
  cancelled: 'todo',
};

export function TasksWorkTab({
  tasks,
  isLoading,
  canWrite,
  canDelete,
  onAddNew,
  onEdit,
  onDelete,
  onUpdateStatus,
}: TasksWorkTabProps): React.JSX.Element {
  const { t } = useTranslation();

  const handleCycleStatus = (task: TaskRecord) => {
    const next = NEXT_STATUS[task.status] || 'todo';
    onUpdateStatus(task.id, next);
  };

  const columns: DataTableColumn<TaskRecord>[] = [
    {
      id: 'title',
      label: t('tasks.title'),
      fixed: true,
      searchValue: (task) => `${task.title} ${task.description ?? ''}`,
      render: (task) => (
        <div>
          <div className="font-medium text-foreground">{task.title}</div>
          {task.description ? (
            <div className="text-xs text-muted-foreground line-clamp-1">{task.description}</div>
          ) : null}
        </div>
      ),
    },
    {
      id: 'priority',
      label: t('tasks.priority'),
      width: 120,
      render: (task) => <TaskPriorityBadge priority={task.priority} />,
    },
    {
      id: 'status',
      label: t('tasks.status'),
      width: 140,
      render: (task) => (
        <TaskStatusBadge
          status={task.status}
          onClick={canWrite ? () => handleCycleStatus(task) : undefined}
        />
      ),
    },
    {
      id: 'assignees',
      label: t('tasks.assignees'),
      searchValue: (task) =>
        task.assignees?.map((a) => a.facultyName || a.positionName).filter(Boolean).join(' ') ?? '',
      render: (task) =>
        task.assignees?.length ? (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <UserIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {task.assignees.map((a) => a.facultyName || a.positionName || 'Staff').join(', ')}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground/60 text-xs">{t('tasks.noAssignees')}</span>
        ),
    },
    {
      id: 'dueAt',
      label: t('tasks.dueAt'),
      width: 120,
      render: (task) => {
        if (!task.dueAt) return <span className="text-muted-foreground/60 text-xs">—</span>;
        const isOverdue =
          task.status !== 'completed' &&
          task.status !== 'cancelled' &&
          new Date(task.dueAt) < new Date();
        return (
          <span className={isOverdue ? 'text-destructive font-medium text-xs' : 'text-muted-foreground text-xs'}>
            {new Date(task.dueAt).toLocaleDateString()}
          </span>
        );
      },
    },
  ];

  const filters: DataTableFilter<TaskRecord>[] = [
    {
      id: 'status',
      label: 'Status',
      options: TASK_STATUSES.map((s) => ({ value: s, label: t(`tasks.status.${s}` as AppTranslationKey) })),
      getValue: (task) => task.status,
    },
    {
      id: 'priority',
      label: 'Priority',
      options: TASK_PRIORITIES.map((p) => ({ value: p, label: t(`tasks.priority.${p}` as AppTranslationKey) })),
      getValue: (task) => task.priority,
    },
  ];

  const primaryAction = canWrite ? (
    <button
      type="button"
      onClick={onAddNew}
      className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
    >
      <Plus className="h-4 w-4" />
      <span>{t('tasks.create')}</span>
    </button>
  ) : undefined;

  return (
    <DataTable
      tableId="tasks.work"
      label="Tasks"
      data={tasks}
      columns={columns}
      filters={filters}
      isLoading={isLoading}
      primaryAction={primaryAction}
      renderCard={(task) => (
        <TaskCardItem
          task={task}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusCycle={handleCycleStatus}
          canWrite={canWrite}
          canDelete={canDelete}
        />
      )}
      renderRowActions={(task) => {
        const actions = [];
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
        return actions.length > 0 ? <DataTableRowActions actions={actions} /> : null;
      }}
      emptyState={
        <EmptyState
          title={t('tasks.emptyTitle')}
          description={t('tasks.emptyDescription')}
          action={primaryAction}
        />
      }
    />
  );
}
