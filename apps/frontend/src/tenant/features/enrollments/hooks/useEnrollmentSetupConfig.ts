import {
  ENROLLMENTS_MODULE_MANIFEST,
  normalizeEnrollmentModulePreferences,
  type EnrollmentModulePreferences,
  type EnrollmentsSettings
} from '@mms/shared';
import { createModuleSetupConfigHooks } from '@/lib/query/createModuleSetupConfigHooks';
import {
  fetchEnrollmentPreferences,
  saveEnrollmentPreferencesAsync,
  setEnrollmentPreferencesMemory,
} from '@/tenant/features/enrollments/hooks/enrollmentSetupConfigApi';

export const ENROLLMENTS_PREFERENCES_QUERY_KEY = [
  ENROLLMENTS_MODULE_MANIFEST.collectionKey,
  'preferences',
] as const;

const setupConfigHooks = createModuleSetupConfigHooks<EnrollmentModulePreferences>({
  preferencesQueryKey: ENROLLMENTS_PREFERENCES_QUERY_KEY,
  fetchPreferences: fetchEnrollmentPreferences,
  savePreferences: saveEnrollmentPreferencesAsync,
  setPreferencesMemory: setEnrollmentPreferencesMemory,
  preferencesPlaceholder: () => normalizeEnrollmentModulePreferences(null),
});

export const useEnrollmentPreferencesQuery = setupConfigHooks.usePreferencesQuery;
export const useEnrollmentPreferencesMutation = setupConfigHooks.usePreferencesMutation;

import { useMemo } from 'react';

/** Composed EnrollmentsSettings from preferences queries. */
export function useComposedEnrollmentsSettings(): EnrollmentsSettings {
  const prefsQuery = useEnrollmentPreferencesQuery();
  const fallback = useMemo(() => normalizeEnrollmentModulePreferences(null), []);
  return (prefsQuery.data ?? fallback) as unknown as EnrollmentsSettings;
}
