import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  HASANAT_MODULE_CONTRACT,
  applyModuleColumnOverlay,
  buildHasanatDistributionWorkColumnRegistry,
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
  useHasanatDistributionColumnPrefs,
  useHasanatDistributionColumnPrefsMutation,
} from '@/hooks/useHasanatApi';

const STORAGE_SUFFIX = 'distributions';

export function useHasanatDistributionColumnLayout() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const userId = user?.id ? String(user.id) : '';
  const { data: serverColumnPrefs, isSuccess: columnPrefsLoaded } = useHasanatDistributionColumnPrefs();
  const { mutate: saveColumnPrefs } = useHasanatDistributionColumnPrefsMutation();
  const migratedLocalColumnPrefs = useRef(false);
  const [userOverlay, setUserOverlay] = useState<ModuleColumnPref[] | null>(null);

  const storageModuleId = `${HASANAT_MODULE_CONTRACT.moduleId}_${STORAGE_SUFFIX}`;

  const tenantRegistry = useMemo(
    () =>
      buildHasanatDistributionWorkColumnRegistry({
        card: t('hasanat.columns.distribution.card'),
        recipient: t('hasanat.columns.distribution.recipient'),
        recipientClass: t('hasanat.columns.distribution.recipientClass'),
        quantity: t('hasanat.columns.distribution.quantity'),
        reason: t('hasanat.columns.distribution.reason'),
        issuedDate: t('hasanat.columns.distribution.issuedDate'),
        issuedBy: t('hasanat.columns.distribution.issuedBy'),
        status: t('hasanat.columns.distribution.status'),
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
      trigger: t('hasanat.columns.trigger'),
      title: t('hasanat.columns.title'),
      visibleAndOrder: t('hasanat.columns.visibleAndOrder'),
      hidden: t('hasanat.columns.hidden'),
      fixed: t('hasanat.columns.fixed'),
      hideColumn: (label: string) => t('hasanat.columns.hideColumn', { label }),
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
