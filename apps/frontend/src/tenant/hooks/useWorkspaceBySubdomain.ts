import { useQuery } from '@tanstack/react-query';
import type { PublicBranding } from '@mms/shared';
import { apiJson } from '@/lib/apiClient';

export interface PublicWorkspace {
  subdomain: string;
  madrasaName: string;
  tagline?: string;
  enabled?: boolean;
}

export interface WorkspaceLookupResult {
  workspace: PublicWorkspace;
  branding: PublicBranding | null;
}

export const WORKSPACE_BY_SUBDOMAIN_KEY = ['workspace', 'by-subdomain'] as const;

async function fetchWorkspaceBySubdomain(subdomain: string): Promise<WorkspaceLookupResult> {
  const workspaceResponse = await apiJson<{
    workspace: PublicWorkspace;
    branding?: PublicBranding;
  }>(`/api/workspace/by-subdomain/${encodeURIComponent(subdomain)}`);
  if (workspaceResponse.branding) {
    void import('@/lib/db').then(({ cachePublicBranding }) => cachePublicBranding(workspaceResponse.branding!));
  }
  return {
    workspace: workspaceResponse.workspace,
    branding: workspaceResponse.branding ?? null,
  };
}

export function useWorkspaceBySubdomain(subdomain: string | null, enabled: boolean) {
  return useQuery({
    queryKey: [...WORKSPACE_BY_SUBDOMAIN_KEY, subdomain],
    queryFn: () => fetchWorkspaceBySubdomain(subdomain!),
    enabled: enabled && Boolean(subdomain),
    staleTime: 60_000,
    retry: 1,
  });
}
