import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/contexts/AuthContext';
import { connectTenantDatabaseSocket } from '@/lib/tenantWebSocket';
import { invalidateContactsQueries } from '@/tenant/hooks/collections/contacts';
import { invalidateEnrollmentsQueries } from '@/tenant/features/enrollments/hooks/invalidateEnrollmentsQueries';
import { invalidateMessagingQueries } from '@/tenant/features/messaging/hooks/invalidateMessagingQueries';
import { invalidateSessionsQueries } from '@/tenant/features/sessions/hooks/invalidateSessionsQueries';
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
        if (message.key === 'teachers') {
          invalidateTeachersQueries(queryClient);
          return;
        }
        if (message.key === 'sessions') {
          invalidateSessionsQueries(queryClient);
          return;
        }
        if (message.key === 'enrollments') {
          invalidateEnrollmentsQueries(queryClient);
          return;
        }
        if (message.key === 'users' || message.key === 'user_activity_logs') {
          invalidateUsersQueries(queryClient);
          return;
        }
        if (message.key === 'attendance_records') {
          invalidateAttendanceQueries(queryClient);
          return;
        }
        if (message.key === 'finance_invoices' || message.key === 'finance_payments') {
          invalidateFinanceQueries(queryClient);
          return;
        }
        if (
          message.key === 'hasanat_distributions' ||
          message.key === 'hasanat_denoms' ||
          message.key === 'hasanat_batches' ||
          message.key === 'hasanat_redemptions'
        ) {
          invalidateHasanatQueries(queryClient);
          return;
        }
        if (message.key === 'exams' || message.key === 'exam_results') {
          invalidateExaminationsQueries(queryClient);
          return;
        }
        if (message.key === 'questions' || message.key === 'tests' || message.key === 'assessment_results') {
          invalidateQuestionBankQueries(queryClient);
          return;
        }
        if (
          message.key === 'accounting_entries' ||
          message.key === 'accounting_accounts' ||
          message.key === 'accounting_fiscal_years'
        ) {
          invalidateAccountingQueries(queryClient);
          return;
        }
        if (
          message.key === 'obligation_collections' ||
          message.key === 'obligation_types' ||
          message.key === 'mujtahids' ||
          message.key === 'mujtahid_reps' ||
          message.key === 'wakala_types' ||
          message.key === 'obligation_distributions'
        ) {
          invalidateObligationsQueries(queryClient);
          return;
        }
        if (message.key === 'dashboard') {
          invalidateDashboardQueries(queryClient);
          return;
        }
        if (message.key === 'message_logs' || message.key === 'message_templates') {
          invalidateMessagingQueries(queryClient);
        }
      },
    });
  }, [isAuthenticated, queryClient]);
}
