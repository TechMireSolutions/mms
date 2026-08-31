import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiContract } from '@/lib/api';
import { ApiError } from '@/lib/apiClient';

export const INSTITUTION_SETUP_STATUS_QUERY_KEY = [
  'auth',
  'institution-setup-status',
] as const;

export async function fetchInstitutionSetupStatus(signal?: AbortSignal): Promise<boolean> {
  const response = await apiContract.auth.institutionSetupStatus({
    fetchOptions: { signal },
  });
  if (response.status !== 200) {
    const body = response.body as { message?: string; type?: string };
    throw new ApiError(
      response.status,
      body?.message ?? `Institution setup status request failed (${response.status})`,
      body?.type,
    );
  }
  return Boolean((response.body as { complete: boolean }).complete);
}

export function useInstitutionSetupStatus(enabled: boolean) {
  return useQuery({
    queryKey: INSTITUTION_SETUP_STATUS_QUERY_KEY,
    queryFn: ({ signal }) => fetchInstitutionSetupStatus(signal),
    enabled,
    staleTime: 0,
    refetchOnMount: 'always',
    retry: 2,
  });
}

export function useMarkInstitutionSetupComplete(): () => void {
  const queryClient = useQueryClient();
  return () => {
    queryClient.setQueryData(INSTITUTION_SETUP_STATUS_QUERY_KEY, true);
  };
}
