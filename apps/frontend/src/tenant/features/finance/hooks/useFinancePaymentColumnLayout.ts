import { useMemo } from 'react';
import {
  FINANCE_MODULE_CONTRACT,
  buildFinancePaymentWorkColumnRegistry,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useModuleColumnLayout } from '@/hooks/useModuleColumnLayout';

const STORAGE_SUFFIX = 'payments';

export function useFinancePaymentColumnLayout() {
  const { t } = useTranslation();

  const storageModuleId = `${FINANCE_MODULE_CONTRACT.moduleId}_${STORAGE_SUFFIX}`;

  const tenantRegistry = useMemo(
    () =>
      buildFinancePaymentWorkColumnRegistry({
        date: t('finance.columns.paymentDate'),
        student: t('finance.columns.student'),
        invoice: t('finance.columns.invoice'),
        amount: t('finance.columns.amount'),
        method: t('finance.columns.method'),
        receivedBy: t('finance.columns.receivedBy'),
        note: t('finance.columns.note'),
      }),
    [t],
  );

  return useModuleColumnLayout({
    moduleId: storageModuleId,
    tenantRegistry,
    apiPath: `${FINANCE_MODULE_CONTRACT.restBasePath}/payments`,
    translationPrefix: 'finance.columns',
  });
}
