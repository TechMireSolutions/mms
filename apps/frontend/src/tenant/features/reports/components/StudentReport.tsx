import { useMemo, useState } from 'react';
import { SubTabBar, type SubTab as UINavTab } from '@/components/ui/SubTabBar';
import { Users, UserCheck, UserX, TrendingUp } from 'lucide-react';
import { STUDENTS_MODULE_MANIFEST } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useEnrollmentsCollection } from '@/tenant/hooks/collections/enrollments';
import {
  useStudentsMetrics,
  useStudentsPaginated,
  useStudentsWidgetAggregates,
} from '@/tenant/hooks/collections/students';
import { StatCard } from '@/components/ui/StatCard';
import { ExportToolbar } from '@/components/ui/ExportToolbar';
import { ListPagination } from '@/components/ui/ListPagination';
import { studentStatusBadgeConfig } from '@/lib/students/studentStatusUi';
import { SEMANTIC_BADGE } from '@/lib/semanticTone';
import { StudentReportDashboardWidgets } from './StudentReportDashboardWidgets';
import { StudentReportFilterBanner } from './StudentReportFilterBanner';
import { StudentReportTables } from './StudentReportTables';
import type { Student } from '@mms/shared';
import {
  mapStudentRow,
  type EnrollmentHistoryItem,
  type ReportStudent,
  type StudentReportProps,
  type StudentReportSubTab,
} from './studentReportTypes';
import { formatDate } from '@mms/shared';
import type { StatusBadgeConfigItem } from '@/components/ui/StatusBadge';

export type { EnrollmentHistoryItem, ReportStudent, StudentReportFilters, StudentReportProps } from './studentReportTypes';

