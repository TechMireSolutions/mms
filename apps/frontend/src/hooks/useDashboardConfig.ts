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
