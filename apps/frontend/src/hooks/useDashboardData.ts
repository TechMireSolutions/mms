import { useMemo } from 'react';
import type { ReportCollection } from '@/components/reports/reportMetadata';
import type { CustomWidget } from '@/components/reports/pinnedWidgets/types';
import type { DashboardPersona } from '@/lib/dashboardPersona';
import { widgetMatchesPersona } from '@/lib/dashboardPersona';
import { getRequiredDashboardCollections } from '@/lib/dashboardCollections';
import { useStudentsMetrics, useStudentsWidgetAggregates } from '@/hooks/useStudents';
import { useTeachersMetrics, useTeachersWidgetAggregates } from '@/hooks/useTeachers';
import { useContactsMetrics, useContactsWidgetAggregates } from '@/hooks/useContacts';
import { useAttendanceRecordsCollection } from '@/hooks/useAttendance';
import { useSessionsCollection } from '@/hooks/useSessions';
import { useLiveCollection } from '@/hooks/useLiveCollection';
import type { Invoice } from '@/lib/data/financeData';
import type { Distribution } from '@/lib/data/hasanatData';
import type { QuestionBankQuestion, QuestionBankTest, QuestionBankResult } from '@mms/shared';
import type { Student } from '@/lib/data/studentsData';
import type { Teacher } from '@mms/shared';
import type { Session } from '@/lib/data/sessionsData';
import type { Contact } from '@mms/shared';
import type { AttendanceRecord } from '@/lib/data/attendanceData';

export interface DashboardCollectionData {
  students: Student[];
  studentsTotal: number;
  teachers: Teacher[];
  teachersTotal: number;
  sessions: Session[];
  invoices: Invoice[];
  attendanceRecords: AttendanceRecord[];
  hasanatDistributions: Distribution[];
  denoms: any[];
  contacts: Contact[];
  contactsTotal: number;
  questions: QuestionBankQuestion[];
  tests: QuestionBankTest[];
  assessmentResults: QuestionBankResult[];
  revenueExpenses: { revenue: number; expenses: number }[];
  dataVolume: number;
  studentMetricsInactive: number;
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
  const needsContacts = needs('contacts');
  const needsStudents = needs('students');
  const needsTeachers = needs('teachers');

  const contactWidgets = useMemo(
    () =>
      widgets.filter(
        (widget) =>
          widget.collection === 'contacts' &&
          (widget.isPinnedToDashboard || (widget.widgetType === 'card' && widgetMatchesPersona(widget.role, persona))),
      ),
    [widgets, persona],
  );
  const studentWidgets = useMemo(
    () =>
      widgets.filter(
        (widget) =>
          widget.collection === 'students' &&
          (widget.isPinnedToDashboard || (widget.widgetType === 'card' && widgetMatchesPersona(widget.role, persona))),
      ),
    [widgets, persona],
  );
  const teacherWidgets = useMemo(
    () =>
      widgets.filter(
        (widget) =>
          widget.collection === 'teachers' &&
          (widget.isPinnedToDashboard || (widget.widgetType === 'card' && widgetMatchesPersona(widget.role, persona))),
      ),
    [widgets, persona],
  );

  useContactsWidgetAggregates(contactWidgets, { enabled: needsContacts });
  useStudentsWidgetAggregates(studentWidgets, { enabled: needsStudents });
  useTeachersWidgetAggregates(teacherWidgets, { enabled: needsTeachers });

  const { data: studentMetrics } = useStudentsMetrics({ enabled: needsStudents });
  const studentsTotal = studentMetrics?.total ?? 0;
  const studentMetricsInactive = studentMetrics?.inactive ?? 0;

  const { data: teacherMetrics } = useTeachersMetrics({ enabled: needsTeachers });
  const teachersTotal = teacherMetrics?.total ?? 0;
  const sessions = useSessionsCollection({ enabled: needs('sessions') });
  const invoices = useLiveCollection<Invoice>('finance_invoices', [], {
    enabled: needs('finance_invoices'),
  });
  const attendanceRecords = useAttendanceRecordsCollection({
    enabled: needs('attendance_records'),
  });
  const hasanatDistributions = useLiveCollection<Distribution>(
    'hasanat_distributions',
    [],
    { enabled: needs('hasanat_distributions'),
  });
  const denoms = useLiveCollection<any>('hasanat_denoms', [], {
    enabled: needs('hasanat_distributions'),
  });
  const { data: contactMetrics } = useContactsMetrics({ enabled: needsContacts });
  const contactsTotal = contactMetrics?.total ?? 0;
  const questions = useLiveCollection<QuestionBankQuestion>('questions', [], {
    enabled: needs('questions'),
  });
  const tests = useLiveCollection<QuestionBankTest>('tests', [], { enabled: needs('tests') });
  const assessmentResults = useLiveCollection<QuestionBankResult>('assessment_results', [], {
    enabled: needs('assessment_results'),
  });
  const revenueExpenses = useLiveCollection<{ revenue: number; expenses: number }>(
    'revenue_expenses',
    [],
    { enabled: loadRevenueExpenses },
  );

  const dataVolume = useMemo(
    () =>
      studentsTotal +
      teachersTotal +
      sessions.length +
      invoices.length +
      attendanceRecords.length +
      hasanatDistributions.length +
      contactsTotal,
    [studentsTotal, teachersTotal, sessions, invoices, attendanceRecords, hasanatDistributions, contactsTotal],
  );

  return {
    students: [] as Student[],
    studentsTotal,
    studentMetricsInactive,
    teachers: [] as Teacher[],
    teachersTotal,
    sessions,
    invoices,
    attendanceRecords,
    hasanatDistributions,
    denoms,
    contacts: [] as Contact[],
    contactsTotal,
    questions,
    tests,
    assessmentResults,
    revenueExpenses,
    dataVolume,
  };
}
