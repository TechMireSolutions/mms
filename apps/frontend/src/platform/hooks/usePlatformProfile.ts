import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { PlatformUserProfile } from '@mms/shared';
import { tsrClient, apiContract } from '@/lib/api';
import { usePlatformAuth } from '@/platform/lib/PlatformAuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { notify } from '@/lib/notify';
import { getPlatformErrorMessage } from '@/platform/lib/platformAuthErrors';

export const PLATFORM_PROFILE_QUERY_KEY = ['platform', 'profile'] as const;

function updateProfileCache(old: unknown, user: PlatformUserProfile): unknown {
  if (!old || typeof old !== 'object') return old;
  const asTsr = old as { body?: { user?: PlatformUserProfile } };
  if (asTsr.body && typeof asTsr.body === 'object') {
    return {
      ...asTsr,
      body: {
        ...asTsr.body,
        user,
      },
    };
  }
  return user;
}

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
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (name: string) => {
      const res = await apiContract.platform.patchMe({ body: { name: name.trim() } });
      return (res.body as any)?.user as PlatformUserProfile;
    },
    onSuccess: async (user) => {
      queryClient.setQueryData(PLATFORM_PROFILE_QUERY_KEY, (old) =>
        updateProfileCache(old, user),
      );
      await checkPlatformAuth();
    },
    onError: (err) => {
      notify.error(getPlatformErrorMessage(err, t));
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


