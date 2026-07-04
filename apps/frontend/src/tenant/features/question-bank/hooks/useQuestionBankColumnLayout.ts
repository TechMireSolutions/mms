import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  QUESTION_BANK_MODULE_CONTRACT,
  applyModuleColumnOverlay,
  buildQuestionBankWorkColumnRegistry,
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
  useQuestionBankColumnPrefs,
  useQuestionBankColumnPrefsMutation,
} from '@/tenant/features/questionBank/hooks/useQuestionBankApi';

export function useQuestionBankColumnLayout() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const userId = user?.id ? String(user.id) : '';
  const { data: serverColumnPrefs, isSuccess: columnPrefsLoaded } = useQuestionBankColumnPrefs();
  const { mutate: saveColumnPrefs } = useQuestionBankColumnPrefsMutation();
  const migratedLocalColumnPrefs = useRef(false);
  const [userOverlay, setUserOverlay] = useState<ModuleColumnPref[] | null>(null);

  const tenantRegistry = useMemo(
    () =>
      buildQuestionBankWorkColumnRegistry({
        text: t('questionBank.columns.text'),
        category: t('questionBank.columns.category'),
        language: t('questionBank.columns.language'),
        type: t('questionBank.columns.type'),
        difficulty: t('questionBank.columns.difficulty'),
        source: t('questionBank.columns.source'),
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
      setUserOverlay(loadModuleColumnPrefs(QUESTION_BANK_MODULE_CONTRACT.moduleId, userId));
      return;
    }
    if (serverColumnPrefs && serverColumnPrefs.length > 0) {
      setUserOverlay(serverColumnPrefs);
      saveModuleColumnPrefList(QUESTION_BANK_MODULE_CONTRACT.moduleId, userId, serverColumnPrefs);
      return;
    }
    const local = loadModuleColumnPrefs(QUESTION_BANK_MODULE_CONTRACT.moduleId, userId);
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
      saveModuleColumnRegistry(QUESTION_BANK_MODULE_CONTRACT.moduleId, userId, columnRegistry);
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
      trigger: t('questionBank.columns.trigger'),
      title: t('questionBank.columns.title'),
      visibleAndOrder: t('questionBank.columns.visibleAndOrder'),
      hidden: t('questionBank.columns.hidden'),
      fixed: t('questionBank.columns.fixed'),
      hideColumn: (label: string) => t('questionBank.columns.hideColumn', { label }),
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
