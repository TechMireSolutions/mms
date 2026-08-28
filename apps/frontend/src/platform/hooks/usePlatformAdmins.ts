import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { PlatformAdminPermissions, PlatformCreateAdminInput, PlatformUserProfile } from '@mms/shared';
import { tsrClient, apiContract } from '@/lib/api';
import { apiJson } from '@/lib/apiClient';
import { usePlatformAuth } from '@/platform/lib/PlatformAuthContext';
import { usePlatformPermissions } from '@/platform/hooks/usePlatformPermissions';
import { useTranslation } from '@/hooks/useTranslation';
import { notify } from '@/lib/notify';
import { getPlatformErrorMessage } from '@/platform/lib/platformAuthErrors';

export const PLATFORM_ADMINS_QUERY_KEY = ['platform', 'admins'] as const;

function updateAdminsCache(
  old: unknown,
  adminId: string,
  patch: Partial<PlatformUserProfile>,
): unknown {
  if (!old || typeof old !== 'object') return old;
  const asTsr = old as { body?: { users?: PlatformUserProfile[] } };
  if (asTsr.body && Array.isArray(asTsr.body.users)) {
    return {
      ...asTsr,
      body: {
        ...asTsr.body,
        users: asTsr.body.users.map((u) => (u.id === adminId ? { ...u, ...patch } : u)),
      },
    };
  }
  if (Array.isArray(old)) {
    return (old as PlatformUserProfile[]).map((u) => (u.id === adminId ? { ...u, ...patch } : u));
  }
  return old;
}

/** Hook for super-users to retrieve the list of platform operators. */
export function usePlatformAdmins(): { data: PlatformUserProfile[] | undefined; isLoading: boolean; isError: boolean; refetch: () => Promise<unknown> } {
  const { canAdmins } = usePlatformPermissions();

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const { data: rawData, ...rest } = tsrClient.platform.listAdmins.useQuery({
    queryKey: PLATFORM_ADMINS_QUERY_KEY,
    queryData: {},
    enabled: canAdmins,
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
    onError: (err) => {
      notify.error(getPlatformErrorMessage(err, t));
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
    { previousUsers: unknown }
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
      const previousUsers = queryClient.getQueryData(PLATFORM_ADMINS_QUERY_KEY);

      queryClient.setQueryData(PLATFORM_ADMINS_QUERY_KEY, (old) =>
        updateAdminsCache(old, adminId, { permissions }),
      );

      return { previousUsers };
    },
    onSuccess: async (response) => {
      notify.success(t('platform.adminAccessUpdated'));
      if (platformUser?.id === response.user.id) {
        await checkPlatformAuth();
      }
    },
    onError: (err, _variables, context) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(PLATFORM_ADMINS_QUERY_KEY, context.previousUsers);
      }
      notify.error(getPlatformErrorMessage(err, t));
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
    { previousUsers: unknown }
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
      const previousUsers = queryClient.getQueryData(PLATFORM_ADMINS_QUERY_KEY);

      queryClient.setQueryData(PLATFORM_ADMINS_QUERY_KEY, (old) =>
        updateAdminsCache(old, adminId, { disabledAt: disabled ? new Date().toISOString() : null }),
      );

      return { previousUsers };
    },
    onSuccess: (_response, variables) => {
      notify.success(
        t(variables.disabled ? 'platform.disableAdminSuccess' : 'platform.enableAdminSuccess'),
      );
    },
    onError: (err, _variables, context) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(PLATFORM_ADMINS_QUERY_KEY, context.previousUsers);
      }
      notify.error(getPlatformErrorMessage(err, t));
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
    onError: (err) => {
      notify.error(getPlatformErrorMessage(err, t));
    },
  });
}

/** Super-user manually verifies an admin's email. */
export function useVerifyPlatformAdminEmail() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (adminId: string) => {
      return apiJson<{ user: PlatformUserProfile; success: boolean }>(
        `/api/platform/users/${adminId}/verify-email`,
        { method: 'POST' },
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PLATFORM_ADMINS_QUERY_KEY });
      notify.success(t('users.emailVerifiedSuccess'));
    },
    onError: (err) => {
      notify.error(getPlatformErrorMessage(err, t));
    },
  });
}


