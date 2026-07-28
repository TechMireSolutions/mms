import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ContactGoogleSyncConfigClient, GoogleContactsSyncRunResult } from '@mms/shared';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiFetch, apiJson } from '@/lib/apiClient';
import { CONTACTS_API, CONTACTS_GOOGLE_SYNC_QUERY_KEY } from '@/tenant/features/contacts/hooks/contactsQueryKeys';

export function useContactGoogleSyncConfig() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: CONTACTS_GOOGLE_SYNC_QUERY_KEY,
    queryFn: async () => {
      const googleSyncResponse = await apiJson<{ config: ContactGoogleSyncConfigClient }>(`${CONTACTS_API}/google-sync`);
      return googleSyncResponse.config;
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function useContactGoogleSyncMutations() {
  const queryClient = useQueryClient();
  const saveConfig = useMutation({
    mutationFn: async (config: ContactGoogleSyncConfigClient) =>
      apiJson<{ config: ContactGoogleSyncConfigClient }>(`${CONTACTS_API}/google-sync`, {
        method: 'PUT',
        body: JSON.stringify(config),
      }),
    onSuccess: (configResponse) => {
      queryClient.setQueryData(CONTACTS_GOOGLE_SYNC_QUERY_KEY, configResponse.config);
    },
  });
  const clearConfig = useMutation({
    mutationFn: async () => apiFetch(`${CONTACTS_API}/google-sync`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.setQueryData(CONTACTS_GOOGLE_SYNC_QUERY_KEY, {});
    },
  });
  const logSyncAudit = useMutation({
    mutationFn: async (auditPayload: {
      action: 'credentials_saved' | 'oauth_connected' | 'sync_complete' | 'disconnected';
      imported?: number;
      total?: number;
      skipped?: number;
    }) =>
      apiJson<{ success: boolean }>(`${CONTACTS_API}/google-sync/audit`, {
        method: 'POST',
        body: JSON.stringify(auditPayload),
      }),
  });
  const exchangeOAuth = useMutation({
    mutationFn: async (oauthPayload: { code: string; redirectUri: string }) =>
      apiJson<{ config: ContactGoogleSyncConfigClient }>(`${CONTACTS_API}/google-sync/exchange`, {
        method: 'POST',
        body: JSON.stringify(oauthPayload),
      }),
    onSuccess: (configResponse) => {
      queryClient.setQueryData(CONTACTS_GOOGLE_SYNC_QUERY_KEY, configResponse.config);
    },
  });
  const runGoogleSync = useMutation({
    mutationFn: async () =>
      apiJson<GoogleContactsSyncRunResult>(`${CONTACTS_API}/google-sync/run`, {
        method: 'POST',
      }),
  });
  return { saveConfig, clearConfig, logSyncAudit, exchangeOAuth, runGoogleSync };
}
