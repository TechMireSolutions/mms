import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FINANCE_MODULE_CONTRACT,
  applyModuleColumnOverlay,
  buildFinancePaymentWorkColumnRegistry,
  isModuleColumnVisible,
  type ModuleColumnPreference,
  type ModuleColumnRegistryEntry,
} from '@mms/shared';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import {
  loadModuleColumnPreferences,
  saveModuleColumnPreferenceList,
  saveModuleColumnRegistry,
} from '@/lib/columnPreferences/moduleColumnPreferencesStorage';
import {
  useFinancePaymentColumnPreferences,
  useFinancePaymentColumnPreferencesMutation,
} from '@/hooks/useFinanceColumnPreferences';

const STORAGE_SUFFIX = 'payments';

export function useFinancePaymentColumnLayout() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const userId = user?.id ? String(user.id) : '';
  const { data: serverColumnPrefs, isSuccess: columnPrefsLoaded } = useFinancePaymentColumnPreferences();
  const { mutate: saveColumnPrefs } = useFinancePaymentColumnPreferencesMutation();
  const migratedLocalColumnPrefs = useRef(false);
  const [userOverlay, setUserOverlay] = useState<ModuleColumnPreference[] | null>(null);

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

  useEffect(() => {
    if (!userId) {
      setUserOverlay(null);
      migratedLocalColumnPrefs.current = false;
      return;
    }
    if (!columnPrefsLoaded) {
      setUserOverlay(loadModuleColumnPreferences(storageModuleId, userId));
      return;
    }
    if (serverColumnPrefs && serverColumnPrefs.length > 0) {
      setUserOverlay(serverColumnPrefs);
      saveModuleColumnPreferenceList(storageModuleId, userId, serverColumnPrefs);
      return;
    }
    const local = loadModuleColumnPreferences(storageModuleId, userId);
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
      const preferences: ModuleColumnPreference[] = cols.map(({ key, enabled, order }) => ({
        key,
        enabled,
        order,
      }));
      setUserOverlay(preferences);
      saveColumnPrefs(preferences);
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
