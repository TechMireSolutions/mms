import { useMemo } from 'react';
import type { ReportCollection } from '@/lib/reports/reportMetadata';
import type { CustomWidget } from '@/lib/reports/pinnedWidgetTypes';
import type { DashboardRole } from '@/lib/dashboardRole';
import { widgetMatchesDashboardRole } from '@/lib/dashboardRole';
import { getRequiredDashboardCollections } from '@/lib/dashboardCollections';
import { useStudentsMetrics, useStudentsWidgetAggregates } from '@/tenant/hooks/collections/students';
import { useTeachersMetrics, useTeachersWidgetAggregates } from '@/tenant/hooks/collections/teachers';
import { useContactsMetrics, useContactsWidgetAggregates } from '@/tenant/hooks/collections/contacts';
import { useSessionsMetrics } from '@/tenant/hooks/collections/sessions';
import { useAttendanceMetrics } from '@/tenant/hooks/collections/attendance';
import { useFinanceMetrics } from '@/tenant/features/finance/hooks/useFinanceMetrics';
import { useHasanatMetrics } from '@/tenant/hooks/collections/hasanat';
import { useQuestionBankMetrics } from '@/tenant/hooks/collections/questionBank';
import { useAccountingMetrics } from '@/tenant/hooks/collections/accounting';
import { todayISO, type StudentsCommandMetricsSnapshot, type TeachersCommandMetricsSnapshot, type ContactsCommandMetricsSnapshot, type SessionsCommandMetricsSnapshot, type AttendanceCommandMetricsSnapshot, type FinanceCommandMetricsSnapshot, type HasanatCommandMetricsSnapshot, type QuestionBankCommandMetricsSnapshot, type AccountingCommandMetricsSnapshot } from '@mms/shared';

export interface DashboardCollectionData {
  studentsTotal: number;
  teachersTotal: number;
  contactsTotal: number;
  studentMetricsInactive: number;
  studentMetricsActive: number;
  studentMetricsNew: number;
  teacherMetricsNew: number;
  contactMetricsNew: number;
  dataVolume: number;
  studentMetrics?: StudentsCommandMetricsSnapshot;
  teacherMetrics?: TeachersCommandMetricsSnapshot;
  contactMetrics?: ContactsCommandMetricsSnapshot;
  sessionsMetrics?: SessionsCommandMetricsSnapshot;
  attendanceMetrics?: AttendanceCommandMetricsSnapshot;
  financeMetrics?: FinanceCommandMetricsSnapshot;
  hasanatMetrics?: HasanatCommandMetricsSnapshot;
  questionBankMetrics?: QuestionBankCommandMetricsSnapshot;
  accountingMetrics?: AccountingCommandMetricsSnapshot;
}

function filterDashboardWidgetsByCollection(
  widgets: CustomWidget[],
  collection: ReportCollection,
  dashboardRole: DashboardRole,
): CustomWidget[] {
  return widgets.filter(
    (widget) =>
      widget.collection === collection &&
      (widget.isPinnedToDashboard || (widget.widgetType === 'card' && widgetMatchesDashboardRole(widget.role, dashboardRole))),
  );
}

