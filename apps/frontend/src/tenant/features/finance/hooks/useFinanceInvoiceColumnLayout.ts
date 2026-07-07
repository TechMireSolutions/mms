import { useMemo } from 'react';
import {
  FINANCE_MODULE_CONTRACT,
  buildFinanceInvoiceWorkColumnRegistry,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useModuleColumnLayout } from '@/hooks/useModuleColumnLayout';

const STORAGE_SUFFIX = 'invoices';

export function useFinanceInvoiceColumnLayout() {
  const { t } = useTranslation();

  const storageModuleId = `${FINANCE_MODULE_CONTRACT.moduleId}_${STORAGE_SUFFIX}`;

  const tenantRegistry = useMemo(
    () =>
      buildFinanceInvoiceWorkColumnRegistry({
        invoice: t('finance.columns.invoice'),
        student: t('finance.columns.student'),
        sessionClass: t('finance.columns.sessionClass'),
        baseFee: t('finance.columns.baseFee'),
        discount: t('finance.columns.discount'),
        final: t('finance.columns.final'),
        status: t('finance.columns.status'),
        dueDate: t('finance.columns.dueDate'),
      }),
    [t],
  );

  return useModuleColumnLayout({
    moduleId: storageModuleId,
    tenantRegistry,
    apiPath: `${FINANCE_MODULE_CONTRACT.restBasePath}/invoices`,
    translationPrefix: 'finance.columns',
  });
}
