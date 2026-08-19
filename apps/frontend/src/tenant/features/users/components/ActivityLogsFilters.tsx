import React, { useMemo } from 'react';
import { Search } from 'lucide-react';
import { ACTIVITY_ACTION_VALUES, type SystemUser } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { DateRangeFilterBar } from '@/components/ui/DateRangeFilterBar';
import { Input } from '@/components/ui/input';
import { FormSelect } from '@/components/ui/FormSelect';

export interface ActivityLogsFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  userFilter: string;
  onUserFilterChange: (value: string) => void;
  actionFilter: string;
  onActionFilterChange: (value: string) => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  users: SystemUser[];
}

export function ActivityLogsFilters({
  search,
  onSearchChange,
  userFilter,
  onUserFilterChange,
  actionFilter,
  onActionFilterChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  users,
}: ActivityLogsFiltersProps): React.JSX.Element {
  const { t } = useTranslation();

  const userOptions = useMemo(() => [
    { value: 'all', label: t('users.activityAllUsers') },
    ...users.map((user) => ({ value: user.id, label: user.name })),
  ], [users, t]);

  const actionOptions = useMemo(() => [
    { value: 'all', label: t('users.activityAllActions') },
    ...ACTIVITY_ACTION_VALUES.map((activityAction) => ({
      value: activityAction,
      label: t(`users.action.${activityAction === 'login_failed' ? 'loginFailed' : activityAction === 'role_change' ? 'roleChange' : activityAction}`),
    })),
  ], [t]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-cell-md flex-1">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t('users.activitySearch')}
          className="ps-9.5"
        />
      </div>
      <FormSelect
        value={userFilter}
        onChange={onUserFilterChange}
        options={userOptions}
        aria-label={t('users.activityFilterUser')}
        className="w-auto min-w-input-filter"
      />
      <FormSelect
        value={actionFilter}
        onChange={onActionFilterChange}
        options={actionOptions}
        aria-label={t('users.activityFilterAction')}
        className="w-auto min-w-cell-sm"
      />
      <DateRangeFilterBar
        idPrefix="activity-logs"
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={onDateFromChange}
        onDateToChange={onDateToChange}
        pickerClassName="w-full min-w-0 text-sm sm:w-36"
      />
    </div>
  );
}
