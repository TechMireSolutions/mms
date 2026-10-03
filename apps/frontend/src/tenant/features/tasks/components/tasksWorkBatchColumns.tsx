/**
 * @file tasksWorkBatchColumns.tsx
 * @description WorkBatchTable column definitions for Tasks Work directory.
 */

import { User as UserIcon } from 'lucide-react';
import {
  type TaskRecord,
  type TaskStatus,
  type AppTranslationKey,
} from '@mms/shared';
import type { WorkBatchTableColumn } from '@/components/common/work/WorkBatchTable';
import { TaskPriorityBadge, TaskStatusBadge } from './TaskBadges';

export const TASK_NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  todo: 'in_progress',
  in_progress: 'in_review',
  in_review: 'completed',
  blocked: 'in_progress',
  completed: 'todo',
  cancelled: 'todo',
};

export function buildTasksWorkBatchColumns(
  t: (key: AppTranslationKey) => string,
  canWrite: boolean,
  onCycleStatus: (task: TaskRecord) => void,
  onView: (task: TaskRecord) => void,
  options?: {
    isColumnVisible?: (key: string) => boolean;
    getColumnWidth?: (key: string) => number | undefined;
  },
): WorkBatchTableColumn<TaskRecord>[] {
  const isVisible = options?.isColumnVisible ?? (() => true);
  const widthOf = options?.getColumnWidth;

  const columns: WorkBatchTableColumn<TaskRecord>[] = [
    {
      id: 'title',
      label: t('tasks.title'),
      width: widthOf?.('title'),
      render: (task) => (
        <button
          type="button"
          className="min-h-11 w-full text-start"
          onClick={() => onView(task)}
        >
          <div className="font-medium text-foreground hover:text-primary transition-colors">
            {task.title}
          </div>
          {task.description ? (
            <div className="text-xs text-muted-foreground line-clamp-1">{task.description}</div>
          ) : null}
        </button>
      ),
    },
    {
      id: 'priority',
      label: t('tasks.priority'),
      width: widthOf?.('priority') ?? 120,
      render: (task) => <TaskPriorityBadge priority={task.priority} />,
    },
    {
      id: 'status',
      label: t('tasks.status'),
      width: widthOf?.('status') ?? 140,
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
      width: widthOf?.('assignees'),
      render: (task) =>
        task.assignees?.length ? (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <UserIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
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
      width: widthOf?.('dueAt') ?? 120,
      render: (task) => {
        if (!task.dueAt) return <span className="text-muted-foreground/60 text-xs">—</span>;
        const isOverdue =
          task.status !== 'completed' &&
          task.status !== 'cancelled' &&
          new Date(task.dueAt) < new Date();
        return (
          <span
            className={
              isOverdue
                ? 'text-destructive font-medium text-xs'
                : 'text-muted-foreground text-xs'
            }
          >
            {new Date(task.dueAt).toLocaleDateString()}
          </span>
        );
      },
    },
  ];

  return columns.filter((column) => column.id === 'title' || isVisible(column.id));
}
