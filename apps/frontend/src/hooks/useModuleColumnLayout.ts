import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  applyModuleColumnOverlay,
  isModuleColumnVisible,
  type ModuleColumnPref,
  type ModuleColumnRegistryEntry,
} from '@mms/shared';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { apiJson } from '@/lib/apiClient';
import {
  readModuleColumnPreferences,
  writeModuleColumnPreferences,
  type ModuleColumnPreferencesResponse,
} from '@/lib/moduleColumnPreferencesApi';
import {
  loadModuleColumnPreferences,
  saveModuleColumnPreferenceList,
  saveModuleColumnRegistry,
} from '@/lib/columnPreferences/moduleColumnPreferencesStorage';

export interface UseModuleColumnLayoutOptions {
  moduleId: string;
  tenantRegistry: ModuleColumnRegistryEntry[];
  apiPath?: string;
  serverColumnPrefs?: ModuleColumnPref[] | null;
  columnPrefsLoaded?: boolean;
  saveColumnPrefs?: (prefs: ModuleColumnPref[]) => void;
  translationPrefix: string;
}

export function useModuleColumnLayout({
  moduleId,
  tenantRegistry,
  apiPath,
  serverColumnPrefs,
  columnPrefsLoaded = false,
  saveColumnPrefs,
  translationPrefix,
}: UseModuleColumnLayoutOptions) {
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const userId = user?.id ? String(user.id) : '';
  const migratedLocalColumnPrefs = useRef(false);
  const [userOverlay, setUserOverlay] = useState<ModuleColumnPref[] | null>(null);

  const queryKey = useMemo(() => [moduleId, 'column-preferences'] as const, [moduleId]);

  const { data: queryPrefs, isSuccess: queryLoaded } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await apiJson<ModuleColumnPreferencesResponse>(`${apiPath}/column-preferences`);
      return readModuleColumnPreferences(response);
    },
    enabled: isAuthenticated && !!apiPath,
    staleTime: 60_000,
  });

  const { mutate: mutatePrefs } = useMutation({
    mutationFn: async (preferences: ModuleColumnPref[]) =>
      apiJson<ModuleColumnPreferencesResponse>(`${apiPath}/column-preferences`, {
        method: 'PUT',
        body: writeModuleColumnPreferences(preferences),
      }),
    onSuccess: (response) => {
      queryClient.setQueryData(queryKey, readModuleColumnPreferences(response));
    },
  });

  const activeServerPrefs = apiPath ? queryPrefs : serverColumnPrefs;
  const activePrefsLoaded = apiPath ? queryLoaded : columnPrefsLoaded;
  const activeSavePrefs = apiPath ? mutatePrefs : saveColumnPrefs;

  useEffect(() => {
    if (!userId) {
      setUserOverlay(null);
      migratedLocalColumnPrefs.current = false;
      return;
    }
    if (!activePrefsLoaded) {
      setUserOverlay(loadModuleColumnPreferences(moduleId, userId));
      return;
    }
    if (activeServerPrefs && activeServerPrefs.length > 0) {
      setUserOverlay(activeServerPrefs);
      saveModuleColumnPreferenceList(moduleId, userId, activeServerPrefs);
      return;
    }
    const local = loadModuleColumnPreferences(moduleId, userId);
    setUserOverlay(local);
    if (local?.length && !migratedLocalColumnPrefs.current) {
      migratedLocalColumnPrefs.current = true;
      activeSavePrefs?.(local);
    }
  }, [userId, activePrefsLoaded, activeServerPrefs, activeSavePrefs, moduleId]);

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
      activeSavePrefs?.(preferences);
    },
    [userId, activeSavePrefs, moduleId],
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
