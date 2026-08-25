import {
  normalizeContactPreferences,
  type ContactPreferences,
} from '@mms/shared';
import { createModuleSetupConfigApi } from '@/lib/query/createModuleSetupConfigApi';

export const contactsSetupConfigApi = createModuleSetupConfigApi<ContactPreferences>({
  fetchPreferencesFn: async () => {
    return normalizeContactPreferences(null);
  },
  savePreferencesFn: async (prefs) => {
    return prefs as ContactPreferences;
  },
  normalizePrefs: (prefs: unknown) => normalizeContactPreferences(prefs as any),
});

export const fetchContactPreferences = contactsSetupConfigApi.fetchPreferences;
export const saveContactPreferencesAsync = contactsSetupConfigApi.savePreferencesAsync;
export const setContactPreferencesMemory = contactsSetupConfigApi.setPreferencesMemory;
