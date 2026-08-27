import { useEffect } from 'react';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/contexts/AuthContext';
import { connectTenantDatabaseSocket } from '@/lib/tenantWebSocket';
import type { BackgroundJobEventMessage } from '@mms/shared';
import {
  patchLocalBackgroundJobOnly,
  upsertLocalBackgroundJob,
} from '@/lib/backgroundJobs/backgroundJobStore';
import { fetchBackgroundJob } from '@/lib/backgroundJobs/pollBackgroundJob';
import { invalidateContactsQueries } from '@/tenant/hooks/collections/contacts';
import { invalidateEnrollmentsQueries } from '@/tenant/hooks/collections/enrollments';
import { invalidateMessagingQueries } from '@/tenant/hooks/collections/messaging';
import { invalidateSessionsQueries } from '@/tenant/hooks/collections/sessions';
import { invalidateStudentsQueries } from '@/tenant/hooks/collections/students';
import { invalidateTeachersQueries } from '@/tenant/hooks/collections/teachers';
import { invalidateUsersQueries } from '@/tenant/hooks/collections/users';
import { invalidateAttendanceQueries } from '@/tenant/hooks/collections/attendance';
import { invalidateFinanceQueries } from '@/tenant/hooks/collections/finance';
import { invalidateHasanatQueries } from '@/tenant/hooks/collections/hasanat';
import { invalidateExaminationsQueries } from '@/tenant/hooks/collections/examinations';
import { invalidateQuestionBankQueries } from '@/tenant/hooks/collections/questionBank';
import { invalidateAccountingQueries } from '@/tenant/hooks/collections/accounting';
import { invalidateObligationsQueries } from '@/tenant/hooks/collections/obligations';
import { invalidateDashboardQueries } from '@/tenant/hooks/collections/dashboard';

function invalidateModuleQueries(queryClient: QueryClient, key: string) {
  // Invalidate composite dashboard summary metrics when domain collections change
  if (key !== 'dashboard' && key !== 'user_activity_logs' && key !== 'message_logs' && key !== 'message_templates') {
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
  }

  switch (key) {
    case 'contacts': return invalidateContactsQueries(queryClient);
    case 'students': return invalidateStudentsQueries(queryClient);
    case 'teachers': return invalidateTeachersQueries(queryClient);
    case 'sessions': return invalidateSessionsQueries(queryClient);
    case 'enrollments': return invalidateEnrollmentsQueries(queryClient);
    case 'users':
    case 'user_activity_logs': return invalidateUsersQueries(queryClient);
    case 'attendance':
    case 'attendance_records': return invalidateAttendanceQueries(queryClient);
    case 'finance':
    case 'finance_invoices':
    case 'finance_payments': return invalidateFinanceQueries(queryClient);
    case 'hasanat':
    case 'hasanat_distributions':
    case 'hasanat_denoms':
    case 'hasanat_batches':
    case 'hasanat_redemptions': return invalidateHasanatQueries(queryClient);
    case 'examinations':
    case 'exams':
    case 'exam_results': return invalidateExaminationsQueries(queryClient);
    case 'questionBank':
    case 'questions':
    case 'tests':
    case 'assessment_results': return invalidateQuestionBankQueries(queryClient);
    case 'accounting':
    case 'accounting_entries':
    case 'accounting_accounts':
    case 'accounting_fiscal_years': return invalidateAccountingQueries(queryClient);
    case 'obligations':
    case 'obligation_collections':
    case 'obligation_types':
    case 'mujtahids':
    case 'mujtahid_reps':
    case 'wakala_types':
    case 'obligation_distributions': return invalidateObligationsQueries(queryClient);
    case 'dashboard': return invalidateDashboardQueries(queryClient);
    case 'messaging':
    case 'message_logs':
    case 'message_templates': return invalidateMessagingQueries(queryClient);
  }
}


/**
 * Subscribes to tenant `/api/ws` and invalidates Query keys for live collection updates.
 * Also handles job-progress/completed/failed events from the BullMQ worker pipeline,
 * updating the local job store and triggering collection invalidations on completion.
 * Mount once under TenantScopedProviders when authenticated.
 */
export function useTenantDatabaseUpdates(): void {
  const { isAuthenticated, authChecked } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated || !authChecked) return;

    return connectTenantDatabaseSocket({
      onDatabaseUpdate: (message) => {
        if (message.type !== 'collection') return;
        invalidateModuleQueries(queryClient, message.key);
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
          invalidateModuleQueries(queryClient, message.moduleId);
        }
      },
    });
  }, [isAuthenticated, queryClient]);
}
