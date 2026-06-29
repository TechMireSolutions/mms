import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ATTENDANCE_MODULE_CONTRACT,
  applyModuleColumnOverlay,
  buildAttendanceWorkColumnRegistry,
  isModuleColumnVisible,
  type ModuleColumnPref,
  type ModuleColumnRegistryEntry,
} from '@mms/shared';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import {
  loadModuleColumnPrefs,
  saveModuleColumnPrefList,
  saveModuleColumnRegistry,
} from '@/lib/columnPrefs/moduleColumnPrefsStorage';
import {
  useAttendanceColumnPrefs,
  useAttendanceColumnPrefsMutation,
} from '@/hooks/useAttendance';

export function useAttendanceColumnLayout() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const userId = user?.id ? String(user.id) : '';
  const { data: serverColumnPrefs, isSuccess: columnPrefsLoaded } = useAttendanceColumnPrefs();
  const { mutate: saveColumnPrefs } = useAttendanceColumnPrefsMutation();
  const migratedLocalColumnPrefs = useRef(false);
  const [userOverlay, setUserOverlay] = useState<ModuleColumnPref[] | null>(null);

  const tenantRegistry = useMemo(
    () =>
      buildAttendanceWorkColumnRegistry({
        date: t('attendance.columns.date'),
        class: t('attendance.columns.class'),
        student: t('attendance.columns.student'),
        status: t('attendance.columns.status'),
        timeIn: t('attendance.columns.timeIn'),
        timeOut: t('attendance.columns.timeOut'),
        notes: t('attendance.columns.notes'),
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
      setUserOverlay(loadModuleColumnPrefs(ATTENDANCE_MODULE_CONTRACT.moduleId, userId));
      return;
    }
    if (serverColumnPrefs && serverColumnPrefs.length > 0) {
      setUserOverlay(serverColumnPrefs);
      saveModuleColumnPrefList(ATTENDANCE_MODULE_CONTRACT.moduleId, userId, serverColumnPrefs);
      return;
    }
    const local = loadModuleColumnPrefs(ATTENDANCE_MODULE_CONTRACT.moduleId, userId);
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
    (columns: ModuleColumnRegistryEntry[]) => {
      if (!userId) return;
      saveModuleColumnRegistry(ATTENDANCE_MODULE_CONTRACT.moduleId, userId, columns);
      const preferences: ModuleColumnPref[] = columns.map(({ key, enabled, order }) => ({
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
      trigger: t('attendance.columns.trigger'),
      title: t('attendance.columns.title'),
      visibleAndOrder: t('attendance.columns.visibleAndOrder'),
      hidden: t('attendance.columns.hidden'),
      fixed: t('attendance.columns.fixed'),
      hideColumn: (label: string) => t('attendance.columns.hideColumn', { label }),
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
