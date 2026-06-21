import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  OBLIGATIONS_MODULE_CONTRACT,
  applyModuleColumnOverlay,
  buildObligationCollectionWorkColumnRegistry,
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
  useObligationColumnPrefs,
  useObligationColumnPrefsMutation,
} from '@/hooks/useObligationsApi';

export function useObligationColumnLayout() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const userId = user?.id ? String(user.id) : '';
  const { data: serverColumnPrefs, isSuccess: columnPrefsLoaded } = useObligationColumnPrefs();
  const { mutate: saveColumnPrefs } = useObligationColumnPrefsMutation();
  const migratedLocalColumnPrefs = useRef(false);
  const [userOverlay, setUserOverlay] = useState<ModuleColumnPref[] | null>(null);

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
      setUserOverlay(loadModuleColumnPrefs(OBLIGATIONS_MODULE_CONTRACT.moduleId, userId));
      return;
    }
    if (serverColumnPrefs && serverColumnPrefs.length > 0) {
      setUserOverlay(serverColumnPrefs);
      saveModuleColumnPrefList(OBLIGATIONS_MODULE_CONTRACT.moduleId, userId, serverColumnPrefs);
      return;
    }
    const local = loadModuleColumnPrefs(OBLIGATIONS_MODULE_CONTRACT.moduleId, userId);
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
    (cols: ModuleColumnRegistryEntry[]) => {
      if (!userId) return;
      saveModuleColumnRegistry(OBLIGATIONS_MODULE_CONTRACT.moduleId, userId, cols);
      const prefs: ModuleColumnPref[] = cols.map(({ key, enabled, order }) => ({
        key,
        enabled,
        order,
      }));
      setUserOverlay(prefs);
      saveColumnPrefs(prefs);
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
