import { getObject, saveObject } from '@/lib/db';

export const DASHBOARD_DISABLED_CARDS_KEY = 'mms_dashboard_disabled_cards';
export const DASHBOARD_WIDGETS_KEY = 'kpi_custom_widgets';
const LEGACY_DISABLED_CARDS_KEY = 'dashboard_disabled_cards';

export function loadDisabledCardIds(): string[] {
  return getObject<string[]>(DASHBOARD_DISABLED_CARDS_KEY, []);
}

export function saveDisabledCardIds(ids: string[]): void {
  saveObject(DASHBOARD_DISABLED_CARDS_KEY, ids);
}

export function loadCustomWidgetsRaw(): string | null {
  const data = getObject<unknown[] | null>(DASHBOARD_WIDGETS_KEY, null);
  return data ? JSON.stringify(data) : null;
}

export function saveCustomWidgetsRaw(json: string): void {
  try {
    const parsed = JSON.parse(json);
    saveObject(DASHBOARD_WIDGETS_KEY, parsed);
  } catch {
    saveObject(DASHBOARD_WIDGETS_KEY, json);
  }
}

