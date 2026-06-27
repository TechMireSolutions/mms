import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  EXAMINATIONS_MODULE_CONTRACT,
  applyModuleColumnOverlay,
  buildExaminationExamWorkColumnRegistry,
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
  useExaminationExamColumnPreferences,
  useExaminationExamColumnPreferencesMutation,
} from '@/hooks/useExaminationsApi';

const STORAGE_SUFFIX = 'exams';

export function useExaminationExamColumnLayout() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const userId = user?.id ? String(user.id) : '';
  const { data: serverColumnPrefs, isSuccess: columnPrefsLoaded } = useExaminationExamColumnPreferences();
  const { mutate: saveColumnPrefs } = useExaminationExamColumnPreferencesMutation();
  const migratedLocalColumnPrefs = useRef(false);
  const [userOverlay, setUserOverlay] = useState<ModuleColumnPreference[] | null>(null);

  const storageModuleId = `${EXAMINATIONS_MODULE_CONTRACT.moduleId}_${STORAGE_SUFFIX}`;

  const tenantRegistry = useMemo(
    () =>
      buildExaminationExamWorkColumnRegistry({
        name: t('examinations.columns.exam.name'),
        subject: t('examinations.columns.exam.subject'),
        date: t('examinations.columns.exam.date'),
        duration: t('examinations.columns.exam.duration'),
        status: t('examinations.columns.exam.status'),
        totalMarks: t('examinations.columns.exam.totalMarks'),
        passingMarks: t('examinations.columns.exam.passingMarks'),
        classes: t('examinations.columns.exam.classes'),
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
