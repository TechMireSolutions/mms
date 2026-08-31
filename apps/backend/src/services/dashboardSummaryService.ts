import type {
  StudentsCommandMetricsSnapshot,
  TeachersCommandMetricsSnapshot,
  ContactsCommandMetricsSnapshot,
  SessionsCommandMetricsSnapshot,
  AttendanceCommandMetricsSnapshot,
  FinanceCommandMetricsSnapshot,
  HasanatCommandMetricsSnapshot,
  QuestionBankCommandMetricsSnapshot,
  AccountingCommandMetricsSnapshot,
} from '@mms/shared';
import { getRequestTenant } from '../lib/tenantContext.js';
import { withTenant } from '../db/tenant-context.js';
import { studentUseCases } from '../students/use-cases/studentUseCases.js';
import { teacherUseCases } from '../teachers/use-cases/teacherUseCases.js';
import { contactUseCases } from '../contacts/use-cases/contactUseCases.js';
import { loadSessionsCommandMetrics } from './sessionService.js';
import { aggregateAttendanceCommandMetrics } from '../db/repositories/attendanceRepositoryList.js';
import { loadFinanceCommandMetrics } from './financeService.js';
import { loadHasanatCommandMetrics } from './hasanatService.js';
import { loadAccountingCommandMetrics } from './accountingService.js';
import { loadQuestionBankCommandMetrics } from './questionBankMetricsService.js';

export interface DashboardSummaryResponse {
  students?: StudentsCommandMetricsSnapshot;
  teachers?: TeachersCommandMetricsSnapshot;
  contacts?: ContactsCommandMetricsSnapshot;
  sessions?: SessionsCommandMetricsSnapshot;
  attendance?: AttendanceCommandMetricsSnapshot;
  finance?: FinanceCommandMetricsSnapshot;
  hasanat?: HasanatCommandMetricsSnapshot;
  questionBank?: QuestionBankCommandMetricsSnapshot;
  accounting?: AccountingCommandMetricsSnapshot;
}

/**
 * Aggregates high-frequency command metrics across tenant domains in a single
 * read-only transaction with statement timeout safety.
 */
export async function loadDashboardSummary(
  date?: string,
  _role?: string,
): Promise<DashboardSummaryResponse> {
  const tenant = getRequestTenant();
  if (!tenant) return {};

  const cleanTenant = tenant.trim().toLowerCase();

  return withTenant(
    cleanTenant,
    async () => {
      const [
        students,
        teachers,
        contacts,
        sessions,
        attendance,
        finance,
        hasanat,
        questionBank,
        accounting,
      ] = await Promise.all([
        studentUseCases.loadStudentsCommandMetrics(),
        teacherUseCases.loadTeachersCommandMetrics(),
        contactUseCases.loadContactsCommandMetrics(),
        loadSessionsCommandMetrics(),
        aggregateAttendanceCommandMetrics(cleanTenant, { selectedDate: date }),
        loadFinanceCommandMetrics(),
        loadHasanatCommandMetrics(),
        loadQuestionBankCommandMetrics(),
        loadAccountingCommandMetrics(),
      ]);

      return {
        students,
        teachers,
        contacts,
        sessions,
        attendance,
        finance,
        hasanat,
        questionBank,
        accounting,
      };
    },
    { readOnly: true, statementTimeoutMs: 10000 },
  );
}
