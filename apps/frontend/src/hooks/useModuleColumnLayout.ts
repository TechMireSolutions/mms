import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  applyModuleColumnOverlay,
  clampModuleColumnWidth,
  getModuleColumnWidth,
  isModuleColumnVisible,
  mergeModuleColumnPreferences,
  type ModuleColumnPref,
  type ModuleColumnRegistryEntry,
  type AppTranslationKey,
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

function toStoredPreferences(registry: ModuleColumnRegistryEntry[]): ModuleColumnPref[] {
  return registry.map(({ key, enabled, order, width }) => {
    const preference: ModuleColumnPref = { key, enabled, order };
    if (typeof width === 'number') {
      preference.width = clampModuleColumnWidth(width);
    }
    return preference;
  });
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
  const saveServerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  const persistToServer = apiPath ? mutatePrefs : saveColumnPrefs;

  const queueServerSave = useCallback(
    (preferences: ModuleColumnPref[]) => {
      if (!persistToServer) return;
      if (saveServerTimerRef.current) clearTimeout(saveServerTimerRef.current);
      saveServerTimerRef.current = setTimeout(() => {
        persistToServer(preferences);
        saveServerTimerRef.current = null;
      }, 300);
    },
    [persistToServer],
  );

  useEffect(() => {
    return () => {
      if (saveServerTimerRef.current) clearTimeout(saveServerTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!userId) {
      setUserOverlay(null);
      migratedLocalColumnPrefs.current = false;
      return;
    }

    const local = loadModuleColumnPreferences(moduleId, userId);

    if (!activePrefsLoaded) {
      setUserOverlay(local);
      return;
    }

    if (activeServerPrefs && activeServerPrefs.length > 0) {
      const merged = mergeModuleColumnPreferences(activeServerPrefs, local) ?? activeServerPrefs;
      setUserOverlay(merged);
      saveModuleColumnPreferenceList(moduleId, userId, merged);
      return;
    }

    setUserOverlay(local);
    if (local?.length && !migratedLocalColumnPrefs.current) {
      migratedLocalColumnPrefs.current = true;
      persistToServer?.(local);
    }
  }, [userId, activePrefsLoaded, activeServerPrefs, persistToServer, moduleId]);

  const columnRegistry = useMemo(
    () => applyModuleColumnOverlay(tenantRegistry, userOverlay),
    [tenantRegistry, userOverlay],
  );

  const isColumnVisible = useCallback(
    (key: string) => isModuleColumnVisible(columnRegistry, key),
    [columnRegistry],
  );

  const getColumnWidth = useCallback(
    (key: string) => getModuleColumnWidth(columnRegistry, key),
    [columnRegistry],
  );

  const updateUserColumnLayout = useCallback(
    (newRegistry: ModuleColumnRegistryEntry[]) => {
      if (!userId) return;
      saveModuleColumnRegistry(moduleId, userId, newRegistry);
      const preferences = toStoredPreferences(newRegistry);
      setUserOverlay(preferences);
      queueServerSave(preferences);
    },
    [userId, queueServerSave, moduleId],
  );

  const setColumnWidth = useCallback(
    (key: string, width: number) => {
      if (!userId) return;
      const nextWidth = clampModuleColumnWidth(width);
      const nextRegistry = columnRegistry.map((column) =>
        column.key === key ? { ...column, width: nextWidth } : column,
      );
      updateUserColumnLayout(nextRegistry);
    },
    [columnRegistry, updateUserColumnLayout, userId],
  );

  const customizerLabels = useMemo(
    () => ({
      trigger: t(`${translationPrefix}.trigger` as AppTranslationKey),
      title: t(`${translationPrefix}.title` as AppTranslationKey),
      visibleAndOrder: t(`${translationPrefix}.visibleAndOrder` as AppTranslationKey),
      hidden: t(`${translationPrefix}.hidden` as AppTranslationKey),
      fixed: t(`${translationPrefix}.fixed` as AppTranslationKey),
      hideColumn: (label: string) => t(`${translationPrefix}.hideColumn` as AppTranslationKey, { label }),
    }),
    [t, translationPrefix],
  );

  return {
    columnRegistry,
    isColumnVisible,
    getColumnWidth,
    setColumnWidth,
    updateUserColumnLayout,
    customizerLabels,
  };
}
