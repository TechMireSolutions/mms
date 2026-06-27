import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  EXAMINATIONS_MODULE_CONTRACT,
  applyModuleColumnOverlay,
  buildExaminationResultsWorkColumnRegistry,
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
  useExaminationResultsColumnPreferences,
  useExaminationResultsColumnPreferencesMutation,
} from '@/hooks/useExaminationsApi';

const STORAGE_SUFFIX = 'results';

export function useExaminationResultsColumnLayout() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const userId = user?.id ? String(user.id) : '';
  const { data: serverColumnPrefs, isSuccess: columnPrefsLoaded } = useExaminationResultsColumnPreferences();
  const { mutate: saveColumnPrefs } = useExaminationResultsColumnPreferencesMutation();
  const migratedLocalColumnPrefs = useRef(false);
  const [userOverlay, setUserOverlay] = useState<ModuleColumnPreference[] | null>(null);

  const storageModuleId = `${EXAMINATIONS_MODULE_CONTRACT.moduleId}_${STORAGE_SUFFIX}`;

  const tenantRegistry = useMemo(
    () =>
      buildExaminationResultsWorkColumnRegistry({
        rank: t('examinations.columns.results.rank'),
        student: t('examinations.columns.results.student'),
        classRoll: t('examinations.columns.results.classRoll'),
        marks: t('examinations.columns.results.marks'),
        percentage: t('examinations.columns.results.percentage'),
        grade: t('examinations.columns.results.grade'),
        passFail: t('examinations.columns.results.passFail'),
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
      trigger: t('examinations.columns.trigger'),
      title: t('examinations.columns.title'),
      visibleAndOrder: t('examinations.columns.visibleAndOrder'),
      hidden: t('examinations.columns.hidden'),
      fixed: t('examinations.columns.fixed'),
      hideColumn: (label: string) => t('examinations.columns.hideColumn', { label }),
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
