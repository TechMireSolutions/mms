import { useMemo } from 'react';
import {
  USERS_MODULE_CONTRACT,
  buildUsersWorkColumnRegistry,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useModuleColumnLayout } from '@/hooks/useModuleColumnLayout';

export function useUserColumnLayout() {
  const { t } = useTranslation();

  const tenantRegistry = useMemo(
    () =>
      buildUsersWorkColumnRegistry({
        user: t('users.colUser'),
        role: t('users.colRole'),
        status: t('users.colStatus'),
        lastLogin: t('users.colLastLogin'),
        created: t('users.colCreated'),
        twoFactor: t('users.col2fa'),
      }),
    [t],
  );

  return useModuleColumnLayout({
    moduleId: USERS_MODULE_CONTRACT.moduleId,
    tenantRegistry,
    apiPath: USERS_MODULE_CONTRACT.restBasePath,
    translationPrefix: 'users.columns',
  });
}
