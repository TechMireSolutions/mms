import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PlatformAdminPermissions, PlatformCreateAdminInput, PlatformUserProfile } from '@mms/shared';
import { apiJson } from '@/lib/apiClient';
import { usePlatformAuth } from '@/platform/lib/PlatformAuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { notify } from '@/lib/notify';

export const PLATFORM_ADMINS_QUERY_KEY = ['platform', 'admins'] as const;

async function fetchPlatformAdmins(signal?: AbortSignal): Promise<PlatformUserProfile[]> {
  const usersResponse = await apiJson<{ users: PlatformUserProfile[] }>('/api/platform/users', {
    signal,
  });
  return usersResponse.users;
}

/** Hook for super-users to retrieve the list of platform operators. */
export function usePlatformAdmins() {
  const { platformUser } = usePlatformAuth();
  const isSuperUser = platformUser?.role === 'super_user';

  return useQuery({
    queryKey: PLATFORM_ADMINS_QUERY_KEY,
    queryFn: ({ signal }) => fetchPlatformAdmins(signal),
    enabled: isSuperUser,
    staleTime: 60_000,
  });
}

/** Hook for super-users to create/invite new platform administrators. */
export function useAddPlatformAdmin() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (adminData: PlatformCreateAdminInput) =>
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

/** Super-user updates an admin's grantable permissions. */
export function useUpdatePlatformAdminPermissions() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { checkPlatformAuth, platformUser } = usePlatformAuth();

  return useMutation({
    mutationFn: async ({
      adminId,
      permissions,
    }: {
      adminId: string;
      permissions: PlatformAdminPermissions;
    }) =>
      apiJson<{ user: PlatformUserProfile }>(
        `/api/platform/users/${encodeURIComponent(adminId)}/permissions`,
        {
          method: 'PATCH',
          body: JSON.stringify({ permissions }),
        },
      ),
    onMutate: async ({ adminId, permissions }) => {
      await queryClient.cancelQueries({ queryKey: PLATFORM_ADMINS_QUERY_KEY });
      const previousUsers = queryClient.getQueryData<PlatformUserProfile[]>(PLATFORM_ADMINS_QUERY_KEY);

      queryClient.setQueryData<PlatformUserProfile[]>(PLATFORM_ADMINS_QUERY_KEY, (old = []) =>
        old.map((u) => (u.id === adminId ? { ...u, permissions } : u)),
      );

      return { previousUsers };
    },
    onSuccess: async (response) => {
      notify.success(t('platform.adminAccessUpdated'));
      if (platformUser?.id === response.user.id) {
        await checkPlatformAuth();
      }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(PLATFORM_ADMINS_QUERY_KEY, context.previousUsers);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: PLATFORM_ADMINS_QUERY_KEY });
    },
  });
}

/** Soft-disable or re-enable a platform admin (password re-auth). */
export function useSetPlatformAdminDisabled() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async ({
      adminId,
      disabled,
      password,
    }: {
      adminId: string;
      disabled: boolean;
      password: string;
    }) =>
      apiJson<{ user: PlatformUserProfile }>(
        `/api/platform/users/${encodeURIComponent(adminId)}/disabled`,
        {
          method: 'PATCH',
          body: JSON.stringify({ disabled, password }),
        },
      ),
    onMutate: async ({ adminId, disabled }) => {
      await queryClient.cancelQueries({ queryKey: PLATFORM_ADMINS_QUERY_KEY });
      const previousUsers = queryClient.getQueryData<PlatformUserProfile[]>(PLATFORM_ADMINS_QUERY_KEY);

      queryClient.setQueryData<PlatformUserProfile[]>(PLATFORM_ADMINS_QUERY_KEY, (old = []) =>
        old.map((u) => (u.id === adminId ? { ...u, disabled } : u)),
      );

      return { previousUsers };
    },
    onSuccess: (_response, variables) => {
      notify.success(
        t(variables.disabled ? 'platform.disableAdminSuccess' : 'platform.enableAdminSuccess'),
      );
    },
    onError: (_err, _variables, context) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(PLATFORM_ADMINS_QUERY_KEY, context.previousUsers);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: PLATFORM_ADMINS_QUERY_KEY });
    },
  });
}

/** Permanently delete a platform admin (password re-auth). */
export function useDeletePlatformAdmin() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async ({
      adminId,
      password,
    }: {
      adminId: string;
      password: string;
    }) =>
      apiJson<{ deleted: true; id: string }>(
        `/api/platform/users/${encodeURIComponent(adminId)}`,
        {
          method: 'DELETE',
          body: JSON.stringify({ password }),
        },
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PLATFORM_ADMINS_QUERY_KEY });
      notify.success(t('platform.deleteAdminSuccess'));
    },
  });
}
