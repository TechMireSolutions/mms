import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ENROLLMENTS_MODULE_CONTRACT,
  applyModuleColumnOverlay,
  buildEnrollmentWorkColumnRegistry,
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
  useEnrollmentColumnPreferences,
  useEnrollmentColumnPreferencesMutation,
} from '@/hooks/useEnrollmentsApi';

export function useEnrollmentColumnLayout() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const userId = user?.id ? String(user.id) : '';
  const { data: serverColumnPrefs, isSuccess: columnPrefsLoaded } = useEnrollmentColumnPreferences();
  const { mutate: saveColumnPrefs } = useEnrollmentColumnPreferencesMutation();
  const migratedLocalColumnPrefs = useRef(false);
  const [userOverlay, setUserOverlay] = useState<ModuleColumnPreference[] | null>(null);

  const tenantRegistry = useMemo(
    () =>
      buildEnrollmentWorkColumnRegistry({
        student: t('enrollments.columns.student'),
        session: t('enrollments.columns.session'),
        class: t('enrollments.columns.class'),
        enrolledDate: t('enrollments.columns.enrolledDate'),
        finalFee: t('enrollments.columns.finalFee'),
        status: t('enrollments.columns.status'),
        payment: t('enrollments.columns.payment'),
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
      setUserOverlay(loadModuleColumnPreferences(ENROLLMENTS_MODULE_CONTRACT.moduleId, userId));
      return;
    }
    if (serverColumnPrefs && serverColumnPrefs.length > 0) {
      setUserOverlay(serverColumnPrefs);
      saveModuleColumnPreferenceList(ENROLLMENTS_MODULE_CONTRACT.moduleId, userId, serverColumnPrefs);
      return;
    }
    const local = loadModuleColumnPreferences(ENROLLMENTS_MODULE_CONTRACT.moduleId, userId);
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
      saveModuleColumnRegistry(ENROLLMENTS_MODULE_CONTRACT.moduleId, userId, columns);
      const preferences: ModuleColumnPreference[] = columns.map(({ key, enabled, order }) => ({
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
      trigger: t('enrollments.columns.trigger'),
      title: t('enrollments.columns.title'),
      visibleAndOrder: t('enrollments.columns.visibleAndOrder'),
      hidden: t('enrollments.columns.hidden'),
      fixed: t('enrollments.columns.fixed'),
      hideColumn: (label: string) => t('enrollments.columns.hideColumn', { label }),
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
