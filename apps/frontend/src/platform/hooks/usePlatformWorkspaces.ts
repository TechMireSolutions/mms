import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { PlatformWorkspaceRow } from '@mms/shared';
import { tsrClient, apiContract } from '@/lib/api';
import { isApiError } from '@/lib/apiClient';
import { WORKSPACE_REGISTRY_QUERY_KEY } from '@/platform/hooks/useWorkspaceRegistry';
import { usePlatformPermissions } from '@/platform/hooks/usePlatformPermissions';
import { useTranslation } from '@/hooks/useTranslation';
import { notify } from '@/lib/notify';
import { getPlatformErrorMessage } from '@/platform/lib/platformAuthErrors';

export const PLATFORM_WORKSPACES_QUERY_KEY = ['platform', 'workspaces'] as const;

/** Platform workspace list — super-user or admin with `workspaces` permission. */
export function usePlatformWorkspaces(): { data: PlatformWorkspaceRow[] | undefined; isLoading: boolean; isError: boolean; isFetching: boolean; refetch: () => Promise<unknown> } {
  const { isPlatformAuthenticated, canWorkspaces } = usePlatformPermissions();

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const { data: rawData, ...rest } = tsrClient.platform.listWorkspaces.useQuery({
    queryKey: PLATFORM_WORKSPACES_QUERY_KEY,
    queryData: {},
    enabled: isPlatformAuthenticated && canWorkspaces,
    staleTime: 60_000,
  });

  const data: PlatformWorkspaceRow[] | undefined = (rawData?.body as any)?.workspaces;

  return { ...rest, data };
}

export function useSetWorkspaceEnabled() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<
    { workspace: PlatformWorkspaceRow },
    Error,
    { subdomain: string; enabled: boolean },
    { previousWorkspaces: PlatformWorkspaceRow[] | undefined }
  >({
    mutationFn: async ({ subdomain, enabled }) => {
      const res = await apiContract.platform.patchWorkspace({
        params: { subdomain: encodeURIComponent(subdomain) },
        body: { enabled },
      });
      return res.body as { workspace: PlatformWorkspaceRow };
    },
    onMutate: async ({ subdomain, enabled }) => {
      await queryClient.cancelQueries({ queryKey: PLATFORM_WORKSPACES_QUERY_KEY });
      const previousWorkspaces = queryClient.getQueryData<PlatformWorkspaceRow[]>(
        PLATFORM_WORKSPACES_QUERY_KEY,
      );

      queryClient.setQueryData<PlatformWorkspaceRow[]>(PLATFORM_WORKSPACES_QUERY_KEY, (old = []) =>
        old.map((w) => (w.subdomain === subdomain ? { ...w, enabled } : w)),
      );

      return { previousWorkspaces };
    },
    onSuccess: (_res, variables) => {
      notify.success(
        variables.enabled ? t('platform.workspaceEnabledToast') : t('platform.workspaceDisabledToast'),
        { description: variables.subdomain },
      );
    },
    onError: (_error, _variables, context) => {
      if (context?.previousWorkspaces) {
        queryClient.setQueryData(PLATFORM_WORKSPACES_QUERY_KEY, context.previousWorkspaces);
      }
      notify.error(t('platform.workspaceToggleFailed'));
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
        params: { subdomain: encodeURIComponent(subdomain) },
        body: { password, confirmSubdomain },
      });
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
      notify.error(getPlatformErrorMessage(error, t));
    },
  });
}

export function useWorkspaceModules(subdomain: string, open: boolean): { data: string[] | undefined; isLoading: boolean; isError: boolean } {
  const { isPlatformAuthenticated, canWorkspaces } = usePlatformPermissions();

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const { data: rawData, ...rest } = tsrClient.platform.getWorkspaceModules.useQuery({
    queryKey: ['platform', 'workspace-modules', subdomain],
    queryData: { params: { subdomain: encodeURIComponent(subdomain) } },
    enabled: isPlatformAuthenticated && canWorkspaces && open && !!subdomain,
    staleTime: 0,
  });

  const data: string[] | undefined = (rawData?.body as any)?.modules;

  return { ...rest, data };
}

export function useUpdateWorkspaceModules() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<
    { success: true; modules: string[] },
    Error,
    { subdomain: string; modules: string[] }
  >({
    mutationFn: async ({ subdomain, modules }) => {
      const res = await apiContract.platform.updateWorkspaceModules({
        params: { subdomain: encodeURIComponent(subdomain) },
        body: { modules },
      });
      return res.body as { success: true; modules: string[] };
    },
    onSuccess: (response, variables) => {
      queryClient.setQueryData(['platform', 'workspace-modules', variables.subdomain], response.modules);
      notify.success(t('platform.modulesTitle'));
    },
    onError: (error) => {
      notify.error(getPlatformErrorMessage(error, t));
    },
  });
}

export function useSetWorkspaceEmailVerification() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<
    { success: true; subdomain: string; requireEmailVerification: boolean },
    Error,
    { subdomain: string; requireEmailVerification: boolean },
    { previousWorkspaces: PlatformWorkspaceRow[] | undefined }
  >({
    mutationFn: async ({ subdomain, requireEmailVerification }) => {
      const res = await apiContract.platform.patchWorkspaceEmailVerification({
        params: { subdomain: encodeURIComponent(subdomain) },
        body: { requireEmailVerification },
      });
      return res.body as { success: true; subdomain: string; requireEmailVerification: boolean };
    },
    onMutate: async ({ subdomain, requireEmailVerification }) => {
      await queryClient.cancelQueries({ queryKey: PLATFORM_WORKSPACES_QUERY_KEY });
      const previousWorkspaces = queryClient.getQueryData<PlatformWorkspaceRow[]>(
        PLATFORM_WORKSPACES_QUERY_KEY,
      );

      queryClient.setQueryData<PlatformWorkspaceRow[]>(PLATFORM_WORKSPACES_QUERY_KEY, (old = []) =>
        old.map((w) => (w.subdomain === subdomain ? { ...w, requireEmailVerification } : w)),
      );

      return { previousWorkspaces };
    },
    onSuccess: (_res, variables) => {
      notify.success(
        variables.requireEmailVerification
          ? t('platform.emailVerificationRequiredToast')
          : t('platform.emailVerificationOptionalToast'),
        { description: variables.subdomain },
      );
    },
    onError: (_error, _variables, context) => {
      if (context?.previousWorkspaces) {
        queryClient.setQueryData(PLATFORM_WORKSPACES_QUERY_KEY, context.previousWorkspaces);
      }
      notify.error(t('platform.emailVerificationToggleFailed'));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: PLATFORM_WORKSPACES_QUERY_KEY });
    },
  });
}
