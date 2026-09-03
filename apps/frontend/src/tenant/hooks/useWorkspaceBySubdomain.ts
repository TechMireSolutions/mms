import { tsrClient } from '@/lib/api';
import type { PublicBranding } from '@mms/shared';

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

/** True when the workspace-by-subdomain API confirms the tenant does not exist. */
export function isWorkspaceNotFoundError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'status' in error && error.status === 404;
}

export function useWorkspaceBySubdomain(subdomain: string | null, enabled: boolean) {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.workspace.bySubdomain.useQuery({
    queryKey: [...WORKSPACE_BY_SUBDOMAIN_KEY, subdomain],
    queryData: { params: { subdomain: subdomain! } },
    enabled: enabled && Boolean(subdomain),
    staleTime: 60_000,
    retry: (failureCount: number, error: unknown) =>
      !isWorkspaceNotFoundError(error) && failureCount < 3,
  });
}
