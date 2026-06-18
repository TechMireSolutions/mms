import { useQuery } from '@tanstack/react-query';
import type { TenantUserProfile } from '@mms/shared';
import { apiJson } from '@/lib/apiClient';

export const TENANT_PROFILE_KEY = ['tenant', 'profile'] as const;

async function fetchTenantProfile(): Promise<TenantUserProfile> {
  const data = await apiJson<{ profile: TenantUserProfile }>('/api/auth/profile');
  return data.profile;
}

export function useTenantProfile(enabled = true) {
  return useQuery({
    queryKey: TENANT_PROFILE_KEY,
    queryFn: fetchTenantProfile,
    enabled,
    staleTime: 30_000,
  });
}
