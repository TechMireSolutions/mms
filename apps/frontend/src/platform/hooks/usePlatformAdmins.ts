import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PlatformUserProfile } from '@mms/shared';
import { apiJson } from '@/lib/apiClient';
import { usePlatformAuth } from '@/platform/lib/PlatformAuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { notify } from '@/lib/notify';

export const PLATFORM_ADMINS_QUERY_KEY = ['platform', 'admins'] as const;

async function fetchPlatformAdmins(): Promise<PlatformUserProfile[]> {
  const usersResponse = await apiJson<{ users: PlatformUserProfile[] }>('/api/platform/users');
  return usersResponse.users;
}

/** Hook for super-users to retrieve the list of platform operators. */
export function usePlatformAdmins() {
  const { platformUser } = usePlatformAuth();
  const isSuperUser = platformUser?.role === 'super_user';

  return useQuery({
    queryKey: PLATFORM_ADMINS_QUERY_KEY,
    queryFn: fetchPlatformAdmins,
    enabled: isSuperUser,
    staleTime: 60_000,
  });
}

/** Hook for super-users to create/invite new platform administrators. */
export function useAddPlatformAdmin() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (adminData: Record<string, string>) =>
      apiJson<{ user: PlatformUserProfile }>('/api/platform/users', {
        method: 'POST',
        body: JSON.stringify(adminData),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PLATFORM_ADMINS_QUERY_KEY });
      notify.success(t('platform.addAdminSuccess'));
    },
  });
}
