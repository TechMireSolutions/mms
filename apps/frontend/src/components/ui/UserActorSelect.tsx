import React from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { useUsersPaginated } from '@/tenant/hooks/collections/users';
import { FORM_LABEL } from '@/components/ui/formStyles';
import { FormSelect } from '@/components/ui/FormSelect';
import { SearchBar } from '@/components/ui/SearchBar';
import type { WorkspaceUser } from '@mms/shared';

export interface UserActorSelectProps {
  value: string;
  onChange: (userId: string, userName?: string) => void;
  label: string;
  required?: boolean;
  id?: string;
  allowEmpty?: boolean;
}

export function UserActorSelect({
  value,
  onChange,
  label,
  required = false,
  id,
  allowEmpty = false,
}: UserActorSelectProps): React.JSX.Element {
  const generatedId = React.useId();
  const selectId = id || generatedId;
  const { t } = useTranslation();
  const { user: authUser } = useAuth();
  const [search, setSearch] = React.useState('');
  const usersQuery = useUsersPaginated({ page: 1, limit: 50, search });
  const users: WorkspaceUser[] = usersQuery.data?.users ?? [];

  const selectedValue = value || authUser?.id || '';
  const selectOptions = users
    .slice()
    .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
    .map((user) => ({ value: user.id, label: user.name }));
  if (selectedValue && !selectOptions.some((option) => option.value === selectedValue)) {
    selectOptions.unshift({
      value: selectedValue,
      label: selectedValue === authUser?.id ? (authUser.name || selectedValue) : selectedValue,
    });
  }

  const placeholder = allowEmpty ? t('registryPerson.selectUser') : undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={selectId} className={FORM_LABEL}>
        {label}{required ? ' *' : ''}
      </label>
      <SearchBar
        id={`${selectId}-search`}
        name={`${selectId}-search`}
        value={search}
        onChange={setSearch}
        placeholder={t('registryPerson.searchPlaceholder')}
      />
      <FormSelect
        id={selectId}
        value={selectedValue}
        onChange={(userId) => {
          const selectedUser = users.find((user) => String(user.id) === userId);
          onChange(userId, selectedUser?.name);
        }}
        options={selectOptions}
        placeholder={placeholder}
      />
      {usersQuery.data?.hasMore && (
        <p className="text-xs text-muted-foreground">{t('registryPerson.refineSearch')}</p>
      )}
    </div>
  );
}
