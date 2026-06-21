import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FINANCE_MODULE_CONTRACT,
  applyModuleColumnOverlay,
  buildFinanceInvoiceWorkColumnRegistry,
  isModuleColumnVisible,
  type ModuleColumnPref,
  type ModuleColumnRegistryEntry,
} from '@mms/shared';
import { useAuth } from '@/lib/contexts/AuthContext';
import useTranslation from '@/hooks/useTranslation';
import {
  loadModuleColumnPrefs,
  saveModuleColumnPrefList,
  saveModuleColumnRegistry,
} from '@/lib/columnPrefs/moduleColumnPrefsStorage';
import {
  useFinanceInvoiceColumnPrefs,
  useFinanceInvoiceColumnPrefsMutation,
} from '@/hooks/useFinanceColumnPrefs';

const STORAGE_SUFFIX = 'invoices';

export function useFinanceInvoiceColumnLayout() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const userId = user?.id ? String(user.id) : '';
  const { data: serverColumnPrefs, isSuccess: columnPrefsLoaded } = useFinanceInvoiceColumnPrefs();
  const { mutate: saveColumnPrefs } = useFinanceInvoiceColumnPrefsMutation();
  const migratedLocalColumnPrefs = useRef(false);
  const [userOverlay, setUserOverlay] = useState<ModuleColumnPref[] | null>(null);

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

  useEffect(() => {
    if (!userId) {
      setUserOverlay(null);
      migratedLocalColumnPrefs.current = false;
      return;
    }
    if (!columnPrefsLoaded) {
      setUserOverlay(loadModuleColumnPrefs(storageModuleId, userId));
      return;
    }
    if (serverColumnPrefs && serverColumnPrefs.length > 0) {
      setUserOverlay(serverColumnPrefs);
      saveModuleColumnPrefList(storageModuleId, userId, serverColumnPrefs);
      return;
    }
    const local = loadModuleColumnPrefs(storageModuleId, userId);
    setUserOverlay(local);
    if (local?.length && !migratedLocalColumnPrefs.current) {
      migratedLocalColumnPrefs.current = true;
      saveColumnPrefs(local);
    }
  }, [userId, columnPrefsLoaded, serverColumnPrefs, saveColumnPrefs, storageModuleId]);

  const columnRegistry = useMemo(
    () => applyModuleColumnOverlay(tenantRegistry, userOverlay),
    [tenantRegistry, userOverlay],
  );

  const isColumnVisible = useCallback(
    (key: string) => isModuleColumnVisible(columnRegistry, key),
    [columnRegistry],
  );

  const updateUserColumnLayout = useCallback(
    (cols: ModuleColumnRegistryEntry[]) => {
      if (!userId) return;
      saveModuleColumnRegistry(storageModuleId, userId, cols);
      const prefs: ModuleColumnPref[] = cols.map(({ key, enabled, order }) => ({
        key,
        enabled,
        order,
      }));
      setUserOverlay(prefs);
      saveColumnPrefs(prefs);
    },
    [userId, saveColumnPrefs, storageModuleId],
  );

  const customizerLabels = useMemo(
    () => ({
      trigger: t('finance.columns.trigger'),
      title: t('finance.columns.title'),
      visibleAndOrder: t('finance.columns.visibleAndOrder'),
      hidden: t('finance.columns.hidden'),
      fixed: t('finance.columns.fixed'),
      hideColumn: (label: string) => t('finance.columns.hideColumn', { label }),
    }),
    [t],
  );

  return {
    columnRegistry,
    isColumnVisible,
    updateUserColumnLayout,
    customizerLabels,
  };
}
