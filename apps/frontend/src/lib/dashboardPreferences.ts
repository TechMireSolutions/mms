import { getCollection, saveCollection, getObject, saveObject } from '@/lib/db';

export const DASHBOARD_DISABLED_CARDS_KEY = 'mms_dashboard_disabled_cards';
export const DASHBOARD_WIDGETS_KEY = 'kpi_custom_widgets';
const LEGACY_DISABLED_CARDS_KEY = 'dashboard_disabled_cards';

export function loadDisabledCardIds(): string[] {
  try {
    const saved =
      localStorage.getItem(DASHBOARD_DISABLED_CARDS_KEY) ??
      localStorage.getItem(LEGACY_DISABLED_CARDS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as string[];
      if (!localStorage.getItem(DASHBOARD_DISABLED_CARDS_KEY)) {
        localStorage.setItem(DASHBOARD_DISABLED_CARDS_KEY, saved);
        localStorage.removeItem(LEGACY_DISABLED_CARDS_KEY);
      }
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load disabled dashboard cards', e);
  }
  return getCollection<string>(LEGACY_DISABLED_CARDS_KEY, []);
}

export function saveDisabledCardIds(ids: string[]): void {
  saveCollection(LEGACY_DISABLED_CARDS_KEY, ids);
  localStorage.setItem(DASHBOARD_DISABLED_CARDS_KEY, JSON.stringify(ids));
  localStorage.removeItem(LEGACY_DISABLED_CARDS_KEY);
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

