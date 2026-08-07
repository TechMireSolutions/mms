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
  /** Optional normalize (e.g. Contacts emergency key migration) applied on load. */
  normalizePreferences?: (prefs: ModuleColumnPref[]) => ModuleColumnPref[];
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

function arePreferencesEqual(
  a: ModuleColumnPref[] | null | undefined,
  b: ModuleColumnPref[] | null | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const pa = a[i];
    const pb = b[i];
    if (
      pa.key !== pb.key ||
      pa.enabled !== pb.enabled ||
      pa.order !== pb.order ||
      pa.width !== pb.width
    ) {
      return false;
    }
  }
  return true;
}

export function useModuleColumnLayout({
  moduleId,
  tenantRegistry,
  apiPath,
  serverColumnPrefs,
  columnPrefsLoaded = false,
  saveColumnPrefs,
  normalizePreferences,
  translationPrefix,
}: UseModuleColumnLayoutOptions) {
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const userId = user?.id ? String(user.id) : '';
  const migratedLocalColumnPrefs = useRef(false);
  const [userOverlay, setUserOverlay] = useState<ModuleColumnPref[] | null>(null);
  const saveServerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const normalizePreferencesRef = useRef(normalizePreferences);
  useEffect(() => {
    normalizePreferencesRef.current = normalizePreferences;
  }, [normalizePreferences]);

  const queryKey = useMemo(() => [moduleId, 'column-preferences'] as const, [moduleId]);

  const { data: queryPrefs, isSuccess: queryLoaded } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await apiJson<ModuleColumnPreferencesResponse>(`${apiPath}/column-preferences`);
      const prefs = readModuleColumnPreferences(response);
      const normFn = normalizePreferencesRef.current;
      return normFn ? normFn(prefs) : prefs;
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
      const prefs = readModuleColumnPreferences(response);
      const normFn = normalizePreferencesRef.current;
      queryClient.setQueryData(
        queryKey,
        normFn ? normFn(prefs) : prefs,
      );
    },
  });

  const activeServerPrefs = useMemo(() => {
    const prefs = apiPath ? queryPrefs : serverColumnPrefs;
    if (!prefs?.length) return prefs ?? null;
    const normFn = normalizePreferencesRef.current;
    return normFn ? normFn(prefs) : prefs;
  }, [apiPath, queryPrefs, serverColumnPrefs]);

  const activePrefsLoaded = apiPath ? queryLoaded : columnPrefsLoaded;
  const persistToServer = apiPath ? mutatePrefs : saveColumnPrefs;

  const persistToServerRef = useRef(persistToServer);
  useEffect(() => {
    persistToServerRef.current = persistToServer;
  }, [persistToServer]);

  const queueServerSave = useCallback(
    (preferences: ModuleColumnPref[]) => {
      const fn = persistToServerRef.current;
      if (!fn) return;
      if (saveServerTimerRef.current) clearTimeout(saveServerTimerRef.current);
      saveServerTimerRef.current = setTimeout(() => {
        fn(preferences);
        saveServerTimerRef.current = null;
      }, 300);
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (saveServerTimerRef.current) clearTimeout(saveServerTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!userId) {
      setUserOverlay((prev) => (prev === null ? prev : null));
      migratedLocalColumnPrefs.current = false;
      return;
    }

    const rawLocal = loadModuleColumnPreferences(moduleId, userId);
    const normFn = normalizePreferencesRef.current;
    const local = rawLocal && normFn
      ? normFn(rawLocal)
      : rawLocal;

    if (!activePrefsLoaded) {
      if (local) {
        setUserOverlay((prev) => (arePreferencesEqual(prev, local) ? prev : local));
      }
      return;
    }

    if (activeServerPrefs && activeServerPrefs.length > 0) {
      const merged = mergeModuleColumnPreferences(activeServerPrefs, local) ?? activeServerPrefs;
      setUserOverlay((prev) => (arePreferencesEqual(prev, merged) ? prev : merged));
      saveModuleColumnPreferenceList(moduleId, userId, merged);
      return;
    }

    if (local) {
      setUserOverlay((prev) => (arePreferencesEqual(prev, local) ? prev : local));
    }
    if (local?.length && !migratedLocalColumnPrefs.current) {
      migratedLocalColumnPrefs.current = true;
      persistToServerRef.current?.(local);
    }
  }, [
    userId,
    activePrefsLoaded,
    activeServerPrefs,
    moduleId,
  ]);

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
