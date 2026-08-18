import type { CustomWidget } from "./pinnedWidgetTypes";
import { DASHBOARD_WIDGETS_KEY } from "@mms/shared";
import { getObject, saveObject } from "@/lib/db";
import { getDefaultCustomWidgets, withDefaultI18nKeys } from "./widgetDefaultSeeds.js";

/** Pure union of all seeded default widgets across categories (no localStorage I/O). */
export function buildDefaultCustomWidgets(): CustomWidget[] {
  return [
    ...getDefaultCustomWidgets("contacts"),
    ...getDefaultCustomWidgets("students"),
    ...getDefaultCustomWidgets("financial"),
    ...getDefaultCustomWidgets("hasanat"),
    ...getDefaultCustomWidgets("sessions"),
  ].map(withDefaultI18nKeys);
}

/**
 * Loads, merges, and initializes the custom widgets database in local storage.
 * Synchronizes new defaults dynamically. Used only for the one-time local→server
 * seed migration in `useDashboardConfig`; server-authoritative Query is the primary path.
 */
export function getOrInitializeCustomWidgets(): CustomWidget[] {
  try {
    const saved = getObject<CustomWidget[] | null>(DASHBOARD_WIDGETS_KEY, null);
    const defaults = buildDefaultCustomWidgets();
    if (!saved) {
      saveObject(DASHBOARD_WIDGETS_KEY, defaults);
      return defaults;
    }
    const parsed = saved.map(withDefaultI18nKeys);
    const existingIds = new Set(parsed.map((widget) => widget.id));
    const merged = [...parsed];
    let hasChanges = false;
    for (const defaultWidget of defaults) {
      if (!existingIds.has(defaultWidget.id)) {
        merged.push(defaultWidget);
        hasChanges = true;
      } else {
        const widgetIndex = merged.findIndex((widget) => widget.id === defaultWidget.id);
        if (widgetIndex >= 0) {
          if (merged[widgetIndex].widgetType !== defaultWidget.widgetType) {
            merged[widgetIndex] = { ...merged[widgetIndex], widgetType: defaultWidget.widgetType };
            hasChanges = true;
          }
          if (defaultWidget.titleKey && !merged[widgetIndex].titleKey) {
            merged[widgetIndex] = { ...merged[widgetIndex], titleKey: defaultWidget.titleKey };
            hasChanges = true;
          }
          if (defaultWidget.switchLabelOnKey && !merged[widgetIndex].switchLabelOnKey) {
            merged[widgetIndex] = {
              ...merged[widgetIndex],
              switchLabelOnKey: defaultWidget.switchLabelOnKey,
              switchLabelOffKey: defaultWidget.switchLabelOffKey,
            };
            hasChanges = true;
          }
          if (defaultWidget.fixedSubTextKey && !merged[widgetIndex].fixedSubTextKey) {
            merged[widgetIndex] = { ...merged[widgetIndex], fixedSubTextKey: defaultWidget.fixedSubTextKey };
            hasChanges = true;
          }
        }
      }
    }
    if (hasChanges) {
      saveObject(DASHBOARD_WIDGETS_KEY, merged);
    }
    return merged;
  } catch (error) {
    console.error("Failed to load custom widgets", error);
    return [];
  }
}