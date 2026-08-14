import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PlatformWorkspaceListResponse, PlatformWorkspaceRow } from '@mms/shared';
import { apiJson, isApiError } from '@/lib/apiClient';
import { WORKSPACE_REGISTRY_QUERY_KEY } from '@/platform/hooks/useWorkspaceRegistry';
import { usePlatformPermissions } from '@/platform/hooks/usePlatformPermissions';
import { useTranslation } from '@/hooks/useTranslation';
import { notify } from '@/lib/notify';
import { getPlatformErrorMessage } from '@/platform/lib/platformAuthErrors';

export const PLATFORM_WORKSPACES_QUERY_KEY = ['platform', 'workspaces'] as const;

async function fetchPlatformWorkspaces(signal?: AbortSignal): Promise<PlatformWorkspaceRow[]> {
  const workspacesResponse = await apiJson<PlatformWorkspaceListResponse>('/api/platform/workspaces', {
    signal,
  });
  return workspacesResponse.workspaces;
}

/** Platform workspace list — super-user or admin with `workspaces` permission. */
export function usePlatformWorkspaces() {
  const { isPlatformAuthenticated, canWorkspaces } = usePlatformPermissions();

  return useQuery({
    queryKey: PLATFORM_WORKSPACES_QUERY_KEY,
    queryFn: ({ signal }) => fetchPlatformWorkspaces(signal),
    enabled: isPlatformAuthenticated && canWorkspaces,
    staleTime: 60_000,
  });
}

export function useSetWorkspaceEnabled() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async ({ subdomain, enabled }: { subdomain: string; enabled: boolean }) =>
      apiJson<{ workspace: PlatformWorkspaceRow }>(
        `/api/platform/workspaces/${encodeURIComponent(subdomain)}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ enabled }),
        },
      ),
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
    onSuccess: (_workspaceMutationResponse, variables) => {
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

  return useMutation({
    mutationFn: async ({
      subdomain,
      password,
      confirmSubdomain,
    }: {
      subdomain: string;
      password: string;
      confirmSubdomain: string;
    }) =>
      apiJson<{ deleted: true; subdomain: string }>(
        `/api/platform/workspaces/${encodeURIComponent(subdomain)}`,
        {
          method: 'DELETE',
          body: JSON.stringify({ password, confirmSubdomain }),
        },
      ),
    onSuccess: (_deleteMutationResponse, variables) => {
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

export function useWorkspaceModules(subdomain: string, open: boolean) {
  const { isPlatformAuthenticated, canWorkspaces } = usePlatformPermissions();

  return useQuery({
    queryKey: ['platform', 'workspace-modules', subdomain],
    queryFn: async ({ signal }) => {
      const response = await apiJson<{ modules: string[] }>(`/api/platform/workspaces/${encodeURIComponent(subdomain)}/modules`, { signal });
      return response.modules;
    },
    enabled: isPlatformAuthenticated && canWorkspaces && open && !!subdomain,
    staleTime: 0,
  });
}

export function useUpdateWorkspaceModules() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async ({ subdomain, modules }: { subdomain: string; modules: string[] }) =>
      apiJson<{ success: true; modules: string[] }>(
        `/api/platform/workspaces/${encodeURIComponent(subdomain)}/modules`,
        {
          method: 'PATCH',
          body: JSON.stringify({ modules }),
        },
      ),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(['platform', 'workspace-modules', variables.subdomain], response.modules);
      notify.success(t('platform.modulesTitle'));
    },
    onError: (error) => {
      notify.error(getPlatformErrorMessage(error, t));
    },
  });
}
