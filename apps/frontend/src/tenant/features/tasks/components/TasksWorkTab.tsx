import React, { useState, useMemo } from 'react';
import { Search, Plus, Pencil, Trash2, User as UserIcon } from 'lucide-react';
import {
  type TaskRecord,
  type TaskStatus,
  type AppTranslationKey,
  TASK_STATUSES,
  TASK_PRIORITIES,
} from '@mms/shared';
import { EmptyState } from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/LoadingState';
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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (statusFilter !== 'all' && task.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDesc = task.description?.toLowerCase().includes(query);
        const matchesAssignee = task.assignees?.some(
          (a) =>
            a.facultyName?.toLowerCase().includes(query) ||
            a.positionName?.toLowerCase().includes(query),
        );
        if (!matchesTitle && !matchesDesc && !matchesAssignee) return false;
      }
      return true;
    });
  }, [tasks, statusFilter, priorityFilter, search]);

  const handleCycleStatus = (task: TaskRecord) => {
    const next = NEXT_STATUS[task.status] || 'todo';
    onUpdateStatus(task.id, next);
  };

  if (isLoading) {
    return <TableSkeleton rows={5} cols={6} />;
  }

  return (
    <div className="space-y-4">
      {/* Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="w-full ps-9 pe-3 py-1.5 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Statuses</option>
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`tasks.status.${s}` as AppTranslationKey)}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Priorities</option>
            {TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {t(`tasks.priority.${p}` as AppTranslationKey)}
              </option>
            ))}
          </select>
        </div>

        {canWrite ? (
          <button
            type="button"
            onClick={onAddNew}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>{t('tasks.create')}</span>
          </button>
        ) : null}
      </div>

      {/* Directory Content */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          title={t('tasks.emptyTitle')}
          description={t('tasks.emptyDescription')}
          action={
            canWrite ? (
              <button
                type="button"
                onClick={onAddNew}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
              >
                <Plus className="h-4 w-4" />
                <span>{t('tasks.create')}</span>
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-lg border border-border bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-start">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-medium text-xs">
                  <tr>
                    <th className="py-3 px-4 text-start">Title</th>
                    <th className="py-3 px-3 text-start">Priority</th>
                    <th className="py-3 px-3 text-start">Status</th>
                    <th className="py-3 px-3 text-start">Assignees</th>
                    <th className="py-3 px-3 text-start">Due Date</th>
                    <th className="py-3 px-4 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredTasks.map((task) => {
                    const isOverdue =
                      task.dueAt &&
                      task.status !== 'completed' &&
                      task.status !== 'cancelled' &&
                      new Date(task.dueAt) < new Date();

                    return (
                      <tr key={task.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-medium text-foreground">
                          <div>{task.title}</div>
                          {task.description ? (
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {task.description}
                            </div>
                          ) : null}
                        </td>
                        <td className="py-3 px-3">
                          <TaskPriorityBadge priority={task.priority} />
                        </td>
                        <td className="py-3 px-3">
                          <TaskStatusBadge
                            status={task.status}
                            onClick={canWrite ? () => handleCycleStatus(task) : undefined}
                          />
                        </td>
                        <td className="py-3 px-3 text-muted-foreground text-xs">
                          {task.assignees?.length ? (
                            <div className="flex items-center gap-1">
                              <UserIcon className="h-3.5 w-3.5" />
                              <span>
                                {task.assignees
                                  .map((a) => a.facultyName || a.positionName || 'Staff')
                                  .join(', ')}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/60">{t('tasks.noAssignees')}</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-xs">
                          {task.dueAt ? (
                            <span
                              className={isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}
                            >
                              {new Date(task.dueAt).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/60">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-end">
                          <div className="inline-flex items-center gap-1">
                            {canWrite ? (
                              <button
                                type="button"
                                onClick={() => onEdit(task)}
                                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                aria-label="Edit task"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            ) : null}
                            {canDelete ? (
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
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards View */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
            {filteredTasks.map((task) => (
              <TaskCardItem
                key={task.id}
                task={task}
                onEdit={onEdit}
                onDelete={onDelete}
                onStatusCycle={handleCycleStatus}
                canWrite={canWrite}
                canDelete={canDelete}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
