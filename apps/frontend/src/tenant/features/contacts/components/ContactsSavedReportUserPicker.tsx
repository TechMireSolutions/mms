import React, { useMemo } from 'react';
import type { SystemUser } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useUsersCollection } from '@/tenant/features/users/hooks/useUsersApi';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface ContactsSavedReportUserPickerProps {
  value: string[];
  onChange: (userIds: string[]) => void;
}

/** Multi-select tenant users for saved report sharing (globle1 §4.4). */
export default function ContactsSavedReportUserPicker({
  value,
  onChange,
}: ContactsSavedReportUserPickerProps): React.JSX.Element {
  const { t } = useTranslation();
  const users = useUsersCollection() as unknown as SystemUser[];

  const options = useMemo(
    () => users.slice().sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')),
    [users],
  );

  const toggle = (userId: string) => {
    if (value.includes(userId)) {
      onChange(value.filter((selectedUserId) => selectedUserId !== userId));
    } else {
      onChange([...value, userId]);
    }
  };

  return (
    <div className="space-y-1.5">
      <Label>{t('contacts.savedReports.usersPickerLabel')}</Label>
      <div className="max-h-40 overflow-y-auto rounded-lg border border-border divide-y divide-border">
        {options.length === 0 ? (
          <p className="px-3 py-2 text-xs text-muted-foreground">{t('common.loading')}</p>
        ) : (
          options.map((user) => (
            <label
              key={user.id}
              className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-muted/50"
            >
              <Checkbox
                checked={value.includes(String(user.id))}
                onCheckedChange={() => toggle(String(user.id))}
              />
              <span className="truncate">{user.name || user.email}</span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}
