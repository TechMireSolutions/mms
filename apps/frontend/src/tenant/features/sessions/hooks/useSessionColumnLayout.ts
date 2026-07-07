import { useMemo } from 'react';
import {
  SESSIONS_MODULE_CONTRACT,
  buildSessionWorkColumnRegistry,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useModuleColumnLayout } from '@/hooks/useModuleColumnLayout';
import {
  useSessionColumnPrefs,
  useSessionColumnPrefsMutation,
} from '@/tenant/features/sessions/hooks/useSessions';

export function useSessionColumnLayout() {
  const { t } = useTranslation();
  const { data: serverColumnPrefs, isSuccess: columnPrefsLoaded } = useSessionColumnPrefs();
  const { mutate: saveColumnPrefs } = useSessionColumnPrefsMutation();

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
    serverColumnPrefs,
    columnPrefsLoaded,
    saveColumnPrefs,
    translationPrefix: 'sessions.columns',
  });
}
