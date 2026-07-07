import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  applyModuleColumnOverlay,
  isModuleColumnVisible,
  type ModuleColumnPref,
  type ModuleColumnRegistryEntry,
} from '@mms/shared';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import {
  loadModuleColumnPreferences,
  saveModuleColumnPreferenceList,
  saveModuleColumnRegistry,
} from '@/lib/columnPreferences/moduleColumnPreferencesStorage';

export interface UseModuleColumnLayoutOptions {
  moduleId: string;
  tenantRegistry: ModuleColumnRegistryEntry[];
  serverColumnPrefs?: ModuleColumnPref[] | null;
  columnPrefsLoaded?: boolean;
  saveColumnPrefs?: (prefs: ModuleColumnPref[]) => void;
  translationPrefix: string;
}

export function useModuleColumnLayout({
  moduleId,
  tenantRegistry,
  serverColumnPrefs,
  columnPrefsLoaded = false,
  saveColumnPrefs,
  translationPrefix,
}: UseModuleColumnLayoutOptions) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const userId = user?.id ? String(user.id) : '';
  const migratedLocalColumnPrefs = useRef(false);
  const [userOverlay, setUserOverlay] = useState<ModuleColumnPref[] | null>(null);

  useEffect(() => {
    if (!userId) {
      setUserOverlay(null);
      migratedLocalColumnPrefs.current = false;
      return;
    }
    if (!columnPrefsLoaded) {
      setUserOverlay(loadModuleColumnPreferences(moduleId, userId));
      return;
    }
    if (serverColumnPrefs && serverColumnPrefs.length > 0) {
      setUserOverlay(serverColumnPrefs);
      saveModuleColumnPreferenceList(moduleId, userId, serverColumnPrefs);
      return;
    }
    const local = loadModuleColumnPreferences(moduleId, userId);
    setUserOverlay(local);
    if (local?.length && !migratedLocalColumnPrefs.current) {
      migratedLocalColumnPrefs.current = true;
      saveColumnPrefs?.(local);
    }
  }, [userId, columnPrefsLoaded, serverColumnPrefs, saveColumnPrefs, moduleId]);

  const columnRegistry = useMemo(
    () => applyModuleColumnOverlay(tenantRegistry, userOverlay),
    [tenantRegistry, userOverlay],
  );

  const isColumnVisible = useCallback(
    (key: string) => isModuleColumnVisible(columnRegistry, key),
    [columnRegistry],
  );

  const updateUserColumnLayout = useCallback(
    (newRegistry: ModuleColumnRegistryEntry[]) => {
      if (!userId) return;
      saveModuleColumnRegistry(moduleId, userId, newRegistry);
      const preferences: ModuleColumnPref[] = newRegistry.map(({ key, enabled, order }) => ({
        key,
        enabled,
        order,
      }));
      setUserOverlay(preferences);
      saveColumnPrefs?.(preferences);
    },
    [userId, saveColumnPrefs, moduleId],
  );

  const customizerLabels = useMemo(
    () => ({
      trigger: t(`${translationPrefix}.trigger` as any),
      title: t(`${translationPrefix}.title` as any),
      visibleAndOrder: t(`${translationPrefix}.visibleAndOrder` as any),
      hidden: t(`${translationPrefix}.hidden` as any),
      fixed: t(`${translationPrefix}.fixed` as any),
      hideColumn: (label: string) => t(`${translationPrefix}.hideColumn` as any, { label }),
    }),
    [t, translationPrefix],
  );

  return {
    columnRegistry,
    isColumnVisible,
    updateUserColumnLayout,
    customizerLabels,
  };
}
