import { useQuery } from '@tanstack/react-query';
import type { Contact, QuestionBankQuestion, QuestionBankResult, QuestionBankTest, Teacher } from '@mms/shared';
import { useAuth } from '@/lib/contexts/AuthContext';
import type { AttendanceRecord } from '@/lib/data/attendanceData';
import type { Invoice } from '@/lib/data/financeData';
import type { Denomination, Distribution } from '@/lib/data/hasanatData';
import type { Session } from '@/lib/data/sessionsData';
import type { Student } from '@/lib/data/studentsData';
import { useAttendanceRecordsCollection } from '@/tenant/hooks/collections/attendance';
import { useContactsCollection } from '@/tenant/hooks/collections/contacts';
import { useFinanceInvoicesCollection } from '@/tenant/hooks/collections/finance';
import {
  useHasanatDenomsCollection,
  useHasanatDistributionsCollection,
} from '@/tenant/hooks/collections/hasanat';
import {
  useQuestionBankQuestionsCollection,
  useQuestionBankResultsCollection,
  useQuestionBankTestsCollection,
} from '@/tenant/hooks/collections/questionBank';
import { useSessionsCollection } from '@/tenant/hooks/collections/sessions';
import {
  fetchAllStudentsForQuery,
  STUDENTS_QUERY_KEY,
  type StudentRecord,
} from '@/tenant/hooks/collections/students';
import {
  fetchAllTeachersForQuery,
  TEACHERS_QUERY_KEY,
} from '@/tenant/hooks/collections/teachers';
import type { ReportCollection } from '@/lib/reports/reportMetadata';

export type ReportCollectionsSnapshot = {
  students: Student[];
  teachers: Teacher[];
  sessions: Session[];
  finance_invoices: Invoice[];
  attendance_records: AttendanceRecord[];
  hasanat_distributions: Distribution[];
  hasanat_denoms: Denomination[];
  contacts: Contact[];
  questions: QuestionBankQuestion[];
  tests: QuestionBankTest[];
  assessment_results: QuestionBankResult[];
};

/**
 * Live Query-backed collections for dashboard widgets / report builders.
 * Prefer this over sync `getWidgetCollections()` + localStorage.
 * Pass `requiredCollections` to fetch only the collections pinned widgets need.
 */
export function useWidgetCollections(options?: {
  enabled?: boolean;
  requiredCollections?: ReadonlySet<ReportCollection> | readonly ReportCollection[];
}): ReportCollectionsSnapshot {
  const enabled = options?.enabled ?? true;
  const { isAuthenticated } = useAuth();
  const queryEnabled = isAuthenticated && enabled;
  const required = options?.requiredCollections
    ? new Set(options.requiredCollections)
    : null;
  const needs = (collection: ReportCollection): boolean =>
    queryEnabled && (required === null || required.has(collection));

  const contacts = useContactsCollection({ enabled: needs('contacts') });
  const sessions = useSessionsCollection({ enabled: needs('sessions') });
  const financeInvoices = useFinanceInvoicesCollection({ enabled: needs('finance_invoices') });
  const attendanceRecords = useAttendanceRecordsCollection({ enabled: needs('attendance_records') });
  const hasanatDistributions = useHasanatDistributionsCollection({
    enabled: needs('hasanat_distributions'),
  });
  const hasanatDenoms = useHasanatDenomsCollection({
    enabled: needs('hasanat_distributions'),
  });
  const questions = useQuestionBankQuestionsCollection({ enabled: needs('questions') });
  const tests = useQuestionBankTestsCollection({ enabled: needs('tests') });
  const assessmentResults = useQuestionBankResultsCollection({
    enabled: needs('assessment_results'),
  });

  const studentsQuery = useQuery({
    queryKey: [...STUDENTS_QUERY_KEY, 'report-all'] as const,
    queryFn: () => fetchAllStudentsForQuery({}),
    enabled: needs('students'),
    staleTime: 30_000,
  });

  const teachersQuery = useQuery({
    queryKey: [...TEACHERS_QUERY_KEY, 'report-all'] as const,
    queryFn: () => fetchAllTeachersForQuery({}),
    enabled: needs('teachers'),
    staleTime: 30_000,
  });

  return {
    students: (studentsQuery.data ?? []) as unknown as Student[],
    teachers: (teachersQuery.data ?? []) as Teacher[],
    sessions,
    finance_invoices: financeInvoices,
    attendance_records: attendanceRecords,
    hasanat_distributions: hasanatDistributions,
    hasanat_denoms: hasanatDenoms,
    contacts,
    questions,
    tests,
    assessment_results: assessmentResults,
  };
}

