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

const WORKSPACE_CACHE_PREFIX = 'mms_ws_lookup_';

export function getCachedWorkspaceLookup(
  subdomain: string | null,
): { status: 200; body: WorkspaceLookupResult } | undefined {
  if (!subdomain || typeof window === 'undefined') return undefined;
  try {
    const raw = localStorage.getItem(`${WORKSPACE_CACHE_PREFIX}${subdomain.toLowerCase()}`);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as WorkspaceLookupResult;
    if (parsed?.workspace?.subdomain) {
      return { status: 200, body: parsed };
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export function cacheWorkspaceLookup(subdomain: string, data: WorkspaceLookupResult): void {
  if (!subdomain || typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${WORKSPACE_CACHE_PREFIX}${subdomain.toLowerCase()}`, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors
  }
}

export function useWorkspaceBySubdomain(subdomain: string | null, enabled: boolean) {
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.workspace.bySubdomain.useQuery({
    queryKey: [...WORKSPACE_BY_SUBDOMAIN_KEY, subdomain],
    queryData: { params: { subdomain: subdomain! } },
    enabled: enabled && Boolean(subdomain),
    staleTime: 60_000,
    initialData: enabled && subdomain ? getCachedWorkspaceLookup(subdomain) : undefined,
    retry: (failureCount: number, error: unknown) =>
      !isWorkspaceNotFoundError(error) && failureCount < 3,
  });
}
