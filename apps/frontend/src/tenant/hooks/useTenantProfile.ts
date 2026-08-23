import { tsrClient } from '@/lib/api';
import { useAuth } from '@/lib/contexts/AuthContext';

export const TENANT_PROFILE_KEY = ['tenant', 'profile'] as const;

export function useTenantProfile(enabled = true) {
  const { isAuthenticated } = useAuth();
  
  // @ts-expect-error - TS union discrimination limit with ts-rest
  return tsrClient.profile.getProfile.useQuery({
    queryKey: TENANT_PROFILE_KEY,
    enabled: isAuthenticated && enabled,
    staleTime: 30_000,
    select: (data: any) => data.body.profile,
  });
}
