import { useMemo } from 'react';
import type { ReportCollection } from '@/components/reports/reportMetadata';
import type { CustomWidget } from '@/components/reports/pinnedWidgets/types';
import type { DashboardPersona } from '@/lib/dashboardPersona';
import { getRequiredDashboardCollections } from '@/lib/dashboardCollections';
import { useStudentsCollection } from '@/hooks/useStudents';
import { useTeachersCollection } from '@/hooks/useTeachers';
import { useContactsCollection } from '@/hooks/useContacts';
import { useAttendanceRecordsCollection } from '@/hooks/useAttendance';
import { useSessionsCollection } from '@/hooks/useSessions';
import { useLiveCollection } from '@/hooks/useLiveCollection';
import { INVOICES, type Invoice } from '@/lib/data/financeData';
import { DISTRIBUTIONS, type Distribution } from '@/lib/data/hasanatData';
import type { QuestionBankQuestion, QuestionBankTest, QuestionBankResult } from '@mms/shared';
import { QUESTIONS, TESTS, RESULTS } from '@/lib/data/questionBankData';
import { revenueData as defaultRevenueData } from '@/lib/data/dashboardData';
import type { Student } from '@/lib/data/studentsData';
import type { Teacher } from '@mms/shared';
import type { Session } from '@/lib/data/sessionsData';
import type { Contact } from '@mms/shared';
import type { AttendanceRecord } from '@/lib/data/attendanceData';

export interface DashboardCollectionData {
  students: Student[];
  teachers: Teacher[];
  sessions: Session[];
  invoices: Invoice[];
  attendanceRecords: AttendanceRecord[];
  hasanatDistributions: Distribution[];
  contacts: Contact[];
  questions: QuestionBankQuestion[];
  tests: QuestionBankTest[];
  assessmentResults: QuestionBankResult[];
  revenueExpenses: { revenue: number; expenses: number }[];
  dataVolume: number;
}

function needsRevenueExpenses(widgets: CustomWidget[]): boolean {
  return widgets.some((w) => w.isPinnedToDashboard && w.widgetType === 'revenue-expenses');
}

/** Loads only collections referenced by dashboard cards and pinned widgets. */
export function useDashboardData(
  widgets: CustomWidget[],
  persona: DashboardPersona,
): DashboardCollectionData {
  const required = useMemo(
    () => getRequiredDashboardCollections(widgets, persona),
    [widgets, persona],
  );

  const needs = (collection: ReportCollection): boolean => required.has(collection);
  const loadRevenueExpenses = needsRevenueExpenses(widgets);

  const students = useStudentsCollection({ enabled: needs('students') });
  const teachers = useTeachersCollection({ enabled: needs('teachers') });
  const sessions = useSessionsCollection({ enabled: needs('sessions') });
  const invoices = useLiveCollection<Invoice>('finance_invoices', INVOICES, {
    enabled: needs('finance_invoices'),
  });
  const attendanceRecords = useAttendanceRecordsCollection({
    enabled: needs('attendance_records'),
  });
  const hasanatDistributions = useLiveCollection<Distribution>(
    'hasanat_distributions',
    DISTRIBUTIONS,
    { enabled: needs('hasanat_distributions') },
  );
  const contacts = useContactsCollection({ enabled: needs('contacts') });
  const questions = useLiveCollection<QuestionBankQuestion>('questions', QUESTIONS, {
    enabled: needs('questions'),
  });
  const tests = useLiveCollection<QuestionBankTest>('tests', TESTS, { enabled: needs('tests') });
  const assessmentResults = useLiveCollection<QuestionBankResult>('assessment_results', RESULTS, {
    enabled: needs('assessment_results'),
  });
  const revenueExpenses = useLiveCollection<{ revenue: number; expenses: number }>(
    'revenue_expenses',
    defaultRevenueData,
    { enabled: loadRevenueExpenses },
  );

  const dataVolume = useMemo(
    () =>
      students.length +
      sessions.length +
      invoices.length +
      attendanceRecords.length +
      hasanatDistributions.length +
      contacts.length,
    [students, sessions, invoices, attendanceRecords, hasanatDistributions, contacts],
  );

  return {
    students,
    teachers,
    sessions,
    invoices,
    attendanceRecords,
    hasanatDistributions,
    contacts,
    questions,
    tests,
    assessmentResults,
    revenueExpenses,
    dataVolume,
  };
}
