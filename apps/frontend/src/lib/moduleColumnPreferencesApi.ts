import type { ModuleColumnPref } from '@mms/shared';

export type ModuleColumnPreferencesResponse = {
  success?: boolean;
  preferences?: ModuleColumnPref[];
  prefs?: ModuleColumnPref[];
};

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
