import { useQuery } from '@tanstack/react-query';
import type { PublicBranding } from '@mms/shared';
import { apiJson } from '@/lib/apiClient';

export const PUBLIC_BRANDING_QUERY_KEY = ['workspace', 'public-branding'] as const;

async function fetchPublicBranding(): Promise<PublicBranding | null> {
  const brandingResponse = await apiJson<{ branding?: PublicBranding }>('/api/workspace/public-branding');
  if (brandingResponse.branding) {
    void import('@/lib/db').then(({ cachePublicBranding }) => cachePublicBranding(brandingResponse.branding!));
    return brandingResponse.branding;
  }
  return null;
}

export function usePublicBranding(enabled: boolean) {
  return useQuery({
    queryKey: PUBLIC_BRANDING_QUERY_KEY,
    queryFn: fetchPublicBranding,
    enabled,
    staleTime: 60_000,
    retry: 1,
  });
}
