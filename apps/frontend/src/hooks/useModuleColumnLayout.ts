import { useCallback, useMemo } from 'react';
import {
  applyModuleColumnOverlay,
  clampModuleColumnWidth,
  getModuleColumnWidth,
  isModuleColumnVisible,
  type ModuleColumnPref,
  type ModuleColumnRegistryEntry,
  type AppTranslationKey,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useUiPreference } from '@/lib/uiStateStore';

export interface UseModuleColumnLayoutOptions {
  moduleId: string;
  tenantRegistry: ModuleColumnRegistryEntry[];
  /** @deprecated No longer used, managed by useUiPreference unified store */
  apiPath?: string;
  /** @deprecated No longer used, managed by useUiPreference unified store */
  serverColumnPrefs?: ModuleColumnPref[] | null;
  /** @deprecated No longer used, managed by useUiPreference unified store */
  columnPrefsLoaded?: boolean;
  /** @deprecated No longer used, managed by useUiPreference unified store */
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

export function useModuleColumnLayout({
  moduleId,
  tenantRegistry,
  normalizePreferences,
  translationPrefix,
}: UseModuleColumnLayoutOptions) {
  const { t } = useTranslation();
  
  const prefKey = `${moduleId}.table.columns`;
  const [userOverlayRaw, setUserOverlay] = useUiPreference<ModuleColumnPref[] | null>(prefKey, null);

  const userOverlay = useMemo(() => {
    return userOverlayRaw && normalizePreferences ? normalizePreferences(userOverlayRaw) : userOverlayRaw;
  }, [userOverlayRaw, normalizePreferences]);

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
      const preferences = toStoredPreferences(newRegistry);
      setUserOverlay(preferences);
    },
    [setUserOverlay],
  );

  const setColumnWidth = useCallback(
    (key: string, width: number) => {
      const nextWidth = clampModuleColumnWidth(width);
      const nextRegistry = columnRegistry.map((column) =>
        column.key === key ? { ...column, width: nextWidth } : column,
      );
      updateUserColumnLayout(nextRegistry);
    },
    [columnRegistry, updateUserColumnLayout],
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
