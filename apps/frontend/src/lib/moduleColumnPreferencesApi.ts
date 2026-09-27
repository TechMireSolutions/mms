import type { ModuleColumnPref, ModuleColumnPreferencesResponse } from '@mms/shared';

export type { ModuleColumnPreferencesResponse };

export function readModuleColumnPreferences(
  body: ModuleColumnPreferencesResponse,
): ModuleColumnPref[] {
  return body.preferences ?? body.prefs ?? [];
}

export function writeModuleColumnPreferences(
  preferences: ModuleColumnPref[],
): string {
  return JSON.stringify({ preferences });
}
