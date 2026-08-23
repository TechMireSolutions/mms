import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { PlatformAdminPermissions, PlatformCreateAdminInput, PlatformUserProfile } from '@mms/shared';
import { tsrClient, apiContract } from '@/lib/api';
import { usePlatformAuth } from '@/platform/lib/PlatformAuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { notify } from '@/lib/notify';

export const PLATFORM_ADMINS_QUERY_KEY = ['platform', 'admins'] as const;

/** Hook for super-users to retrieve the list of platform operators. */
export function usePlatformAdmins(): { data: PlatformUserProfile[] | undefined; isLoading: boolean; isError: boolean; refetch: () => Promise<unknown> } {
  const { platformUser } = usePlatformAuth();
  const isSuperUser = platformUser?.role === 'super_user';

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const { data: rawData, ...rest } = tsrClient.platform.listAdmins.useQuery({
    queryKey: PLATFORM_ADMINS_QUERY_KEY,
    queryData: {},
    enabled: isSuperUser,
    staleTime: 60_000,
  });

  const data: PlatformUserProfile[] | undefined = (rawData?.body as any)?.users;

  return { ...rest, data };
}

/** Hook for super-users to create/invite new platform administrators. */
export function useAddPlatformAdmin() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (adminData: PlatformCreateAdminInput) => {
      const res = await apiContract.platform.createAdmin({ body: adminData });
      return res.body as { user: PlatformUserProfile };
    },
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

  return useMutation<
    { user: PlatformUserProfile },
    Error,
    { adminId: string; permissions: PlatformAdminPermissions },
    { previousUsers: PlatformUserProfile[] | undefined }
  >({
    mutationFn: async ({
      adminId,
      permissions,
    }) => {
      const res = await apiContract.platform.updateAdminPermissions({
        params: { adminId },
        body: { permissions },
      });
      return res.body as { user: PlatformUserProfile };
    },
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

  return useMutation<
    { user: PlatformUserProfile },
    Error,
    { adminId: string; disabled: boolean; password: string },
    { previousUsers: PlatformUserProfile[] | undefined }
  >({
    mutationFn: async ({
      adminId,
      disabled,
      password,
    }) => {
      const res = await apiContract.platform.setAdminDisabled({
        params: { adminId },
        body: { disabled, password },
      });
      return res.body as { user: PlatformUserProfile };
    },
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
    }) => {
      const res = await apiContract.platform.deleteAdmin({
        params: { adminId },
        body: { password },
      });
      return res.body as { deleted: true; id: string };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PLATFORM_ADMINS_QUERY_KEY });
      notify.success(t('platform.deleteAdminSuccess'));
    },
  });
}
