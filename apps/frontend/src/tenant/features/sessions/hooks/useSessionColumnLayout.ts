import { useMemo } from 'react';
import {
  SESSIONS_MODULE_CONTRACT,
  buildSessionWorkColumnRegistry,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useModuleColumnLayout } from '@/hooks/useModuleColumnLayout';

export function useSessionColumnLayout() {
  const { t } = useTranslation();

  const tenantRegistry = useMemo(
    () =>
      buildSessionWorkColumnRegistry({
        name: t('sessions.columns.name'),
        type: t('sessions.columns.type'),
        duration: t('sessions.columns.duration'),
        fee: t('sessions.columns.fee'),
        enrolled: t('sessions.columns.enrolled'),
        status: t('sessions.columns.status'),
      }),
    [t],
  );

  return useModuleColumnLayout({
    moduleId: SESSIONS_MODULE_CONTRACT.moduleId,
    tenantRegistry,
    apiPath: SESSIONS_MODULE_CONTRACT.restBasePath,
    translationPrefix: 'sessions.columns',
  });
}
