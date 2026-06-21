import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  STUDENTS_MODULE_CONTRACT,
  applyModuleColumnOverlay,
  buildStudentWorkColumnRegistry,
  isModuleColumnVisible,
  type ModuleColumnPref,
  type ModuleColumnRegistryEntry,
  type StudentsSettings,
} from '@mms/shared';
import { useAuth } from '@/lib/contexts/AuthContext';
import useTranslation from '@/hooks/useTranslation';
import {
  loadModuleColumnPrefs,
  saveModuleColumnPrefList,
  saveModuleColumnRegistry,
} from '@/lib/columnPrefs/moduleColumnPrefsStorage';
import {
  useStudentColumnPrefs,
  useStudentColumnPrefsMutation,
} from '@/hooks/useStudents';

export function useStudentColumnLayout(settings: StudentsSettings) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const userId = user?.id ? String(user.id) : '';
  const { data: serverColumnPrefs, isSuccess: columnPrefsLoaded } = useStudentColumnPrefs();
  const { mutate: saveColumnPrefs } = useStudentColumnPrefsMutation();
  const migratedLocalColumnPrefs = useRef(false);
  const [userOverlay, setUserOverlay] = useState<ModuleColumnPref[] | null>(null);

  const tenantRegistry = useMemo(
    () =>
      buildStudentWorkColumnRegistry(settings, {
        name: t('students.columns.name'),
        dob: t('students.columns.dob'),
        parents: t('students.columns.parents'),
        sessions: t('students.columns.sessions'),
        status: t('students.columns.status'),
      }),
    [settings, t],
  );

  useEffect(() => {
    if (!userId) {
      setUserOverlay(null);
      migratedLocalColumnPrefs.current = false;
      return;
    }
    if (!columnPrefsLoaded) {
      setUserOverlay(loadModuleColumnPrefs(STUDENTS_MODULE_CONTRACT.moduleId, userId));
      return;
    }
    if (serverColumnPrefs && serverColumnPrefs.length > 0) {
      setUserOverlay(serverColumnPrefs);
      saveModuleColumnPrefList(STUDENTS_MODULE_CONTRACT.moduleId, userId, serverColumnPrefs);
      return;
    }
    const local = loadModuleColumnPrefs(STUDENTS_MODULE_CONTRACT.moduleId, userId);
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
      saveModuleColumnRegistry(STUDENTS_MODULE_CONTRACT.moduleId, userId, cols);
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
      trigger: t('students.columns.trigger'),
      title: t('students.columns.title'),
      visibleAndOrder: t('students.columns.visibleAndOrder'),
      hidden: t('students.columns.hidden'),
      fixed: t('students.columns.fixed'),
      hideColumn: (label: string) => t('students.columns.hideColumn', { label }),
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
