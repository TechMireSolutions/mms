import { useMemo } from 'react';
import {
  HASANAT_MODULE_CONTRACT,
  buildHasanatRedemptionWorkColumnRegistry,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useModuleColumnLayout } from '@/hooks/useModuleColumnLayout';
import {
  useHasanatRedemptionColumnPreferences,
  useHasanatRedemptionColumnPreferencesMutation,
} from '@/tenant/features/hasanat/hooks/useHasanatApi';

const STORAGE_SUFFIX = 'redemptions';

export function useHasanatRedemptionColumnLayout() {
  const { t } = useTranslation();
  const { data: serverColumnPrefs, isSuccess: columnPrefsLoaded } = useHasanatRedemptionColumnPreferences();
  const { mutate: saveColumnPrefs } = useHasanatRedemptionColumnPreferencesMutation();

  const storageModuleId = `${HASANAT_MODULE_CONTRACT.moduleId}_${STORAGE_SUFFIX}`;

  const tenantRegistry = useMemo(
    () =>
      buildHasanatRedemptionWorkColumnRegistry({
        student: t('hasanat.columns.redemption.student'),
        reward: t('hasanat.columns.redemption.reward'),
        pointsUsed: t('hasanat.columns.redemption.pointsUsed'),
        date: t('hasanat.columns.redemption.date'),
        approvedBy: t('hasanat.columns.redemption.approvedBy'),
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
