import { useCallback, useEffect, useState } from 'react';
import { getObject, saveObject } from '@/lib/db';
import {
  DASHBOARD_DISABLED_CARDS_KEY,
  DASHBOARD_WIDGETS_KEY,
} from '@/lib/dashboardPreferences';
import { getOrInitializeCustomWidgets } from '@/tenant/features/reports/components/pinnedWidgets/widgetDefaults';
import type { CustomWidget } from '@/tenant/features/reports/components/PinnedWidgets';

export function useDashboardConfig() {
  const [disabledCardIds, setDisabledCardIds] = useState<string[]>(() =>
    getObject<string[]>(DASHBOARD_DISABLED_CARDS_KEY, [])
  );
  const [customWidgets, setCustomWidgets] = useState<CustomWidget[]>(() =>
    getOrInitializeCustomWidgets()
  );

  useEffect(() => {
    const saved = getObject<CustomWidget[] | null>(DASHBOARD_WIDGETS_KEY, null);
    const current = getOrInitializeCustomWidgets();
    if (!saved || JSON.stringify(saved) !== JSON.stringify(current)) {
      saveObject(DASHBOARD_WIDGETS_KEY, current);
    }
  }, []);

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

  const updateCustomWidgets = useCallback((customWidgetsDraft: CustomWidget[]) => {
    saveObject(DASHBOARD_WIDGETS_KEY, customWidgetsDraft);
    setCustomWidgets(customWidgetsDraft);
    window.dispatchEvent(new Event('local-database-update'));
  }, []);

  const toggleCardVisibility = useCallback((cardId: string) => {
    setDisabledCardIds((currentDisabledCardIds) => {
      const disabledCardIds = currentDisabledCardIds.includes(cardId)
        ? currentDisabledCardIds.filter((id) => id !== cardId)
        : [...currentDisabledCardIds, cardId];
      saveObject(DASHBOARD_DISABLED_CARDS_KEY, disabledCardIds);
      window.dispatchEvent(new Event('local-database-update'));
      return disabledCardIds;
    });
  }, []);

  return {
    disabledCardIds,
    customWidgets,
    updateCustomWidgets,
    toggleCardVisibility,
  };
}
