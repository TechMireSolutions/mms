import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  OBLIGATIONS_MODULE_CONTRACT,
  applyModuleColumnOverlay,
  buildObligationCollectionWorkColumnRegistry,
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
  useObligationColumnPreferences,
  useObligationColumnPreferencesMutation,
} from '@/hooks/useObligationsApi';

export function useObligationColumnLayout() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const userId = user?.id ? String(user.id) : '';
  const { data: serverColumnPrefs, isSuccess: columnPrefsLoaded } = useObligationColumnPreferences();
  const { mutate: saveColumnPrefs } = useObligationColumnPreferencesMutation();
  const migratedLocalColumnPrefs = useRef(false);
  const [userOverlay, setUserOverlay] = useState<ModuleColumnPreference[] | null>(null);

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

  useEffect(() => {
    if (!userId) {
      setUserOverlay(null);
      migratedLocalColumnPrefs.current = false;
      return;
    }
    if (!columnPrefsLoaded) {
      setUserOverlay(loadModuleColumnPreferences(OBLIGATIONS_MODULE_CONTRACT.moduleId, userId));
      return;
    }
    if (serverColumnPrefs && serverColumnPrefs.length > 0) {
      setUserOverlay(serverColumnPrefs);
      saveModuleColumnPreferenceList(OBLIGATIONS_MODULE_CONTRACT.moduleId, userId, serverColumnPrefs);
      return;
    }
    const local = loadModuleColumnPreferences(OBLIGATIONS_MODULE_CONTRACT.moduleId, userId);
    setUserOverlay(local);
    if (local?.length && !migratedLocalColumnPrefs.current) {
      migratedLocalColumnPrefs.current = true;
      saveColumnPrefs(local);
    }
  }, [userId, columnPrefsLoaded, serverColumnPrefs, saveColumnPrefs]);

  const columnRegistry = useMemo(
    () => applyModuleColumnOverlay(tenantRegistry, userOverlay),
    [tenantRegistry, userOverlay],
  );

  const isColumnVisible = useCallback(
    (key: string) => isModuleColumnVisible(columnRegistry, key),
    [columnRegistry],
  );

  const updateUserColumnLayout = useCallback(
    (columnRegistry: ModuleColumnRegistryEntry[]) => {
      if (!userId) return;
      saveModuleColumnRegistry(OBLIGATIONS_MODULE_CONTRACT.moduleId, userId, columnRegistry);
      const preferences: ModuleColumnPreference[] = columnRegistry.map(({ key, enabled, order }) => ({
        key,
        enabled,
        order,
      }));
      setUserOverlay(preferences);
      saveColumnPrefs(preferences);
    },
    [userId, saveColumnPrefs],
  );

  const customizerLabels = useMemo(
    () => ({
      trigger: t('obligations.columns.trigger'),
      title: t('obligations.columns.title'),
      visibleAndOrder: t('obligations.columns.visibleAndOrder'),
      hidden: t('obligations.columns.hidden'),
      fixed: t('obligations.columns.fixed'),
      hideColumn: (label: string) => t('obligations.columns.hideColumn', { label }),
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
