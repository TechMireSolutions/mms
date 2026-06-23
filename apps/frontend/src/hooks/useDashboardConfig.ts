import { useCallback, useEffect, useState } from 'react';
import { getObject, saveObject } from '@/lib/db';
import {
  DASHBOARD_DISABLED_CARDS_KEY,
  DASHBOARD_WIDGETS_KEY,
} from '@/lib/dashboardPreferences';
import { getOrInitializeCustomWidgets } from '@/components/reports/pinnedWidgets/widgetDefaults';
import type { CustomWidget } from '@/components/reports/PinnedWidgets';

export function useDashboardConfig() {
  const [disabledCardIds, setDisabledCardIds] = useState<string[]>(() =>
    getObject<string[]>(DASHBOARD_DISABLED_CARDS_KEY, [])
  );
  const [customWidgets, setCustomWidgets] = useState<CustomWidget[]>(() =>
    getOrInitializeCustomWidgets()
  );

  const reloadConfig = useCallback(() => {
    setDisabledCardIds(getObject<string[]>(DASHBOARD_DISABLED_CARDS_KEY, []));
    setCustomWidgets(getOrInitializeCustomWidgets());
  }, []);

  useEffect(() => {
    window.addEventListener('local-database-update', reloadConfig);
    window.addEventListener('storage', reloadConfig);
    return () => {
      window.removeEventListener('local-database-update', reloadConfig);
      window.removeEventListener('storage', reloadConfig);
    };
  }, [reloadConfig]);

  const updateCustomWidgets = useCallback((next: CustomWidget[]) => {
    saveObject(DASHBOARD_WIDGETS_KEY, next);
    setCustomWidgets(next);
    window.dispatchEvent(new Event('local-database-update'));
  }, []);

  const toggleCardVisibility = useCallback((cardId: string) => {
    setDisabledCardIds((prev) => {
      const next = prev.includes(cardId)
        ? prev.filter((id) => id !== cardId)
        : [...prev, cardId];
      saveObject(DASHBOARD_DISABLED_CARDS_KEY, next);
      window.dispatchEvent(new Event('local-database-update'));
      return next;
    });
  }, []);

  return {
    disabledCardIds,
    customWidgets,
    updateCustomWidgets,
    toggleCardVisibility,
  };
}