export default function StudentReport({ filters }: StudentReportProps): React.JSX.Element {
  const { t } = useTranslation();
  const [activeSubTab, setActiveSubTab] = useState<StudentReportSubTab>('list');
  const statusBadgeConfig = useMemo(() => studentStatusBadgeConfig(t), [t]);
  const enrollmentStatusConfig = useMemo<Record<string, StatusBadgeConfigItem>>(() => ({
    pending: { label: t('enrollments.status.pending'), cls: SEMANTIC_BADGE.warning },
    confirmed: { label: t('enrollments.status.confirmed'), cls: SEMANTIC_BADGE.success },
    cancelled: { label: t('enrollments.status.cancelled'), cls: SEMANTIC_BADGE.destructive },
    completed: { label: t('enrollments.status.completed'), cls: SEMANTIC_BADGE.info },
  }), [t]);

  const REPORT_TABS = useMemo<readonly UINavTab<StudentReportSubTab>[]>(
    () => [
      { key: 'list', label: t('students.report.studentListTab') },
      { key: 'history', label: t('students.report.enrollmentHistoryTab') },
    ],
    [t],
  );
  const [listPage, setListPage] = useState(1);
  const [reportStatusFilter, setReportStatusFilter] = useState<string | null>(null);

  const { data: metrics } = useStudentsMetrics();
  const { data: genderAggregates } = useStudentsWidgetAggregates([
    { id: 'male', collection: 'students', operation: 'count', filterField: 'gender', filterOperator: 'equals', filterValue: 'male' },
    { id: 'female', collection: 'students', operation: 'count', filterField: 'gender', filterOperator: 'equals', filterValue: 'female' },
  ]);

  const { data: studentsPage } = useStudentsPaginated({
    page: listPage,
    limit: STUDENTS_MODULE_MANIFEST.defaultPageSize,
    search: filters.student || undefined,
    status: reportStatusFilter || (filters.status !== 'all' ? filters.status : undefined),
  });

  const enrollmentRecords = useEnrollmentsCollection();

  const students = useMemo<ReportStudent[]>(() => {
    const studentRows = (studentsPage?.students ?? []) as unknown as Student[];
    let filteredStudents = studentRows.map(mapStudentRow);
    if (filters.class && filters.class !== 'all') {
      filteredStudents = filteredStudents.filter((student) => student.class === filters.class);
    }
    return filteredStudents;
  }, [studentsPage, filters.class]);

  const enrollments = useMemo<EnrollmentHistoryItem[]>(() => {
    let filteredEnrollments = enrollmentRecords.map((enrollment) => ({
      id: enrollment.id,
      studentName: enrollment.studentName,
      session: enrollment.sessionName,
      class: enrollment.className || '—',
      enrolled: formatDate(enrollment.enrolledDate),
      status: enrollment.status,
    }));
    if (filters.student) {
      filteredEnrollments = filteredEnrollments.filter((enrollment) =>
        enrollment.studentName.toLowerCase().includes(filters.student.toLowerCase()),
      );
    }
    return filteredEnrollments;
  }, [enrollmentRecords, filters.student]);

  const male = genderAggregates?.male?.value ?? 0;
  const female = genderAggregates?.female?.value ?? 0;
  const hasMoreStudents = Boolean(studentsPage?.hasMore);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Users} label={t('students.report.totalStudents')} value={metrics?.total ?? 0} color="primary" isActive={!reportStatusFilter} onClick={() => { setReportStatusFilter(null); setActiveSubTab('list'); }} />
        <StatCard icon={UserCheck} label={t('students.report.active')} value={metrics?.active ?? 0} color="green" isActive={reportStatusFilter === 'active'} onClick={() => { setReportStatusFilter(reportStatusFilter === 'active' ? null : 'active'); setActiveSubTab('list'); }} />
        <StatCard icon={UserX} label={t('students.report.inactive')} value={metrics?.inactive ?? 0} color="red" isActive={reportStatusFilter === 'inactive'} onClick={() => { setReportStatusFilter(reportStatusFilter === 'inactive' ? null : 'inactive'); setActiveSubTab('list'); }} />
        <StatCard icon={TrendingUp} label={t('students.report.genderSplit')} value={`${male}M / ${female}F`} color="blue" onClick={() => { setActiveSubTab('list'); }} />
      </div>

      <StudentReportFilterBanner
        hasBaseStatusFilter={Boolean(filters.status && filters.status !== 'all')}
        reportStatusFilter={reportStatusFilter}
        studentFilter={filters.student}
        onClearStatusFilter={() => setReportStatusFilter(null)}
      />

      <SubTabBar tabs={REPORT_TABS} value={activeSubTab} onChange={setActiveSubTab} panelIdPrefix="student-report-subtab" />

      <ExportToolbar
        title={activeSubTab === 'list' ? t('students.report.studentListTab') : t('students.report.enrollmentHistoryTab')}
        data={activeSubTab === 'list' ? students : enrollments}
        headers={activeSubTab === 'list'
          ? [
              t('students.report.colName'),
              t('students.report.colGender'),
              t('students.report.colClass'),
              t('students.report.colSession'),
              t('students.report.colCity'),
              t('students.report.colAge'),
              t('students.report.colRegistered'),
              t('students.report.colStatus'),
            ]
          : [
              t('students.report.colStudent'),
              t('students.report.colSession'),
              t('students.report.colClass'),
              t('students.report.colEnrolled'),
              t('students.report.colStatus'),
            ]}
      />

      <div className="space-y-3">
        <StudentReportTables
          activeSubTab={activeSubTab}
          students={students}
          enrollments={enrollments}
          statusBadgeConfig={statusBadgeConfig}
          enrollmentStatusConfig={enrollmentStatusConfig}
        />
        {activeSubTab === 'list' && studentsPage && (
          <ListPagination
            page={listPage}
            total={studentsPage.total}
            limit={STUDENTS_MODULE_MANIFEST.defaultPageSize}
            hasMore={hasMoreStudents}
            onPageChange={setListPage}
            i18nNamespace="students"
            variant="range"
          />
        )}
      </div>

      <StudentReportDashboardWidgets />
    </div>
  );
}
