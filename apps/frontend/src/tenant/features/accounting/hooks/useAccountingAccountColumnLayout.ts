import { useMemo } from 'react';
import {
  ACCOUNTING_MODULE_CONTRACT,
  buildAccountingAccountWorkColumnRegistry,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useModuleColumnLayout } from '@/hooks/useModuleColumnLayout';

const STORAGE_SUFFIX = 'accounts';

export function useAccountingAccountColumnLayout() {
  const { t } = useTranslation();

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
    apiPath: `${ACCOUNTING_MODULE_CONTRACT.restBasePath}/accounts`,
    translationPrefix: 'accounting.columns',
  });
}
