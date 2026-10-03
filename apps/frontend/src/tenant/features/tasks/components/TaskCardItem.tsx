import React from 'react';
import { Pencil, Trash2, Calendar, User } from 'lucide-react';
import type { TaskRecord } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { TaskPriorityBadge, TaskStatusBadge } from './TaskBadges';

export interface TaskCardItemProps {
  task: TaskRecord;
  onEdit?: (task: TaskRecord) => void;
  onDelete?: (id: string) => void;
  onStatusCycle?: (task: TaskRecord) => void;
  canWrite?: boolean;
  canDelete?: boolean;
}

export function TaskCardItem({
  task,
  onEdit,
  onDelete,
  onStatusCycle,
  canWrite = true,
  canDelete = true,
}: TaskCardItemProps): React.JSX.Element {
  const { t } = useTranslation();
  const isOverdue =
    task.dueAt &&
    task.status !== 'completed' &&
    task.status !== 'cancelled' &&
    new Date(task.dueAt) < new Date();

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-xs space-y-3 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-semibold text-foreground text-sm leading-snug line-clamp-2">
          {task.title}
        </h4>
        <TaskPriorityBadge priority={task.priority} />
      </div>

      {task.description ? (
        <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/50 text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <User className="h-3.5 w-3.5" />
          <span>
            {task.assignees?.length
              ? task.assignees.map((a) => a.facultyName || a.positionName || 'Staff').join(', ')
              : t('tasks.noAssignees')}
          </span>
        </div>

        {task.dueAt ? (
          <div
            className={`flex items-center gap-1 font-medium ${
              isOverdue ? 'text-destructive' : 'text-muted-foreground'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>{new Date(task.dueAt).toLocaleDateString()}</span>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between pt-1">
        <TaskStatusBadge
          status={task.status}
          onClick={canWrite && onStatusCycle ? () => onStatusCycle(task) : undefined}
        />

        <div className="flex items-center gap-1">
          {canWrite && onEdit ? (
            <button
              type="button"
              onClick={() => onEdit(task)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Edit task"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          ) : null}
          {canDelete && onDelete ? (
            <button
              type="button"
              onClick={() => onDelete(task.id)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              aria-label="Delete task"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