/**
 * Query-backed rows for a single report collection key (chart visualizer).
 * Only the active collection (+ hasanat denoms when needed) is fetched.
 */
export function useReportCollectionRows(
  collectionKey: ReportCollection | string,
): {
  rows: Record<string, unknown>[];
  denominations: Denomination[];
} {
  const { isAuthenticated } = useAuth();
  const key = collectionKey;

  const contacts = useContactsCollection({ enabled: isAuthenticated && key === 'contacts' });
  const sessions = useSessionsCollection({ enabled: isAuthenticated && key === 'sessions' });
  const financeInvoices = useFinanceInvoicesCollection({
    enabled: isAuthenticated && key === 'finance_invoices',
  });
  const attendanceRecords = useAttendanceRecordsCollection({
    enabled: isAuthenticated && key === 'attendance_records',
  });
  const hasanatDistributions = useHasanatDistributionsCollection({
    enabled: isAuthenticated && key === 'hasanat_distributions',
  });
  const hasanatDenoms = useHasanatDenomsCollection({
    enabled: isAuthenticated && key === 'hasanat_distributions',
  });
  const questions = useQuestionBankQuestionsCollection({
    enabled: isAuthenticated && key === 'questions',
  });
  const tests = useQuestionBankTestsCollection({ enabled: isAuthenticated && key === 'tests' });
  const assessmentResults = useQuestionBankResultsCollection({
    enabled: isAuthenticated && key === 'assessment_results',
  });

  const studentsQuery = useQuery({
    queryKey: [...STUDENTS_QUERY_KEY, 'report-all'] as const,
    queryFn: () => fetchAllStudentsForQuery({}),
    enabled: isAuthenticated && key === 'students',
    staleTime: 30_000,
  });

  const teachersQuery = useQuery({
    queryKey: [...TEACHERS_QUERY_KEY, 'report-all'] as const,
    queryFn: () => fetchAllTeachersForQuery({}),
    enabled: isAuthenticated && key === 'teachers',
    staleTime: 30_000,
  });

  let rows: Record<string, unknown>[] = [];
  switch (key) {
    case 'contacts':
      rows = contacts as unknown as Record<string, unknown>[];
      break;
    case 'students':
      rows = (studentsQuery.data ?? []) as unknown as Record<string, unknown>[];
      break;
    case 'teachers':
      rows = (teachersQuery.data ?? []) as unknown as Record<string, unknown>[];
      break;
    case 'sessions':
      rows = sessions as unknown as Record<string, unknown>[];
      break;
    case 'finance_invoices':
      rows = financeInvoices as unknown as Record<string, unknown>[];
      break;
    case 'attendance_records':
      rows = attendanceRecords as unknown as Record<string, unknown>[];
      break;
    case 'hasanat_distributions':
      rows = hasanatDistributions as unknown as Record<string, unknown>[];
      break;
    case 'questions':
      rows = questions as unknown as Record<string, unknown>[];
      break;
    case 'tests':
      rows = tests as unknown as Record<string, unknown>[];
      break;
    case 'assessment_results':
      rows = assessmentResults as unknown as Record<string, unknown>[];
      break;
    default:
      rows = [];
  }

  return { rows, denominations: hasanatDenoms };
}

export type { StudentRecord };
