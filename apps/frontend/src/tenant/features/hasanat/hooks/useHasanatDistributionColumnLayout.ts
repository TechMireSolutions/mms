import { useMemo } from 'react';
import {
  HASANAT_MODULE_CONTRACT,
  buildHasanatDistributionWorkColumnRegistry,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useModuleColumnLayout } from '@/hooks/useModuleColumnLayout';
import {
  useHasanatDistributionColumnPreferences,
  useHasanatDistributionColumnPreferencesMutation,
} from '@/tenant/features/hasanat/hooks/useHasanatApi';

const STORAGE_SUFFIX = 'distributions';

export function useHasanatDistributionColumnLayout() {
  const { t } = useTranslation();
  const { data: serverColumnPrefs, isSuccess: columnPrefsLoaded } = useHasanatDistributionColumnPreferences();
  const { mutate: saveColumnPrefs } = useHasanatDistributionColumnPreferencesMutation();

  const storageModuleId = `${HASANAT_MODULE_CONTRACT.moduleId}_${STORAGE_SUFFIX}`;

  const tenantRegistry = useMemo(
    () =>
      buildHasanatDistributionWorkColumnRegistry({
        card: t('hasanat.columns.distribution.card'),
        recipient: t('hasanat.columns.distribution.recipient'),
        recipientClass: t('hasanat.columns.distribution.recipientClass'),
        quantity: t('hasanat.columns.distribution.quantity'),
        reason: t('hasanat.columns.distribution.reason'),
        issuedDate: t('hasanat.columns.distribution.issuedDate'),
        issuedBy: t('hasanat.columns.distribution.issuedBy'),
        status: t('hasanat.columns.distribution.status'),
      }),
    [t],
  );

  return useModuleColumnLayout({
    moduleId: storageModuleId,
    tenantRegistry,
    serverColumnPrefs,
    columnPrefsLoaded,
    saveColumnPrefs,
    translationPrefix: 'hasanat.columns',
  });
}
