import React from 'react';
import { X, UserCheck } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import type { EligibleAssigneeItem } from '@/tenant/features/tasks/hooks/useTasksApi';

export interface SelectedAssignee {
  facultyId: string;
  name: string;
  positionId?: string;
  positionName?: string;
}

export interface TaskFormAssigneePickerProps {
  eligibleList: EligibleAssigneeItem[];
  selectedAssignees: SelectedAssignee[];
  onAddAssignee: (facultyId: string) => void;
  onRemoveAssignee: (facultyId: string) => void;
}

export function TaskFormAssigneePicker({
  eligibleList,
  selectedAssignees,
  onAddAssignee,
  onRemoveAssignee,
}: TaskFormAssigneePickerProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1">
        {t('tasks.assignees')}
      </label>
      <select
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        value=""
        onChange={(e) => onAddAssignee(e.target.value)}
      >
        <option value="">{t('tasks.noAssignees')}</option>
        {eligibleList
          .filter((item) => !selectedAssignees.some((a) => a.facultyId === item.facultyId))
          .map((f) => (
            <option key={f.facultyId} value={f.facultyId}>
              {f.name} {f.positionName ? `(${f.positionName})` : ''} {f.isSelf ? '• Self' : ''}
            </option>
          ))}
      </select>

      {selectedAssignees.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selectedAssignees.map((assignee) => (
            <span
              key={assignee.facultyId}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
            >
              <UserCheck className="h-3 w-3" />
              <span>{assignee.name}</span>
              <button
                type="button"
                onClick={() => onRemoveAssignee(assignee.facultyId)}
                className="hover:text-destructive transition-colors ms-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
