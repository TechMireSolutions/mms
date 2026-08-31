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
import { isSeededDashboardWidget } from '@/lib/dashboardWidgets';
import { useStudentsMetrics, useStudentsWidgetAggregates } from '@/tenant/hooks/collections/students';
import { useTeachersMetrics, useTeachersWidgetAggregates } from '@/tenant/hooks/collections/teachers';
import { useContactsMetrics, useContactsWidgetAggregates } from '@/tenant/hooks/collections/contacts';
import { useSessionsMetrics, useSessionsWidgetAggregates } from '@/tenant/hooks/collections/sessions';
import { useAttendanceMetrics } from '@/tenant/hooks/collections/attendance';
import { useFinanceMetrics } from '@/tenant/hooks/collections/finance';
import { useHasanatMetrics } from '@/tenant/hooks/collections/hasanat';
import { useQuestionBankMetrics } from '@/tenant/hooks/collections/questionBank';
import { useAccountingMetrics } from '@/tenant/hooks/collections/accounting';
import { useDashboardSummaryQuery } from '@/tenant/hooks/collections/dashboard';

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
  isLoading?: boolean;
}

function needsWidgetAggregate(widget: CustomWidget): boolean {
  return widget.widgetType !== 'card' || !isSeededDashboardWidget(widget.id);
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
      contacts: filterDashboardWidgetsByCollection(widgets, 'contacts', dashboardRole).filter(needsWidgetAggregate),
      students: filterDashboardWidgetsByCollection(widgets, 'students', dashboardRole).filter(needsWidgetAggregate),
      teachers: filterDashboardWidgetsByCollection(widgets, 'teachers', dashboardRole).filter(needsWidgetAggregate),
      sessions: filterDashboardWidgetsByCollection(widgets, 'sessions', dashboardRole).filter(needsWidgetAggregate),
    }),
    [widgets, dashboardRole],
  );

  useContactsWidgetAggregates(collectionWidgets.contacts, { enabled: shouldLoadContacts });
  useStudentsWidgetAggregates(collectionWidgets.students, { enabled: shouldLoadStudents });
  useTeachersWidgetAggregates(collectionWidgets.teachers, { enabled: shouldLoadTeachers });
  useSessionsWidgetAggregates(collectionWidgets.sessions, { enabled: shouldLoadSessions });

  const { summary, isLoading, isPending } = useDashboardSummaryQuery(todayISO(), dashboardRole);

  const { data: individualStudentMetrics } = useStudentsMetrics({ enabled: shouldLoadStudents && !summary?.students });
  const { data: individualTeacherMetrics } = useTeachersMetrics({ enabled: shouldLoadTeachers && !summary?.teachers });
  const { data: individualContactMetrics } = useContactsMetrics({ enabled: shouldLoadContacts && !summary?.contacts });
  const { data: individualSessionsMetrics } = useSessionsMetrics({ enabled: shouldLoadSessions && !summary?.sessions });
  const { data: individualAttendanceMetrics } = useAttendanceMetrics(todayISO(), { enabled: shouldLoadAttendance && !summary?.attendance });
  const { data: individualFinanceMetrics } = useFinanceMetrics({ enabled: shouldLoadFinance && !summary?.finance });
  const { data: individualHasanatMetrics } = useHasanatMetrics({ enabled: shouldLoadHasanat && !summary?.hasanat });
  const { data: individualQuestionBankMetrics } = useQuestionBankMetrics({ enabled: shouldLoadQuestionBank && !summary?.questionBank });
  const { data: individualAccountingMetrics } = useAccountingMetrics({ enabled: shouldLoadAccounting && !summary?.accounting });

  const studentMetrics = (summary?.students as StudentsCommandMetricsSnapshot | undefined) ?? individualStudentMetrics;
  const teacherMetrics = (summary?.teachers as TeachersCommandMetricsSnapshot | undefined) ?? individualTeacherMetrics;
  const contactMetrics = (summary?.contacts as ContactsCommandMetricsSnapshot | undefined) ?? individualContactMetrics;
  const sessionsMetrics = (summary?.sessions as SessionsCommandMetricsSnapshot | undefined) ?? individualSessionsMetrics;
  const attendanceMetrics = (summary?.attendance as AttendanceCommandMetricsSnapshot | undefined) ?? individualAttendanceMetrics;
  const financeMetrics = (summary?.finance as FinanceCommandMetricsSnapshot | undefined) ?? individualFinanceMetrics;
  const hasanatMetrics = (summary?.hasanat as HasanatCommandMetricsSnapshot | undefined) ?? individualHasanatMetrics;
  const questionBankMetrics = (summary?.questionBank as QuestionBankCommandMetricsSnapshot | undefined) ?? individualQuestionBankMetrics;
  const accountingMetrics = (summary?.accounting as AccountingCommandMetricsSnapshot | undefined) ?? individualAccountingMetrics;

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
    isLoading: isLoading || isPending,
  };
}
