import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ACCOUNTING_MODULE_CONTRACT,
  applyModuleColumnOverlay,
  buildAccountingJournalWorkColumnRegistry,
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
  useAccountingJournalColumnPrefs,
  useAccountingJournalColumnPrefsMutation,
} from '@/hooks/useAccountingApi';

const STORAGE_SUFFIX = 'journal';

export function useAccountingJournalColumnLayout() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const userId = user?.id ? String(user.id) : '';
  const { data: serverColumnPrefs, isSuccess: columnPrefsLoaded } = useAccountingJournalColumnPrefs();
  const { mutate: saveColumnPrefs } = useAccountingJournalColumnPrefsMutation();
  const migratedLocalColumnPrefs = useRef(false);
  const [userOverlay, setUserOverlay] = useState<ModuleColumnPref[] | null>(null);

  const storageModuleId = `${ACCOUNTING_MODULE_CONTRACT.moduleId}_${STORAGE_SUFFIX}`;

  const tenantRegistry = useMemo(
    () =>
      buildAccountingJournalWorkColumnRegistry({
        ref: t('accounting.columns.journal.ref'),
        date: t('accounting.columns.journal.date'),
        description: t('accounting.columns.journal.description'),
        tags: t('accounting.columns.journal.tags'),
        debit: t('accounting.columns.journal.debit'),
        credit: t('accounting.columns.journal.credit'),
        status: t('accounting.columns.journal.status'),
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
      setUserOverlay(loadModuleColumnPrefs(storageModuleId, userId));
      return;
    }
    if (serverColumnPrefs && serverColumnPrefs.length > 0) {
      setUserOverlay(serverColumnPrefs);
      saveModuleColumnPrefList(storageModuleId, userId, serverColumnPrefs);
      return;
    }
    const local = loadModuleColumnPrefs(storageModuleId, userId);
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
    (columnRegistry: ModuleColumnRegistryEntry[]) => {
      if (!userId) return;
      saveModuleColumnRegistry(storageModuleId, userId, columnRegistry);
      const preferences: ModuleColumnPref[] = columnRegistry.map(({ key, enabled, order }) => ({
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
      trigger: t('accounting.columns.trigger'),
      title: t('accounting.columns.title'),
      visibleAndOrder: t('accounting.columns.visibleAndOrder'),
      hidden: t('accounting.columns.hidden'),
      fixed: t('accounting.columns.fixed'),
      hideColumn: (label: string) => t('accounting.columns.hideColumn', { label }),
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
