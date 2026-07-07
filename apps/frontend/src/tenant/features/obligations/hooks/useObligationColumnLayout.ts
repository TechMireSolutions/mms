import { useMemo } from 'react';
import {
  OBLIGATIONS_MODULE_CONTRACT,
  buildObligationCollectionWorkColumnRegistry,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useModuleColumnLayout } from '@/hooks/useModuleColumnLayout';
import {
  useObligationColumnPreferences,
  useObligationColumnPreferencesMutation,
} from '@/tenant/features/obligations/hooks/useObligationsApi';

export function useObligationColumnLayout() {
  const { t } = useTranslation();
  const { data: serverColumnPrefs, isSuccess: columnPrefsLoaded } = useObligationColumnPreferences();
  const { mutate: saveColumnPrefs } = useObligationColumnPreferencesMutation();

  const tenantRegistry = useMemo(
    () =>
      buildObligationCollectionWorkColumnRegistry({
        receiptNo: t('obligations.columns.receiptNo'),
        receivedDate: t('obligations.columns.receivedDate'),
        sender: t('obligations.columns.sender'),
        obligationType: t('obligations.columns.obligationType'),
        repMujtahid: t('obligations.columns.repMujtahid'),
        amount: t('obligations.columns.amount'),
        paymentMode: t('obligations.columns.paymentMode'),
      }),
    [t],
  );

  return useModuleColumnLayout({
    moduleId: OBLIGATIONS_MODULE_CONTRACT.moduleId,
    tenantRegistry,
    serverColumnPrefs,
    columnPrefsLoaded,
    saveColumnPrefs,
    translationPrefix: 'obligations.columns',
  });
}
