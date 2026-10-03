/**
 * @file TaskCardItem.tsx
 * @description Work directory card for a single task (DirectoryEntityCard chrome).
 */

import React from 'react';
import { Pencil, Trash2, RotateCcw } from 'lucide-react';
import type { TaskRecord, TaskStatus } from '@mms/shared';
import { DataTableRowActions } from '@/components/common/data-table';
import { DirectoryCardFooterActions } from '@/components/ui/DirectoryCardFooterActions';
import { DirectoryCardHeader } from '@/components/ui/DirectoryCardHeader';
import { DirectoryCardMetaGrid } from '@/components/ui/DirectoryCardMetaGrid';
import { DirectoryCardMetaTile } from '@/components/ui/DirectoryCardMetaTile';
import { DirectoryEntityCard } from '@/components/ui/DirectoryEntityCard';
import { useWorkCardAction } from '@/hooks/useWorkCardAction';
import { useTranslation } from '@/hooks/useTranslation';
import { TaskPriorityBadge, TaskStatusBadge } from './TaskBadges';
import { TASK_NEXT_STATUS } from './tasksWorkBatchColumns';

export interface TaskCardItemProps {
  task: TaskRecord;
  selectedIds: string[];
  viewingDeleted: boolean;
  canWrite: boolean;
  canDelete: boolean;
  isColumnVisible: (key: string) => boolean;
  onToggleSelected: (id: string, checked: boolean) => void;
  onView: (task: TaskRecord) => void;
  onEdit: (task: TaskRecord) => void;
  onDelete: (id: string) => void;
  onRestore?: (id: string) => void;
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  reducedMotion?: boolean;
}

export function TaskCardItem({
  task,
  selectedIds,
  viewingDeleted,
  canWrite,
  canDelete,
  isColumnVisible,
  onToggleSelected,
  onView,
  onEdit,
  onDelete,
  onRestore,
  onUpdateStatus,
  reducedMotion = false,
}: TaskCardItemProps): React.JSX.Element {
  const { t } = useTranslation();
  const { isSelected, onSelect, onView: handleView, cardProps } = useWorkCardAction({
    entity: task,
    selectedIds,
    onToggleSelected,
    onView,
    canSelect: canDelete,
  });

  const assigneeLabel = task.assignees?.length
    ? task.assignees
        .map((a) => a.facultyName || a.positionName || t('tasks.assigneeFallback'))
        .join(', ')
    : t('tasks.noAssignees');

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
      actions.push({
        id: 'edit',
        label: t('tasks.edit'),
        icon: Pencil,
        onClick: () => onEdit(task),
      });
    }
    if (canDelete) {
      actions.push({
        id: 'delete',
        label: t('tasks.delete'),
        icon: Trash2,
        tone: 'destructive' as const,
        onClick: () => onDelete(task.id),
      });
    }
  }

  return (
    <DirectoryEntityCard isSelected={isSelected} reducedMotion={reducedMotion} {...cardProps}>
      <DirectoryCardHeader
        id={task.id}
        displayName={task.title}
        isSelected={isSelected}
        showSelect={canDelete}
        onSelect={onSelect}
        selectAriaLabel={t('tasks.selectTask', { name: task.title })}
        onView={handleView}
        viewAriaLabel={t('tasks.viewTask', { name: task.title })}
        reducedMotion={reducedMotion}
        subtitle={
          isColumnVisible('priority') ? <TaskPriorityBadge priority={task.priority} /> : undefined
        }
      />

      <DirectoryCardMetaGrid>
        {isColumnVisible('status') ? (
          <DirectoryCardMetaTile label={t('tasks.status')}>
            <TaskStatusBadge
              status={task.status}
              onClick={
                canWrite && !viewingDeleted
                  ? () => onUpdateStatus(task.id, TASK_NEXT_STATUS[task.status] || 'todo')
                  : undefined
              }
            />
          </DirectoryCardMetaTile>
        ) : null}
        {isColumnVisible('assignees') ? (
          <DirectoryCardMetaTile label={t('tasks.assignees')}>{assigneeLabel}</DirectoryCardMetaTile>
        ) : null}
        {isColumnVisible('dueAt') ? (
          <DirectoryCardMetaTile label={t('tasks.dueAt')}>
            {task.dueAt ? new Date(task.dueAt).toLocaleDateString() : t('tasks.noDueDate')}
          </DirectoryCardMetaTile>
        ) : null}
      </DirectoryCardMetaGrid>

      <DirectoryCardFooterActions
        onView={handleView}
        viewLabel={t('tasks.actionViewShort')}
        viewAriaLabel={t('tasks.viewTask', { name: task.title })}
        overflowActions={actions.length > 0 ? <DataTableRowActions actions={actions} /> : null}
      />
    </DirectoryEntityCard>
  );
}
