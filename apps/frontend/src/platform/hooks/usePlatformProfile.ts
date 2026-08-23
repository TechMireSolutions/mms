import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { PlatformUserProfile } from '@mms/shared';
import { tsrClient, apiContract } from '@/lib/api';
import { usePlatformAuth } from '@/platform/lib/PlatformAuthContext';

export const PLATFORM_PROFILE_QUERY_KEY = ['platform', 'profile'] as const;

/** Full platform super-user profile (extends session user with timestamps). */
export function usePlatformProfile(options?: { enabled?: boolean }) {
  const { isPlatformAuthenticated } = usePlatformAuth();

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const { data: rawData, ...rest } = tsrClient.platform.getMe.useQuery({
    queryKey: PLATFORM_PROFILE_QUERY_KEY,
    queryData: {},
    enabled: (options?.enabled ?? true) && isPlatformAuthenticated,
    staleTime: 60_000,
  });

  const data: PlatformUserProfile | undefined = (rawData?.body as any)?.user;

  return { ...rest, data };
}

export function useUpdatePlatformProfileName() {
  const queryClient = useQueryClient();
  const { checkPlatformAuth } = usePlatformAuth();

  return useMutation({
    mutationFn: async (name: string) => {
      const res = await apiContract.platform.patchMe({ body: { name: name.trim() } });
      return (res.body as any)?.user as PlatformUserProfile;
    },
    onSuccess: async (user) => {
      queryClient.setQueryData(PLATFORM_PROFILE_QUERY_KEY, user);
      await checkPlatformAuth();
    },
  });
}

export function useUpdatePlatformPassword() {
  return useMutation({
    mutationFn: async ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) => {
      const res = await apiContract.platform.changePassword({ body: { currentPassword, newPassword } });
      return res.body as { success: boolean };
    },
  });
}

