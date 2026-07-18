import { useCallback, useEffect } from 'react';
import { getObject, saveObject } from '@/lib/db';
import {
  DASHBOARD_DISABLED_CARDS_KEY,
  DASHBOARD_WIDGETS_KEY,
} from '@/lib/dashboardPreferences';
import { getOrInitializeCustomWidgets } from '@/tenant/features/reports/components/pinnedWidgets/widgetDefaults';
import type { CustomWidget } from '@/tenant/features/reports/components/PinnedWidgets';
import { useLiveObject } from '@/hooks/useLiveObject';

export function useDashboardConfig() {
  const disabledCardIds = useLiveObject<string[]>(
    DASHBOARD_DISABLED_CARDS_KEY,
    [],
  );

  const customWidgets = useLiveObject<CustomWidget[]>(
    DASHBOARD_WIDGETS_KEY,
    [],
    { loadFn: () => getOrInitializeCustomWidgets() },
  );

  useEffect(() => {
    const saved = getObject<CustomWidget[] | null>(DASHBOARD_WIDGETS_KEY, null);
    const current = getOrInitializeCustomWidgets();
    if (!saved || JSON.stringify(saved) !== JSON.stringify(current)) {
      saveObject(DASHBOARD_WIDGETS_KEY, current);
    }
  }, []);

  const updateCustomWidgets = useCallback((customWidgetsDraft: CustomWidget[]) => {
    saveObject(DASHBOARD_WIDGETS_KEY, customWidgetsDraft);
  }, []);

  const toggleCardVisibility = useCallback((cardId: string) => {
    const current = getObject<string[]>(DASHBOARD_DISABLED_CARDS_KEY, []);
    const updated = current.includes(cardId)
      ? current.filter((id) => id !== cardId)
      : [...current, cardId];
    saveObject(DASHBOARD_DISABLED_CARDS_KEY, updated);
  }, []);

  return {
    disabledCardIds,
    customWidgets,
    updateCustomWidgets,
    toggleCardVisibility,
  };
}
