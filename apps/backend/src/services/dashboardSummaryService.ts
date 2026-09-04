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
import { redisGet, redisSet } from '../lib/redis.js';
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
 * read-only transaction with statement timeout safety. The result is cached in
 * Redis (keyed by tenant + date) for a short TTL so repeated dashboard loads
 * within the window skip the 9-way aggregation. The frontend already treats the
 * summary as fresh for 30s, so a 30s server cache adds no additional visible
 * staleness while cutting redundant aggregation work.
 */
const DASHBOARD_SUMMARY_CACHE_TTL_SECONDS = 30;

export async function loadDashboardSummary(
  date?: string,
  _role?: string,
): Promise<DashboardSummaryResponse> {
  const tenant = getRequestTenant();
  if (!tenant) return {};

  const cleanTenant = tenant.trim().toLowerCase();
  const cacheKey = `mms:${cleanTenant}:dashboard:summary:${date ?? 'today'}`;

  const cached = await redisGet(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached) as DashboardSummaryResponse;
    } catch {
      // Corrupt/partial cache entry — recompute below.
    }
  }

  const result = await withTenant(
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

  await redisSet(cacheKey, JSON.stringify(result), DASHBOARD_SUMMARY_CACHE_TTL_SECONDS);
  return result;
}
