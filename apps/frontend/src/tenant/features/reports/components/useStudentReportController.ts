import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import type { ExportColumn } from '@/components/ui/ExportToolbar';
import { studentStatusBadgeConfig } from '@/lib/students/studentStatusUi';
import { SEMANTIC_BADGE } from '@/lib/semanticTone';
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
import type { SubTab as UINavTab } from '@/components/ui/SubTabBar';

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

/** Controller for Students Reports tier — Query + filters; presentational shell stays thin. */
export function useStudentReportController({ filters }: StudentReportProps) {
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

  const metricItems = useMemo(
    () => [
      {
        icon: Users,
        label: t('students.report.totalStudents'),
        value: metrics?.total ?? 0,
        accent: 'primary' as const,
        isActive: !reportStatusFilter,
        onClick: () => { setReportStatusFilter(null); setActiveSubTab('list'); },
      },
      {
        icon: UserCheck,
        label: t('students.report.active'),
        value: metrics?.active ?? 0,
        accent: 'green' as const,
        isActive: reportStatusFilter === 'active',
        onClick: () => { setReportStatusFilter(reportStatusFilter === 'active' ? null : 'active'); setActiveSubTab('list'); },
      },
      {
        icon: UserX,
        label: t('students.report.inactive'),
        value: metrics?.inactive ?? 0,
        accent: 'red' as const,
        isActive: reportStatusFilter === 'inactive',
        onClick: () => { setReportStatusFilter(reportStatusFilter === 'inactive' ? null : 'inactive'); setActiveSubTab('list'); },
      },
      {
        icon: TrendingUp,
        label: t('students.report.genderSplit'),
        value: t('students.report.genderSplitValue', { male, female }),
        accent: 'blue' as const,
        onClick: () => { setActiveSubTab('list'); },
      },
    ],
    [t, metrics, reportStatusFilter, male, female],
  );

  return {
    t,
    activeSubTab,
    setActiveSubTab,
    REPORT_TABS,
    statusBadgeConfig,
    enrollmentStatusConfig,
    listPage,
    setListPage,
    historyPage,
    setHistoryPage,
    reportStatusFilter,
    setReportStatusFilter,
    listError,
    historyError,
    listRefetch,
    enrollmentsPageQuery,
    students,
    enrollments,
    listTotal,
    listHasMore,
    studentExportColumns,
    enrollmentExportColumns,
    resolveStudentExportRows,
    resolveEnrollmentExportRows,
    metricItems,
    filters,
  };
}
