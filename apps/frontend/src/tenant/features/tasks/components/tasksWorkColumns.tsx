/**
 * @file tasksWorkColumns.tsx
 * @description Column + filter definitions for Tasks Work directory.
 */

import { User as UserIcon } from 'lucide-react';
import {
  type TaskRecord,
  type TaskStatus,
  type AppTranslationKey,
  TASK_STATUSES,
  TASK_PRIORITIES,
} from '@mms/shared';
import type { DataTableColumn, DataTableFilter } from '@/components/common/data-table';
import { TaskPriorityBadge, TaskStatusBadge } from './TaskBadges';

export function buildTasksWorkColumns(
  t: (key: AppTranslationKey) => string,
  canWrite: boolean,
  onCycleStatus: (task: TaskRecord) => void,
): DataTableColumn<TaskRecord>[] {
  return [
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
          onClick={canWrite ? () => onCycleStatus(task) : undefined}
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
              {task.assignees
                .map((a) => a.facultyName || a.positionName || t('tasks.assigneeFallback'))
                .join(', ')}
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
}

export function buildTasksWorkFilters(
  t: (key: AppTranslationKey) => string,
): DataTableFilter<TaskRecord>[] {
  return [
    {
      id: 'status',
      label: t('tasks.status'),
      options: TASK_STATUSES.map((s) => ({
        value: s,
        label: t(`tasks.status.${s}` as AppTranslationKey),
      })),
      getValue: (task) => task.status,
    },
    {
      id: 'priority',
      label: t('tasks.priority'),
      options: TASK_PRIORITIES.map((p) => ({
        value: p,
        label: t(`tasks.priority.${p}` as AppTranslationKey),
      })),
      getValue: (task) => task.priority,
    },
  ];
}

export const TASK_NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  todo: 'in_progress',
  in_progress: 'in_review',
  in_review: 'completed',
  blocked: 'in_progress',
  completed: 'todo',
  cancelled: 'todo',
};
