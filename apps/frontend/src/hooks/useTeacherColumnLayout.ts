import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  TEACHERS_MODULE_CONTRACT,
  applyModuleColumnOverlay,
  buildTeacherWorkColumnRegistry,
  isModuleColumnVisible,
  type ModuleColumnPref,
  type ModuleColumnRegistryEntry,
  type TeachersSettings,
} from '@mms/shared';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import {
  loadModuleColumnPrefs,
  saveModuleColumnPrefList,
  saveModuleColumnRegistry,
} from '@/lib/columnPrefs/moduleColumnPrefsStorage';
import {
  useTeacherColumnPrefs,
  useTeacherColumnPrefsMutation,
} from '@/hooks/useTeachers';

export function useTeacherColumnLayout(settings: TeachersSettings) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const userId = user?.id ? String(user.id) : '';
  const { data: serverColumnPrefs, isSuccess: columnPrefsLoaded } = useTeacherColumnPrefs();
  const { mutate: saveColumnPrefs } = useTeacherColumnPrefsMutation();
  const migratedLocalColumnPrefs = useRef(false);
  const [userOverlay, setUserOverlay] = useState<ModuleColumnPref[] | null>(null);

  const tenantRegistry = useMemo(
    () =>
      buildTeacherWorkColumnRegistry(settings, {
        name: t('teachers.field.name'),
        specialization: t('teachers.field.specialization'),
        qualification: t('teachers.field.qualification'),
        joinDate: t('teachers.field.joinDate'),
        status: t('teachers.field.status'),
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
      setUserOverlay(loadModuleColumnPrefs(TEACHERS_MODULE_CONTRACT.moduleId, userId));
      return;
    }
    if (serverColumnPrefs && serverColumnPrefs.length > 0) {
      setUserOverlay(serverColumnPrefs);
      saveModuleColumnPrefList(TEACHERS_MODULE_CONTRACT.moduleId, userId, serverColumnPrefs);
      return;
    }
    const local = loadModuleColumnPrefs(TEACHERS_MODULE_CONTRACT.moduleId, userId);
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
    (columnRegistry: ModuleColumnRegistryEntry[]) => {
      if (!userId) return;
      saveModuleColumnRegistry(TEACHERS_MODULE_CONTRACT.moduleId, userId, columnRegistry);
      const preferences: ModuleColumnPref[] = columnRegistry.map(({ key, enabled, order }) => ({
        key,
        enabled,
        order,
      }));
      setUserOverlay(preferences);
      saveColumnPrefs(preferences);
    },
    [userId, saveColumnPrefs],
  );

  const customizerLabels = useMemo(
    () => ({
      trigger: t('teachers.columns.trigger'),
      title: t('teachers.columns.title'),
      visibleAndOrder: t('teachers.columns.visibleAndOrder'),
      hidden: t('teachers.columns.hidden'),
      fixed: t('teachers.columns.fixed'),
      hideColumn: (label: string) => t('teachers.columns.hideColumn', { label }),
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
