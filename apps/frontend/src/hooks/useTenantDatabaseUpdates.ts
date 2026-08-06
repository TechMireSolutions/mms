import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/contexts/AuthContext';
import { connectTenantDatabaseSocket } from '@/lib/tenantWebSocket';
import { invalidateContactsQueries } from '@/tenant/features/contacts/hooks/invalidateContactsQueries';
import { invalidateMessagingQueries } from '@/tenant/features/messaging/hooks/invalidateMessagingQueries';
import { invalidateStudentsQueries } from '@/tenant/features/students/hooks/invalidateStudentsQueries';

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
        if (message.type !== 'collection') return;
        if (message.key === 'contacts') {
          invalidateContactsQueries(queryClient);
          return;
        }
        if (message.key === 'students') {
          invalidateStudentsQueries(queryClient);
          return;
        }
        if (message.key === 'message_logs' || message.key === 'message_templates') {
          invalidateMessagingQueries(queryClient);
        }
      },
    });
  }, [isAuthenticated, queryClient]);
}