/** Loads server metrics for dashboard cards — no full collection dumps for KPI values. */
export function useDashboardData(
  widgets: CustomWidget[],
  dashboardRole: DashboardRole,
): DashboardCollectionData {
  const requiredDashboardCollections = useMemo(
    () => getRequiredDashboardCollections(widgets, dashboardRole),
    [widgets, dashboardRole],
  );

  const requiresCollection = (collection: ReportCollection): boolean =>
    requiredDashboardCollections.has(collection);
  const shouldLoadContacts = requiresCollection('contacts');
  const shouldLoadStudents = requiresCollection('students') || dashboardRole === 'admin';
  const shouldLoadTeachers = requiresCollection('teachers');
  // Role shell needs: teacher banner (sessions), admin/accountant notifications (finance + attendance).
  const shouldLoadSessions =
    requiresCollection('sessions') || dashboardRole === 'teacher';
  const shouldLoadAttendance =
    requiresCollection('attendance_records') ||
    dashboardRole === 'admin' ||
    dashboardRole === 'accountant' ||
    dashboardRole === 'teacher';
  const shouldLoadFinance =
    requiresCollection('finance_invoices') ||
    dashboardRole === 'admin' ||
    dashboardRole === 'accountant';
  const shouldLoadHasanat = requiresCollection('hasanat_distributions');
  const shouldLoadQuestionBank =
    requiresCollection('questions') ||
    requiresCollection('tests') ||
    requiresCollection('assessment_results');
  const shouldLoadAccounting = widgets.some(
    (widget) =>
      (widget.widgetType === 'card' &&
        widgetMatchesDashboardRole(widget.role, dashboardRole) &&
        widget.category === 'accounting') ||
      widget.id.includes('accountant-revenue') ||
      widget.id.includes('accountant-expenses'),
  );

  const contactWidgets = useMemo(
    () => filterDashboardWidgetsByCollection(widgets, 'contacts', dashboardRole),
    [widgets, dashboardRole],
  );
  const studentWidgets = useMemo(
    () => filterDashboardWidgetsByCollection(widgets, 'students', dashboardRole),
    [widgets, dashboardRole],
  );
  const teacherWidgets = useMemo(
    () => filterDashboardWidgetsByCollection(widgets, 'teachers', dashboardRole),
    [widgets, dashboardRole],
  );

  useContactsWidgetAggregates(contactWidgets, { enabled: shouldLoadContacts });
  useStudentsWidgetAggregates(studentWidgets, { enabled: shouldLoadStudents });
  useTeachersWidgetAggregates(teacherWidgets, { enabled: shouldLoadTeachers });

  const { data: studentMetrics } = useStudentsMetrics({ enabled: shouldLoadStudents });
  const { data: teacherMetrics } = useTeachersMetrics({ enabled: shouldLoadTeachers });
  const { data: contactMetrics } = useContactsMetrics({ enabled: shouldLoadContacts });
  const { data: sessionsMetrics } = useSessionsMetrics({ enabled: shouldLoadSessions });
  const { data: attendanceMetrics } = useAttendanceMetrics(todayISO(), { enabled: shouldLoadAttendance });
  const { data: financeMetrics } = useFinanceMetrics({ enabled: shouldLoadFinance });
  const { data: hasanatMetrics } = useHasanatMetrics({ enabled: shouldLoadHasanat });
  const { data: questionBankMetrics } = useQuestionBankMetrics({ enabled: shouldLoadQuestionBank });
  const { data: accountingMetrics } = useAccountingMetrics({ enabled: shouldLoadAccounting });

  const studentsTotal = studentMetrics?.total ?? 0;
  const teachersTotal = teacherMetrics?.total ?? 0;
  const contactsTotal = contactMetrics?.total ?? 0;

  const dataVolume = useMemo(
    () =>
      studentsTotal +
      teachersTotal +
      contactsTotal +
      (sessionsMetrics?.total ?? 0) +
      (financeMetrics?.totalInvoices ?? 0) +
      (attendanceMetrics?.total ?? 0) +
      (hasanatMetrics?.distributed ?? 0),
    [studentsTotal, teachersTotal, contactsTotal, sessionsMetrics, financeMetrics, attendanceMetrics, hasanatMetrics],
  );

  return {
    studentsTotal,
    teachersTotal,
    contactsTotal,
    studentMetricsInactive: studentMetrics?.inactive ?? 0,
    studentMetricsActive: studentMetrics?.active ?? 0,
    studentMetricsNew: studentMetrics?.newThisPeriod ?? 0,
    teacherMetricsNew: teacherMetrics?.newThisPeriod ?? 0,
    contactMetricsNew: contactMetrics?.newThisPeriod ?? 0,
    dataVolume,
    studentMetrics,
    teacherMetrics,
    contactMetrics,
    sessionsMetrics,
    attendanceMetrics,
    financeMetrics,
    hasanatMetrics,
    questionBankMetrics,
    accountingMetrics,
  };
}
