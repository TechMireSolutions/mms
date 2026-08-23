import { resolveAppDomainForRequest } from '@mms/shared';
import { env } from '@/lib/config/env';
import { tsrClient } from '@/lib/api';

export const DEPLOYMENT_CONFIG_KEY = ['public', 'deployment-config'] as const;



/**
 * Server-authoritative apex domain — applies the same self-correction as the backend
 * when MMS_APP_DOMAIN / VITE_APP_DOMAIN is shorter than the platform hostname.
 */
export function useDeploymentAppDomain(): string {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const fallback = resolveAppDomainForRequest(hostname, env.appDomain);

  // @ts-expect-error - TS union discrimination limit with ts-rest
  const { data: deploymentConfig } = tsrClient.public.deploymentConfig.useQuery({
    queryKey: DEPLOYMENT_CONFIG_KEY,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  return deploymentConfig?.appDomain ?? fallback;
}
