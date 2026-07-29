import React from 'react';
import type { SystemUser } from '@mms/shared';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { useUsersCollection } from '@/tenant/hooks/collections/users';
import { FORM_LABEL } from '@/components/ui/formStyles';
import { FormSelect } from '@/components/ui/FormSelect';

export interface UserActorSelectProps {
  value: string;
  onChange: (userId: string) => void;
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
  const users = useUsersCollection() as SystemUser[];

  const selectOptions = users
    .slice()
    .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
    .map((user) => ({ value: user.id, label: user.name }));

  const selectedValue = value || authUser?.id || '';
  const placeholder = allowEmpty ? t('registryPerson.selectUser') : undefined;

  return (
    <div>
      <label htmlFor={selectId} className={FORM_LABEL}>
        {label}{required ? ' *' : ''}
      </label>
      <FormSelect
        id={selectId}
        value={selectedValue}
        onChange={onChange}
        options={selectOptions}
        placeholder={placeholder}
      />
    </div>
  );
}
