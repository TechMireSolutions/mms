import { useQuery } from '@tanstack/react-query';
import type { TenantUserProfile } from '@mms/shared';
import { apiJson } from '@/lib/apiClient';
import { useAuth } from '@/lib/contexts/AuthContext';

export const TENANT_PROFILE_KEY = ['tenant', 'profile'] as const;

async function fetchTenantProfile(): Promise<TenantUserProfile> {
  const profileResponse = await apiJson<{ profile: TenantUserProfile }>('/api/auth/profile');
  return profileResponse.profile;
}

export function useTenantProfile(enabled = true) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: TENANT_PROFILE_KEY,
    queryFn: fetchTenantProfile,
    enabled: isAuthenticated && enabled,
    staleTime: 30_000,
  });
}
