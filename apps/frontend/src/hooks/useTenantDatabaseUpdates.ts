import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/contexts/AuthContext';
import { connectTenantDatabaseSocket } from '@/lib/tenantWebSocket';
import type { BackgroundJobEventMessage } from '@mms/shared';
import {
  patchLocalBackgroundJobOnly,
  upsertLocalBackgroundJob,
} from '@/lib/backgroundJobs/backgroundJobStore';
import { fetchBackgroundJob } from '@/lib/backgroundJobs/pollBackgroundJob';

/**
 * Subscribes to tenant `/api/ws` and invalidates Query keys for live collection updates.
 * Also handles job-progress/completed/failed events from the BullMQ worker pipeline,
 * updating the local job store and triggering collection invalidations on completion.
 * Mount once under TenantScopedProviders when authenticated.
 */
export function useTenantDatabaseUpdates(): void {
  const { isAuthenticated, authChecked } = useAuth();
  const queryClient = useQueryClient();

  const handleInvalidate = useCallback((key: string) => {
    void import('@/lib/tenant/invalidateModuleQueries')
      .then(({ invalidateModuleQueries }) => {
        invalidateModuleQueries(queryClient, key);
      })
      .catch((err) => {
        console.error('Failed to dispatch module query invalidation:', err);
      });
  }, [queryClient]);

  useEffect(() => {
    if (!isAuthenticated || !authChecked) return;

    return connectTenantDatabaseSocket({
      onDatabaseUpdate: (message) => {
        if (message.type !== 'collection') return;
        handleInvalidate(message.key);
      },

      onJobEvent: (message: BackgroundJobEventMessage) => {
        // Optimistically patch local job state to avoid hammering the backend on rapid progress events
        const patched = patchLocalBackgroundJobOnly(message.jobId, {
          status: message.event === 'job-progress' ? 'running' : message.event === 'job-failed' ? 'failed' : 'completed',
          progress: message.progress,
          hasDownload: message.hasDownload,
          error: message.error,
          completedAt: message.completedAt,
        });

        // Only fetch if missing locally or if it's the final event (to ensure we don't miss final DB state)
        if (!patched || message.event !== 'job-progress') {
          void fetchBackgroundJob(message.jobId).then((job) => {
            if (job) upsertLocalBackgroundJob(job);
          });
        }

        // On completion, invalidate the relevant module collection so directory
        // refreshes automatically (e.g. after a CSV import or bulk operation).
        if (message.event === 'job-completed' && message.moduleId) {
          handleInvalidate(message.moduleId);
        }
      },
    });
  }, [authChecked, handleInvalidate, isAuthenticated]);
}
