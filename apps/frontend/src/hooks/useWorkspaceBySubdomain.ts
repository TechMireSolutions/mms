import { useQuery } from '@tanstack/react-query';
import type { PublicBranding } from '@mms/shared';
import { apiJson } from '@/lib/apiClient';
import { cachePublicBranding } from '@/lib/db';

export interface PublicWorkspace {
  subdomain: string;
  madrasaName: string;
  tagline?: string;
  enabled?: boolean;
}

export const WORKSPACE_BY_SUBDOMAIN_KEY = ['workspace', 'by-subdomain'] as const;

async function fetchWorkspaceBySubdomain(subdomain: string): Promise<PublicWorkspace> {
  const data = await apiJson<{
    workspace: PublicWorkspace;
    branding?: PublicBranding;
  }>(`/api/workspace/by-subdomain/${encodeURIComponent(subdomain)}`);
  if (data.branding) {
    cachePublicBranding(data.branding);
  }
  return data.workspace;
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
