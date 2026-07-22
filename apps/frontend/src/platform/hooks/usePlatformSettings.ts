import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PlatformSettings, PlatformSettingsUpdateInput } from '@mms/shared';
import { apiJson } from '@/lib/apiClient';
import { usePlatformAuth } from '@/platform/lib/PlatformAuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { notify } from '@/lib/notify';

export const PLATFORM_SETTINGS_QUERY_KEY = ['platform', 'settings'] as const;

async function fetchPlatformSettings(): Promise<PlatformSettings> {
  const response = await apiJson<{ settings: PlatformSettings }>('/api/platform/settings');
  return response.settings;
}

/** Hook for platform super-users to retrieve platform global settings. */
export function usePlatformSettings() {
  const { platformUser, isPlatformAuthenticated } = usePlatformAuth();

  return useQuery({
    queryKey: PLATFORM_SETTINGS_QUERY_KEY,
    queryFn: fetchPlatformSettings,
    enabled: isPlatformAuthenticated && platformUser?.role === 'super_user',
    staleTime: 60_000,
  });
}

/** Hook for platform super-users to update platform settings. */
export function useUpdatePlatformSettings() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (input: PlatformSettingsUpdateInput) =>
      apiJson<{ settings: PlatformSettings; success: boolean }>('/api/platform/settings', {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
    onSuccess: (response) => {
      queryClient.setQueryData(PLATFORM_SETTINGS_QUERY_KEY, response.settings);
      notify.success(t('platform.settingsUpdateSuccess'));
    },
  });
}

/** Hook for platform super-users to reset and re-seed the entire database. */
export function useResetPlatformDatabase() {
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (confirm: string) =>
      apiJson<{ success: boolean; message: string }>('/api/platform/settings/reset-database', {
        method: 'POST',
        body: JSON.stringify({ confirm }),
      }),
    onSuccess: () => {
      notify.success(t('platform.profileDestroyDatabaseSuccess'));
    },
  });
}
