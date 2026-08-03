import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ContactPreferences, FieldConfig } from '@mms/shared';
import { CONTACTS_MODULE_MANIFEST } from '@mms/shared';
import { useAuth } from '@/lib/contexts/AuthContext';
import {
  fetchFieldConfig,
  saveFieldConfigAsync,
  setFieldConfigMemory,
} from '@/lib/contactFieldsStore';
import {
  fetchPreferences,
  savePreferencesAsync,
  setPreferencesMemory,
} from '@/lib/contacts/preferencesStorage';
import { getContactFieldSystemDefaults } from '@/lib/contactFieldsMigration';
import { DEFAULT_CONTACT_PREFERENCES } from '@mms/shared';

export const CONTACTS_FIELD_CONFIG_QUERY_KEY = [
  CONTACTS_MODULE_MANIFEST.collectionKey,
  'field-config',
] as const;

export const CONTACTS_PREFERENCES_QUERY_KEY = [
  CONTACTS_MODULE_MANIFEST.collectionKey,
  'preferences',
] as const;

export function useContactFieldConfigQuery() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: CONTACTS_FIELD_CONFIG_QUERY_KEY,
    queryFn: ({ signal }) => fetchFieldConfig(signal),
    enabled: isAuthenticated,
    placeholderData: getContactFieldSystemDefaults(),
    staleTime: 60_000,
  });
}

export function useContactFieldConfigMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (config: FieldConfig) => saveFieldConfigAsync(config),
    onSuccess: (saved) => {
      setFieldConfigMemory(saved);
      queryClient.setQueryData(CONTACTS_FIELD_CONFIG_QUERY_KEY, saved);
      void queryClient.invalidateQueries({ queryKey: CONTACTS_FIELD_CONFIG_QUERY_KEY });
    },
  });
}

export function useContactPreferencesQuery() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: CONTACTS_PREFERENCES_QUERY_KEY,
    queryFn: ({ signal }) => fetchPreferences(signal),
    enabled: isAuthenticated,
    placeholderData: DEFAULT_CONTACT_PREFERENCES,
    staleTime: 60_000,
  });
}

export function useContactPreferencesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (preferences: ContactPreferences) => savePreferencesAsync(preferences),
    onSuccess: (saved) => {
      setPreferencesMemory(saved);
      queryClient.setQueryData(CONTACTS_PREFERENCES_QUERY_KEY, saved);
      void queryClient.invalidateQueries({ queryKey: CONTACTS_PREFERENCES_QUERY_KEY });
    },
  });
}
