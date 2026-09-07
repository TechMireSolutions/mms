import type { QueryClient } from '@tanstack/react-query';
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

/**
 * Dynamically loaded dispatcher for live WebSocket collection invalidations.
 * Kept in an isolated chunk so the WebSocket listener hook does not statically
 * bundle all 15 module query invalidators into the initial entry path.
 */
export function invalidateModuleQueries(queryClient: QueryClient, key: string): void {
  // Invalidate composite dashboard summary metrics when domain collections change
  if (key !== 'dashboard' && key !== 'user_activity_logs' && key !== 'message_logs' && key !== 'message_templates') {
    void queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
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
