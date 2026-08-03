import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/contexts/AuthContext';
import { connectTenantDatabaseSocket } from '@/lib/tenantWebSocket';
import { invalidateContactsQueries } from '@/tenant/features/contacts/hooks/invalidateContactsQueries';

/**
 * Subscribes to tenant `/api/ws` and invalidates Query keys for live collection updates.
 * Mount once under TenantScopedProviders when authenticated.
 */
export function useTenantDatabaseUpdates(): void {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) return;

    return connectTenantDatabaseSocket({
      onDatabaseUpdate: (message) => {
        if (message.type === 'collection' && message.key === 'contacts') {
          invalidateContactsQueries(queryClient);
        }
      },
    });
  }, [isAuthenticated, queryClient]);
}
