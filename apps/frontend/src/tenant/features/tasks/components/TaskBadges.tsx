import React from 'react';
import { type TaskPriority, type TaskStatus, type AppTranslationKey } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  low: 'bg-muted text-muted-foreground border-border',
  medium: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900',
  high: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900',
  urgent: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900',
};

const STATUS_STYLES: Record<TaskStatus, string> = {
  todo: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800',
  in_progress: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900',
  in_review: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900',
  blocked: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900',
  completed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
  cancelled: 'bg-zinc-500/10 text-zinc-500 border-zinc-200 dark:border-zinc-800',
};

export function TaskPriorityBadge({ priority }: { priority: TaskPriority }): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${PRIORITY_STYLES[priority]}`}
    >
      {t(`tasks.priority.${priority}` as AppTranslationKey)}
    </span>
  );
}

export function TaskStatusBadge({
  status,
  onClick,
}: {
  status: TaskStatus;
  onClick?: () => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${
        STATUS_STYLES[status]
      } ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
    >
      {t(`tasks.status.${status}` as AppTranslationKey)}
    </button>
  );
}
