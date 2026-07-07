import { useMemo } from 'react';
import {
  OBLIGATIONS_MODULE_CONTRACT,
  buildObligationCollectionWorkColumnRegistry,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useModuleColumnLayout } from '@/hooks/useModuleColumnLayout';

export function useObligationColumnLayout() {
  const { t } = useTranslation();

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
    apiPath: OBLIGATIONS_MODULE_CONTRACT.restBasePath,
    translationPrefix: 'obligations.columns',
  });
}
