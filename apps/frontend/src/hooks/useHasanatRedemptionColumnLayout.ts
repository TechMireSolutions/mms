import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  HASANAT_MODULE_CONTRACT,
  applyModuleColumnOverlay,
  buildHasanatRedemptionWorkColumnRegistry,
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
  useHasanatRedemptionColumnPreferences,
  useHasanatRedemptionColumnPreferencesMutation,
} from '@/hooks/useHasanatApi';

const STORAGE_SUFFIX = 'redemptions';

export function useHasanatRedemptionColumnLayout() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const userId = user?.id ? String(user.id) : '';
  const { data: serverColumnPrefs, isSuccess: columnPrefsLoaded } = useHasanatRedemptionColumnPreferences();
  const { mutate: saveColumnPrefs } = useHasanatRedemptionColumnPreferencesMutation();
  const migratedLocalColumnPrefs = useRef(false);
  const [userOverlay, setUserOverlay] = useState<ModuleColumnPreference[] | null>(null);

  const storageModuleId = `${HASANAT_MODULE_CONTRACT.moduleId}_${STORAGE_SUFFIX}`;

  const tenantRegistry = useMemo(
    () =>
      buildHasanatRedemptionWorkColumnRegistry({
        student: t('hasanat.columns.redemption.student'),
        reward: t('hasanat.columns.redemption.reward'),
        pointsUsed: t('hasanat.columns.redemption.pointsUsed'),
        date: t('hasanat.columns.redemption.date'),
        approvedBy: t('hasanat.columns.redemption.approvedBy'),
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
    (columns: ModuleColumnRegistryEntry[]) => {
      if (!userId) return;
      saveModuleColumnRegistry(storageModuleId, userId, columns);
      const preferences: ModuleColumnPreference[] = columns.map(({ key, enabled, order }) => ({
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
