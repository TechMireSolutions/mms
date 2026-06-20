import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PlatformWorkspaceListResponse, PlatformWorkspaceRow } from '@mms/shared';
import { apiJson, isApiError } from '@/lib/apiClient';
import { WORKSPACE_REGISTRY_QUERY_KEY } from '@/hooks/useWorkspaceRegistry';
import { usePlatformAuth } from '@/lib/contexts/PlatformAuthContext';
import useTranslation from '@/hooks/useTranslation';
import { notify } from '@/lib/notify';

export const PLATFORM_WORKSPACES_QUERY_KEY = ['platform', 'workspaces'] as const;

async function fetchPlatformWorkspaces(): Promise<PlatformWorkspaceRow[]> {
  const body = await apiJson<PlatformWorkspaceListResponse>('/api/platform/workspaces');
  return body.workspaces;
}

/** Platform super-user list of all madrasas (includes disabled). */
export function usePlatformWorkspaces() {
  const { isPlatformAuthenticated } = usePlatformAuth();

  return useQuery({
    queryKey: PLATFORM_WORKSPACES_QUERY_KEY,
    queryFn: fetchPlatformWorkspaces,
    enabled: isPlatformAuthenticated,
    staleTime: 15_000,
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
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: PLATFORM_WORKSPACES_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: WORKSPACE_REGISTRY_QUERY_KEY });
      notify.success(
        variables.enabled ? t('platform.workspaceEnabledToast') : t('platform.workspaceDisabledToast'),
        { description: variables.subdomain },
      );
    },
    onError: () => {
      notify.error(t('platform.workspaceToggleFailed'));
    },
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async ({ subdomain, password }: { subdomain: string; password: string }) =>
      apiJson<{ deleted: true; subdomain: string }>(
        `/api/platform/workspaces/${encodeURIComponent(subdomain)}`,
        {
          method: 'DELETE',
          body: JSON.stringify({ password }),
        },
      ),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: PLATFORM_WORKSPACES_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: WORKSPACE_REGISTRY_QUERY_KEY });
      notify.success(t('platform.workspaceDeletedToast'), { description: variables.subdomain });
    },
    onError: (error) => {
      if (isApiError(error) && error.type === 'invalid_current_password') {
        return;
      }
      notify.error(t('platform.workspaceDeleteFailed'));
    },
  });
}
