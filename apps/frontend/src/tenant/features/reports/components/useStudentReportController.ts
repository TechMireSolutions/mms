import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ENROLLMENTS_MODULE_MANIFEST,
  STUDENTS_MODULE_MANIFEST,
  type Student,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useSessionsCollection } from '@/tenant/hooks/collections/sessions';
import { useEnrollmentsPaginated } from '@/tenant/hooks/collections/enrollments';
import {
  useStudentsMetrics,
  useStudentsPaginated,
  useStudentsWidgetAggregates,
} from '@/tenant/hooks/collections/students';
import type { ExportColumn } from '@/components/ui/ExportToolbar';
import { studentStatusBadgeConfig } from '@/lib/students/studentStatusUi';
import { SEMANTIC_BADGE } from '@/lib/semanticTone';
import {
  mapEnrollmentRow,
  resolveEnrollmentReportExportRows,
  resolveStudentReportExportRows,
} from './studentReportExport';
import {
  applyStudentsReportDrillDown,
  buildStudentReportMetricItems,
} from './studentReportMetrics';
import {
  mapStudentRow,
  type EnrollmentHistoryItem,
  type ReportStudent,
  type StudentReportProps,
  type StudentReportSubTab,
} from './studentReportTypes';
import type { StatusBadgeConfigItem } from '@/components/ui/StatusBadge';
import type { SubTab as UINavTab } from '@/components/ui/SubTabBar';

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
  const statusParam = reportStatusFilter || (filters.status !== 'all' ? filters.status : undefined);
  const searchParam = filters.student || undefined;

  useEffect(() => {
    setListPage(1);
  }, [filters.student, filters.status, filters.session, filters.class, reportStatusFilter]);

  useEffect(() => {
    setHistoryPage(1);
  }, [filters.student, filters.session]);

  const { data: metrics, isLoading: metricsLoading } = useStudentsMetrics();
  const { data: genderAggregates } = useStudentsWidgetAggregates([
    { id: 'male', collection: 'students', operation: 'count', filterField: 'gender', filterOperator: 'equals', filterValue: 'male' },
    { id: 'female', collection: 'students', operation: 'count', filterField: 'gender', filterOperator: 'equals', filterValue: 'female' },
  ]);

  const studentsPageQuery = useStudentsPaginated({
    page: listPage,
    limit: STUDENTS_MODULE_MANIFEST.defaultPageSize,
    search: searchParam,
    status: statusParam,
    sessionId: sessionFilter,
    className: classFilter,
    enabled: activeSubTab === 'list',
  });

  const enrollmentsPageQuery = useEnrollmentsPaginated({
    page: historyPage,
    limit: ENROLLMENTS_MODULE_MANIFEST.defaultPageSize,
    search: searchParam,
    sessionId: sessionFilter,
    enabled: activeSubTab === 'history',
  });

  const listError = studentsPageQuery.isError;
  const listLoading = studentsPageQuery.isLoading;
  const listRefetch = studentsPageQuery.refetch;
  const historyError = enrollmentsPageQuery.isError;
  const historyLoading = enrollmentsPageQuery.isLoading;

  const students = useMemo<ReportStudent[]>(() => {
    const studentRows = (studentsPageQuery.data?.students ?? []) as unknown as Student[];
    return studentRows.map((student) => mapStudentRow(student, sessions));
  }, [studentsPageQuery.data, sessions]);

  const listTotal = studentsPageQuery.data?.total ?? 0;
  const listHasMore = Boolean(studentsPageQuery.data?.hasMore);

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

  const resolveStudentExportRows = () =>
    resolveStudentReportExportRows({
      search: searchParam,
      status: statusParam,
      sessionId: sessionFilter,
      className: classFilter,
      sessions,
    });

  const resolveEnrollmentExportRows = () =>
    resolveEnrollmentReportExportRows({ search: searchParam, sessionId: sessionFilter });

  const drillDownToWork = useCallback(
    (status: string | undefined) => applyStudentsReportDrillDown(t, status),
    [t],
  );

  const metricItems = useMemo(
    () =>
      buildStudentReportMetricItems({
        t,
        metrics,
        male,
        female,
        reportStatusFilter,
        onStatusFilterChange: setReportStatusFilter,
        onListFocus: () => setActiveSubTab('list'),
        onDrillDown: drillDownToWork,
      }),
    [t, metrics, male, female, reportStatusFilter, drillDownToWork],
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
    listLoading,
    historyError,
    historyLoading,
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
    metrics,
    metricsLoading,
    filters,
  };
}
