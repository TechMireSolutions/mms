import { useQuery } from '@tanstack/react-query';
import { resolveAppDomainForRequest } from '@mms/shared';
import { apiJson } from '@/lib/apiClient';
import { env } from '@/lib/config/env';

export const DEPLOYMENT_CONFIG_KEY = ['public', 'deployment-config'] as const;

async function fetchDeploymentAppDomain(): Promise<string> {
  const data = await apiJson<{ appDomain: string }>('/api/public/deployment-config');
  return data.appDomain;
}

/**
 * Server-authoritative apex domain — applies the same self-correction as the backend
 * when MMS_APP_DOMAIN / VITE_APP_DOMAIN is shorter than the platform hostname.
 */
export function useDeploymentAppDomain(): string {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const fallback = resolveAppDomainForRequest(hostname, env.appDomain);

  const { data } = useQuery({
    queryKey: DEPLOYMENT_CONFIG_KEY,
    queryFn: fetchDeploymentAppDomain,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  return data ?? fallback;
}
