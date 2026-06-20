import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PlatformUserProfile } from '@mms/shared';
import { apiJson } from '@/lib/apiClient';
import { usePlatformAuth } from '@/platform/lib/PlatformAuthContext';

export const PLATFORM_PROFILE_QUERY_KEY = ['platform', 'profile'] as const;

async function fetchPlatformProfile(): Promise<PlatformUserProfile> {
  const data = await apiJson<{ user: PlatformUserProfile }>('/api/platform/auth/me');
  return data.user;
}

/** Full platform super-user profile (extends session user with timestamps). */
export function usePlatformProfile(options?: { enabled?: boolean }) {
  const { isPlatformAuthenticated } = usePlatformAuth();

  return useQuery({
    queryKey: PLATFORM_PROFILE_QUERY_KEY,
    queryFn: fetchPlatformProfile,
    enabled: (options?.enabled ?? true) && isPlatformAuthenticated,
    staleTime: 60_000,
  });
}

export function useUpdatePlatformProfileName() {
  const queryClient = useQueryClient();
  const { checkPlatformAuth } = usePlatformAuth();

  return useMutation({
    mutationFn: async (name: string) => {
      const data = await apiJson<{ user: PlatformUserProfile }>('/api/platform/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({ name: name.trim() }),
      });
      return data.user;
    },
    onSuccess: async (user) => {
      queryClient.setQueryData(PLATFORM_PROFILE_QUERY_KEY, user);
      await checkPlatformAuth();
    },
  });
}
