import { useMemo } from 'react';
import {
  ACCOUNTING_MODULE_CONTRACT,
  buildAccountingAccountWorkColumnRegistry,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useModuleColumnLayout } from '@/hooks/useModuleColumnLayout';
import {
  useAccountingAccountColumnPrefs,
  useAccountingAccountColumnPrefsMutation,
} from '@/tenant/features/accounting/hooks/useAccountingApi';

const STORAGE_SUFFIX = 'accounts';

export function useAccountingAccountColumnLayout() {
  const { t } = useTranslation();
  const { data: serverColumnPrefs, isSuccess: columnPrefsLoaded } = useAccountingAccountColumnPrefs();
  const { mutate: saveColumnPrefs } = useAccountingAccountColumnPrefsMutation();

  const storageModuleId = `${ACCOUNTING_MODULE_CONTRACT.moduleId}_${STORAGE_SUFFIX}`;

  const tenantRegistry = useMemo(
    () =>
      buildAccountingAccountWorkColumnRegistry({
        code: t('accounting.columns.account.code'),
        name: t('accounting.columns.account.name'),
        subtype: t('accounting.columns.account.subtype'),
        description: t('accounting.columns.account.description'),
        normalBalance: t('accounting.columns.account.normalBalance'),
      }),
    [t],
  );

  return useModuleColumnLayout({
    moduleId: storageModuleId,
    tenantRegistry,
    serverColumnPrefs,
    columnPrefsLoaded,
    saveColumnPrefs,
    translationPrefix: 'accounting.columns',
  });
}
