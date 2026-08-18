import { useMemo } from 'react';
import type { CustomWidget } from '@/lib/reports/pinnedWidgetTypes';
import {
  isDashboardAdmin,
  isDashboardAdminOrAccountant,
  isDashboardTeacher,
  type DashboardRole,
} from '@/lib/dashboardRole';
import {
  getRequiredDashboardCollections,
  filterDashboardWidgetsByCollection,
  isWidgetActiveForDashboard,
  DASHBOARD_ACCOUNTING_WIDGET_IDS,
} from '@/lib/dashboardCollections';
import { useStudentsMetrics, useStudentsWidgetAggregates } from '@/tenant/hooks/collections/students';
import { useTeachersMetrics, useTeachersWidgetAggregates } from '@/tenant/hooks/collections/teachers';
import { useContactsMetrics, useContactsWidgetAggregates } from '@/tenant/hooks/collections/contacts';
import { useSessionsMetrics, useSessionsWidgetAggregates } from '@/tenant/hooks/collections/sessions';
import { useAttendanceMetrics } from '@/tenant/hooks/collections/attendance';
import { useFinanceMetrics } from '@/tenant/hooks/collections/finance';
import { useHasanatMetrics } from '@/tenant/hooks/collections/hasanat';
import { useQuestionBankMetrics } from '@/tenant/hooks/collections/questionBank';
import { useAccountingMetrics } from '@/tenant/hooks/collections/accounting';
import {
  todayISO,
  ACCOUNTING_MODULE_MANIFEST,
  type StudentsCommandMetricsSnapshot,
  type TeachersCommandMetricsSnapshot,
  type ContactsCommandMetricsSnapshot,
  type SessionsCommandMetricsSnapshot,
  type AttendanceCommandMetricsSnapshot,
  type FinanceCommandMetricsSnapshot,
  type HasanatCommandMetricsSnapshot,
  type QuestionBankCommandMetricsSnapshot,
  type AccountingCommandMetricsSnapshot,
} from '@mms/shared';

export interface DashboardCollectionData {
  studentsTotal: number;
  teachersTotal: number;
  contactsTotal: number;
  sessionsTotal: number;
  studentMetricsInactive: number;
  studentMetricsActive: number;
  studentMetricsNew: number;
  teacherMetricsNew: number;
  contactMetricsNew: number;
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

/** Loads server metrics for dashboard cards — no full collection dumps for KPI values. */
export function useDashboardData(
  widgets: CustomWidget[],
  dashboardRole: DashboardRole,
): DashboardCollectionData {
  const requiredDashboardCollections = useMemo(
    () => getRequiredDashboardCollections(widgets, dashboardRole),
    [widgets, dashboardRole],
  );

  const shouldLoadContacts = requiredDashboardCollections.has('contacts');
  const shouldLoadStudents = requiredDashboardCollections.has('students') || isDashboardAdmin(dashboardRole);
  const shouldLoadTeachers = requiredDashboardCollections.has('teachers');
  // Role shell needs: teacher banner (sessions), admin/accountant notifications (finance + attendance).
  const shouldLoadSessions =
    requiredDashboardCollections.has('sessions') || isDashboardTeacher(dashboardRole);
  const shouldLoadAttendance =
    requiredDashboardCollections.has('attendance_records') ||
    isDashboardAdminOrAccountant(dashboardRole) ||
    isDashboardTeacher(dashboardRole);

  const shouldLoadFinance =
    requiredDashboardCollections.has('finance_invoices') || isDashboardAdminOrAccountant(dashboardRole);
  const shouldLoadHasanat = requiredDashboardCollections.has('hasanat_distributions');
  const shouldLoadQuestionBank =
    requiredDashboardCollections.has('questions') ||
    requiredDashboardCollections.has('tests') ||
    requiredDashboardCollections.has('assessment_results');
  const shouldLoadAccounting = useMemo(
    () =>
      widgets.some(
        (widget) =>
          isWidgetActiveForDashboard(widget, dashboardRole) &&
          (widget.category === ACCOUNTING_MODULE_MANIFEST.moduleId || DASHBOARD_ACCOUNTING_WIDGET_IDS.has(widget.id)),
      ),
    [widgets, dashboardRole],
  );

  const collectionWidgets = useMemo(
    () => ({
      contacts: filterDashboardWidgetsByCollection(widgets, 'contacts', dashboardRole),
      students: filterDashboardWidgetsByCollection(widgets, 'students', dashboardRole),
      teachers: filterDashboardWidgetsByCollection(widgets, 'teachers', dashboardRole),
      sessions: filterDashboardWidgetsByCollection(widgets, 'sessions', dashboardRole),
    }),
    [widgets, dashboardRole],
  );

  useContactsWidgetAggregates(collectionWidgets.contacts, { enabled: shouldLoadContacts });
  useStudentsWidgetAggregates(collectionWidgets.students, { enabled: shouldLoadStudents });
  useTeachersWidgetAggregates(collectionWidgets.teachers, { enabled: shouldLoadTeachers });
  useSessionsWidgetAggregates(collectionWidgets.sessions, { enabled: shouldLoadSessions });

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
  const sessionsTotal = sessionsMetrics?.total ?? 0;

  return {
    studentsTotal,
    teachersTotal,
    contactsTotal,
    sessionsTotal,
    studentMetricsInactive: studentMetrics?.inactive ?? 0,
    studentMetricsActive: studentMetrics?.active ?? 0,
    studentMetricsNew: studentMetrics?.newThisPeriod ?? 0,
    teacherMetricsNew: teacherMetrics?.newThisPeriod ?? 0,
    contactMetricsNew: contactMetrics?.newThisPeriod ?? 0,
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
