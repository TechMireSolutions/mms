import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PlatformWorkspaceRow } from '@mms/shared';
import { apiContract } from '@/lib/api';
import { apiJson, ApiError, isApiError } from '@/lib/apiClient';
import { WORKSPACE_REGISTRY_QUERY_KEY } from '@/platform/hooks/useWorkspaceRegistry';
import { usePlatformPermissions } from '@/platform/hooks/usePlatformPermissions';
import { useTranslation } from '@/hooks/useTranslation';
import { notify } from '@/lib/notify';
import { getPlatformErrorMessage } from '@/platform/lib/platformAuthErrors';
import { updateWorkspacesCache } from './platformWorkspacesCache';

export const PLATFORM_WORKSPACES_QUERY_KEY = ['platform', 'workspaces'] as const;

/** Platform workspace list — super-user or admin with `workspaces` permission. */
export function usePlatformWorkspaces() {
  const { isPlatformAuthenticated, canWorkspaces } = usePlatformPermissions();

  const query = useQuery({
    queryKey: PLATFORM_WORKSPACES_QUERY_KEY,
    queryFn: async ({ signal }) => {
      const res = await apiJson<{ workspaces: PlatformWorkspaceRow[] }>('/api/platform/workspaces', {
        signal,
      });
      return res.workspaces;
    },
    enabled: isPlatformAuthenticated && canWorkspaces,
    staleTime: 60_000,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}

export function useSetWorkspaceEnabled() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<
    { workspace: PlatformWorkspaceRow },
    Error,
    { subdomain: string; enabled: boolean },
    { previousData: unknown }
  >({
    mutationFn: async ({ subdomain, enabled }) => {
      const res = await apiContract.platform.patchWorkspace({
        params: { subdomain },
        body: { enabled },
      });
      if (res.status >= 400) {
        const errorBody = res.body as { message?: string; type?: string } | undefined;
        throw new ApiError(
          res.status,
          errorBody?.message || t('platform.workspaceToggleFailed'),
          errorBody?.type,
        );
      }
      return res.body as { workspace: PlatformWorkspaceRow };
    },
    onMutate: async ({ subdomain, enabled }) => {
      await queryClient.cancelQueries({ queryKey: PLATFORM_WORKSPACES_QUERY_KEY });
      const previousData = queryClient.getQueryData(PLATFORM_WORKSPACES_QUERY_KEY);

      queryClient.setQueryData(PLATFORM_WORKSPACES_QUERY_KEY, (old) =>
        updateWorkspacesCache(old, subdomain, { enabled }),
      );

      return { previousData };
    },
    onSuccess: (_res, variables) => {
      notify.success(
        variables.enabled ? t('platform.workspaceEnabledToast') : t('platform.workspaceDisabledToast'),
        { description: variables.subdomain },
      );
    },
    onError: (error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(PLATFORM_WORKSPACES_QUERY_KEY, context.previousData);
      }
      notify.error(getPlatformErrorMessage(error, t, undefined, 'platform.workspaceToggleFailed'));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: PLATFORM_WORKSPACES_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: WORKSPACE_REGISTRY_QUERY_KEY });
    },
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<
    { deleted: true; subdomain: string },
    Error,
    { subdomain: string; password: string; confirmSubdomain: string }
  >({
    mutationFn: async ({
      subdomain,
      password,
      confirmSubdomain,
    }: {
      subdomain: string;
      password: string;
      confirmSubdomain: string;
    }) => {
      const res = await apiContract.platform.deleteWorkspace({
        params: { subdomain },
        body: { password, confirmSubdomain },
      });
      if (res.status >= 400) {
        const errorBody = res.body as { message?: string; type?: string } | undefined;
        throw new ApiError(
          res.status,
          errorBody?.message || t('platform.loadFailed'),
          errorBody?.type,
        );
      }
      return res.body as { deleted: true; subdomain: string };
    },
    onSuccess: (_res, variables) => {
      void queryClient.invalidateQueries({ queryKey: PLATFORM_WORKSPACES_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: WORKSPACE_REGISTRY_QUERY_KEY });
      notify.success(t('platform.workspaceDeletedToast'), { description: variables.subdomain });
    },
    onError: (error) => {
      if (isApiError(error) && error.type === 'invalid_current_password') {
        return;
      }
      notify.error(getPlatformErrorMessage(error, t, undefined, 'platform.loadFailed'));
    },
  });
}

export { useWorkspaceModules, useUpdateWorkspaceModules } from './usePlatformWorkspaceModules';

export function useSetWorkspaceEmailVerification() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<
    { success: true; subdomain: string; requireEmailVerification: boolean },
    Error,
    { subdomain: string; requireEmailVerification: boolean },
    { previousData: unknown }
  >({
    mutationFn: async ({ subdomain, requireEmailVerification }) => {
      const res = await apiContract.platform.patchWorkspaceEmailVerification({
        params: { subdomain },
        body: { requireEmailVerification },
      });
      if (res.status >= 400) {
        const errorBody = res.body as { message?: string; type?: string } | undefined;
        throw new ApiError(
          res.status,
          errorBody?.message || t('platform.emailVerificationToggleFailed'),
          errorBody?.type,
        );
      }
      return res.body as { success: true; subdomain: string; requireEmailVerification: boolean };
    },
    onMutate: async ({ subdomain, requireEmailVerification }) => {
      await queryClient.cancelQueries({ queryKey: PLATFORM_WORKSPACES_QUERY_KEY });
      const previousData = queryClient.getQueryData(PLATFORM_WORKSPACES_QUERY_KEY);

      queryClient.setQueryData(PLATFORM_WORKSPACES_QUERY_KEY, (old) =>
        updateWorkspacesCache(old, subdomain, { requireEmailVerification }),
      );

      return { previousData };
    },
    onSuccess: (_res, variables) => {
      notify.success(
        variables.requireEmailVerification
          ? t('platform.emailVerificationRequiredToast')
          : t('platform.emailVerificationOptionalToast'),
        { description: variables.subdomain },
      );
    },
    onError: (error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(PLATFORM_WORKSPACES_QUERY_KEY, context.previousData);
      }
      notify.error(getPlatformErrorMessage(error, t, undefined, 'platform.emailVerificationToggleFailed'));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: PLATFORM_WORKSPACES_QUERY_KEY });
    },
  });
}

export { useResetWorkspaceAdminPassword, useCreateWorkspaceAdmin } from './usePlatformWorkspaceAdminMutations';
