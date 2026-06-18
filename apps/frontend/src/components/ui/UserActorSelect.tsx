import React, { useMemo } from 'react';
import type { SystemUser } from '@mms/shared';
import { useAuth } from '@/lib/contexts/AuthContext';
import useTranslation from '@/hooks/useTranslation';
import { useLiveCollection } from '@/hooks/useLiveCollection';
import { FORM_INPUT, FORM_LABEL } from '@/components/ui/formStyles';

export interface UserActorSelectProps {
  value: string;
  onChange: (userId: string) => void;
  label: string;
  required?: boolean;
  id?: string;
  allowEmpty?: boolean;
}

export default function UserActorSelect({
  value,
  onChange,
  label,
  required = false,
  id,
  allowEmpty = false,
}: UserActorSelectProps): React.JSX.Element {
  const { t } = useTranslation();
  const { user: authUser } = useAuth();
  const users = useLiveCollection<SystemUser>('users');

  const options = useMemo(
    () => users.slice().sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')),
    [users],
  );

  return (
    <div>
      <label htmlFor={id} className={FORM_LABEL}>
        {label}{required ? ' *' : ''}
      </label>
      <select
        id={id}
        className={`${FORM_INPUT} cursor-pointer`}
        value={value || authUser?.id || ''}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      >
        {allowEmpty ? <option value="">{t('registryPerson.selectUser')}</option> : null}
        {options.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name}
          </option>
        ))}
      </select>
    </div>
  );
}
