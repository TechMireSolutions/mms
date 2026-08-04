import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SubTabBar, type SubTab as UINavTab } from '@/components/ui/SubTabBar';
import { Users, UserCheck, UserX, TrendingUp } from 'lucide-react';
import {
  ENROLLMENTS_MODULE_MANIFEST,
  STUDENTS_MODULE_MANIFEST,
  formatDate,
  type Enrollment,
  type Student,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useSessionsCollection } from '@/tenant/hooks/collections/sessions';
import { useEnrollmentsPaginated } from '@/tenant/hooks/collections/enrollments';
import {
  fetchAllStudentsForQuery,
  useStudentsMetrics,
  useStudentsPaginated,
  useStudentsWidgetAggregates,
} from '@/tenant/hooks/collections/students';
import { StatCard } from '@/components/ui/StatCard';
import { ExportToolbar, type ExportColumn } from '@/components/ui/ExportToolbar';
import { ListPagination } from '@/components/ui/ListPagination';
import { ErrorState } from '@/components/ui/ErrorState';
import { studentStatusBadgeConfig } from '@/lib/students/studentStatusUi';
import { SEMANTIC_BADGE } from '@/lib/semanticTone';
import { StudentReportDashboardWidgets } from './StudentReportDashboardWidgets';
import { StudentReportFilterBanner } from './StudentReportFilterBanner';
import { StudentReportTables } from './StudentReportTables';
import { fetchAllEnrollmentsForQuery } from './studentReportExport';
import {
  mapStudentRow,
  studentMatchesClassFilter,
  studentMatchesSessionFilter,
  type EnrollmentHistoryItem,
  type ReportStudent,
  type StudentReportProps,
  type StudentReportSubTab,
} from './studentReportTypes';
import type { StatusBadgeConfigItem } from '@/components/ui/StatusBadge';

export type { EnrollmentHistoryItem, ReportStudent, StudentReportFilters, StudentReportProps } from './studentReportTypes';

function mapEnrollmentRow(enrollment: Enrollment): EnrollmentHistoryItem {
  return {
    id: enrollment.id,
    studentName: enrollment.studentName,
    session: enrollment.sessionName,
    class: enrollment.className || '—',
    enrolled: formatDate(enrollment.enrolledDate),
    status: enrollment.status,
  };
}

export default function StudentReport({ filters }: StudentReportProps): React.JSX.Element {
  const { t } = useTranslation();
  const sessions = useSessionsCollection();
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
  const [historyPage, setHistoryPage] = useState(1);
  const [reportStatusFilter, setReportStatusFilter] = useState<string | null>(null);

  const sessionFilter = filters.session && filters.session !== 'all' ? filters.session : undefined;
  const classFilter = filters.class && filters.class !== 'all' ? filters.class : undefined;
  const needsClientEnrollmentFilter = Boolean(sessionFilter || classFilter);
  const statusParam = reportStatusFilter || (filters.status !== 'all' ? filters.status : undefined);
  const searchParam = filters.student || undefined;

  useEffect(() => {
    setListPage(1);
  }, [filters.student, filters.status, filters.session, filters.class, reportStatusFilter]);

  useEffect(() => {
    setHistoryPage(1);
  }, [filters.student, filters.session]);

  const { data: metrics } = useStudentsMetrics();
  const { data: genderAggregates } = useStudentsWidgetAggregates([
    { id: 'male', collection: 'students', operation: 'count', filterField: 'gender', filterOperator: 'equals', filterValue: 'male' },
    { id: 'female', collection: 'students', operation: 'count', filterField: 'gender', filterOperator: 'equals', filterValue: 'female' },
  ]);

  const studentsPageQuery = useStudentsPaginated({
    page: listPage,
    limit: STUDENTS_MODULE_MANIFEST.defaultPageSize,
    search: searchParam,
    status: statusParam,
    enabled: activeSubTab === 'list' && !needsClientEnrollmentFilter,
  });

  const filteredStudentsQuery = useQuery({
    queryKey: [
      'students',
      'report-filtered',
      { search: searchParam, status: statusParam, session: sessionFilter, className: classFilter },
    ] as const,
    queryFn: async () => {
      const all = await fetchAllStudentsForQuery({
        search: searchParam,
        status: statusParam,
      });
      return (all as unknown as Student[]).filter(
        (student) =>
          studentMatchesSessionFilter(student, sessionFilter ?? 'all') &&
          studentMatchesClassFilter(student, classFilter ?? 'all', sessions),
      );
    },
    enabled: activeSubTab === 'list' && needsClientEnrollmentFilter,
    staleTime: 15_000,
  });

  const enrollmentsPageQuery = useEnrollmentsPaginated({
    page: historyPage,
    limit: ENROLLMENTS_MODULE_MANIFEST.defaultPageSize,
    search: searchParam,
    sessionId: sessionFilter,
    enabled: activeSubTab === 'history',
  });

  const listError = needsClientEnrollmentFilter
    ? filteredStudentsQuery.isError
    : studentsPageQuery.isError;
  const listRefetch = needsClientEnrollmentFilter
    ? filteredStudentsQuery.refetch
    : studentsPageQuery.refetch;
  const historyError = enrollmentsPageQuery.isError;

  const students = useMemo<ReportStudent[]>(() => {
    if (needsClientEnrollmentFilter) {
      const rows = filteredStudentsQuery.data ?? [];
      const start = (listPage - 1) * STUDENTS_MODULE_MANIFEST.defaultPageSize;
      return rows
        .slice(start, start + STUDENTS_MODULE_MANIFEST.defaultPageSize)
        .map((student) => mapStudentRow(student, sessions));
    }
    const studentRows = (studentsPageQuery.data?.students ?? []) as unknown as Student[];
    return studentRows.map((student) => mapStudentRow(student, sessions));
  }, [
    needsClientEnrollmentFilter,
    filteredStudentsQuery.data,
    listPage,
    studentsPageQuery.data,
    sessions,
  ]);

  const listTotal = needsClientEnrollmentFilter
    ? (filteredStudentsQuery.data?.length ?? 0)
    : (studentsPageQuery.data?.total ?? 0);
  const listHasMore = needsClientEnrollmentFilter
    ? listPage * STUDENTS_MODULE_MANIFEST.defaultPageSize < listTotal
    : Boolean(studentsPageQuery.data?.hasMore);

  const enrollments = useMemo<EnrollmentHistoryItem[]>(
    () => (enrollmentsPageQuery.data?.enrollments ?? []).map(mapEnrollmentRow),
    [enrollmentsPageQuery.data],
  );

  const male = genderAggregates?.male?.value ?? 0;
  const female = genderAggregates?.female?.value ?? 0;

  const studentExportColumns = useMemo<ExportColumn[]>(
    () => [
      { header: t('students.report.colName'), key: 'name' },
      { header: t('students.report.colGender'), key: 'gender' },
      { header: t('students.report.colClass'), key: 'class' },
      { header: t('students.report.colSession'), key: 'session' },
      { header: t('students.report.colCity'), key: 'city' },
      { header: t('students.report.colAge'), key: 'age' },
      { header: t('students.report.colRegistered'), key: 'registered' },
      { header: t('students.report.colStatus'), key: 'status' },
    ],
    [t],
  );

  const enrollmentExportColumns = useMemo<ExportColumn[]>(
    () => [
      { header: t('students.report.colStudent'), key: 'studentName' },
      { header: t('students.report.colSession'), key: 'session' },
      { header: t('students.report.colClass'), key: 'class' },
      { header: t('students.report.colEnrolled'), key: 'enrolled' },
      { header: t('students.report.colStatus'), key: 'status' },
    ],
    [t],
  );

  const resolveStudentExportRows = async (): Promise<Record<string, unknown>[]> => {
    let source: Student[];
    if (needsClientEnrollmentFilter) {
      source = filteredStudentsQuery.data ?? await filteredStudentsQuery.refetch().then((r) => r.data ?? []);
    } else {
      source = (await fetchAllStudentsForQuery({
        search: searchParam,
        status: statusParam,
      })) as unknown as Student[];
    }
    return source.map((student) => mapStudentRow(student, sessions) as unknown as Record<string, unknown>);
  };

  const resolveEnrollmentExportRows = async (): Promise<Record<string, unknown>[]> => {
    const all = await fetchAllEnrollmentsForQuery({
      search: searchParam,
      sessionId: sessionFilter,
    });
    return all.map((enrollment) => mapEnrollmentRow(enrollment) as unknown as Record<string, unknown>);
  };

  if ((activeSubTab === 'list' && listError) || (activeSubTab === 'history' && historyError)) {
    return (
      <div className="p-4">
        <ErrorState
          title={t('students.report.loadFailed')}
          description={t('students.report.loadFailedHint')}
          onRetry={() => {
            if (activeSubTab === 'list') void listRefetch();
            else void enrollmentsPageQuery.refetch();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Users} label={t('students.report.totalStudents')} value={metrics?.total ?? 0} color="primary" isActive={!reportStatusFilter} onClick={() => { setReportStatusFilter(null); setActiveSubTab('list'); }} />
        <StatCard icon={UserCheck} label={t('students.report.active')} value={metrics?.active ?? 0} color="green" isActive={reportStatusFilter === 'active'} onClick={() => { setReportStatusFilter(reportStatusFilter === 'active' ? null : 'active'); setActiveSubTab('list'); }} />
        <StatCard icon={UserX} label={t('students.report.inactive')} value={metrics?.inactive ?? 0} color="red" isActive={reportStatusFilter === 'inactive'} onClick={() => { setReportStatusFilter(reportStatusFilter === 'inactive' ? null : 'inactive'); setActiveSubTab('list'); }} />
        <StatCard icon={TrendingUp} label={t('students.report.genderSplit')} value={t('students.report.genderSplitValue', { male, female })} color="blue" onClick={() => { setActiveSubTab('list'); }} />
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
        columns={activeSubTab === 'list' ? studentExportColumns : enrollmentExportColumns}
        rows={activeSubTab === 'list' ? (students as unknown as Record<string, unknown>[]) : (enrollments as unknown as Record<string, unknown>[])}
        resolveRows={activeSubTab === 'list' ? resolveStudentExportRows : resolveEnrollmentExportRows}
        moduleId="students"
      />

      <div className="space-y-3">
        <StudentReportTables
          activeSubTab={activeSubTab}
          students={students}
          enrollments={enrollments}
          statusBadgeConfig={statusBadgeConfig}
          enrollmentStatusConfig={enrollmentStatusConfig}
        />
        {activeSubTab === 'list' && (
          <ListPagination
            page={listPage}
            total={listTotal}
            limit={STUDENTS_MODULE_MANIFEST.defaultPageSize}
            hasMore={listHasMore}
            onPageChange={setListPage}
            i18nNamespace="students"
            variant="range"
          />
        )}
        {activeSubTab === 'history' && enrollmentsPageQuery.data && (
          <ListPagination
            page={historyPage}
            total={enrollmentsPageQuery.data.total}
            limit={ENROLLMENTS_MODULE_MANIFEST.defaultPageSize}
            hasMore={enrollmentsPageQuery.data.hasMore}
            onPageChange={setHistoryPage}
            i18nNamespace="students"
            variant="range"
          />
        )}
      </div>

      <StudentReportDashboardWidgets />
    </div>
  );
}
