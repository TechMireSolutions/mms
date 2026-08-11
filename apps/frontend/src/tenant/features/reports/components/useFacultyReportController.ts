import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  TEACHERS_MODULE_MANIFEST,
  type Teacher,
  type TeachersQuickFilter,
} from '@mms/shared';
import { BookOpen, Layers, Users } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useSessionsCollection } from '@/tenant/hooks/collections/sessions';
import {
  useTeachersByIds,
  useTeachersMetrics,
  useTeachersPaginated,
} from '@/tenant/hooks/collections/teachers';
import type { ExportColumn } from '@/components/ui/ExportToolbar';
import { teacherStatusBadgeConfig } from '@/lib/teachers/teacherStatusUi';
import { collectTeacherIdsFromSessions } from '@/lib/registryResolve';
import { teacherNameById } from '@/lib/teachers/teacherAssignment';
import {
  applyTeachersReportDrillDown,
  buildTeacherReportMetricItems,
} from './teacherReportMetrics';
import { resolveTeacherReportExportRows } from './teacherReportExport';
import {
  mapTeacherRow,
  type FacultyWorkloadItem,
  type ReportTeacher,
  type TeacherReportProps,
  type TeacherReportSubTab,
} from './teacherReportTypes';
import type { SubTab as UINavTab } from '@/components/ui/SubTabBar';

/** Controller for Faculty Reports tier — Query + filters; presentational shell stays thin. */
export function useFacultyReportController({ filters }: TeacherReportProps) {
  const { t } = useTranslation();
  const [activeSubTab, setActiveSubTab] = useState<TeacherReportSubTab>('roster');
  const statusBadgeConfig = useMemo(() => teacherStatusBadgeConfig(t), [t]);

  const REPORT_TABS = useMemo<readonly UINavTab<TeacherReportSubTab>[]>(
    () => [
      { key: 'roster', label: t('teachers.report.rosterTab') },
      { key: 'workload', label: t('teachers.report.workloadTab') },
    ],
    [t],
  );

  const [listPage, setListPage] = useState(1);
  const [reportStatusFilter, setReportStatusFilter] = useState<string | null>(null);
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);

  const sessionFilter = filters.session && filters.session !== 'all' ? filters.session : undefined;
  const classFilter = filters.class && filters.class !== 'all' ? filters.class : undefined;
  const statusParam = reportStatusFilter || (filters.status !== 'all' ? filters.status : undefined);
  const searchParam = filters.student || undefined;

  useEffect(() => {
    setListPage(1);
  }, [filters.student, filters.status, reportStatusFilter]);

  const { data: metrics, isLoading: metricsLoading } = useTeachersMetrics();

  const rosterQuery = useTeachersPaginated({
    page: listPage,
    limit: TEACHERS_MODULE_MANIFEST.defaultPageSize,
    search: searchParam,
    status: statusParam,
    enabled: activeSubTab === 'roster',
  });

  const listError = rosterQuery.isError;
  const listLoading = rosterQuery.isLoading;
  const listRefetch = rosterQuery.refetch;

  const teachers = useMemo<ReportTeacher[]>(
    () => ((rosterQuery.data?.teachers ?? []) as unknown as Teacher[]).map(mapTeacherRow),
    [rosterQuery.data],
  );

  const listTotal = rosterQuery.data?.total ?? 0;
  const listHasMore = Boolean(rosterQuery.data?.hasMore);

  const sessions = useSessionsCollection();
  const teacherIds = useMemo(() => collectTeacherIdsFromSessions(sessions), [sessions]);
  const { data: workloadTeachers = [] } = useTeachersByIds(teacherIds);

  const filteredSessions = useMemo(() => {
    if (!sessionFilter && !classFilter) return sessions;
    return sessions.filter((session) => {
      if (sessionFilter && session.id !== sessionFilter) return false;
      if (classFilter) {
        const hasClass = (session.classes ?? []).some((sessionClass) => sessionClass.name === classFilter);
        if (!hasClass) return false;
      }
      return true;
    });
  }, [sessions, sessionFilter, classFilter]);

  const resolveClassTeacher = useCallback(
    (teacherId: string, teacherName: string): string => {
      const fromRegistry = teacherNameById(workloadTeachers, teacherId);
      return fromRegistry || teacherName || t('teachers.report.unassigned');
    },
    [workloadTeachers, t],
  );

  const facultyWorkload = useMemo<FacultyWorkloadItem[]>(() => {
    const workloadByTeacherName: Record<string, { classes: Set<string>; sessions: Set<string>; students: number }> = {};
    filteredSessions.forEach((session) => {
      (session.classes || []).forEach((sessionClass) => {
        const teacherName = resolveClassTeacher(sessionClass.teacherId, sessionClass.teacherName ?? '');
        if (!workloadByTeacherName[teacherName]) {
          workloadByTeacherName[teacherName] = { classes: new Set(), sessions: new Set(), students: 0 };
        }
        workloadByTeacherName[teacherName].classes.add(sessionClass.id);
        workloadByTeacherName[teacherName].sessions.add(session.id);
        workloadByTeacherName[teacherName].students += sessionClass.enrolled;
      });
    });

    return Object.entries(workloadByTeacherName)
      .map(([faculty, workload]) => ({
        faculty,
        classes: workload.classes.size,
        sessions: workload.sessions.size,
        totalStudents: workload.students,
      }))
      .sort((firstFaculty, secondFaculty) => secondFaculty.totalStudents - firstFaculty.totalStudents);
  }, [filteredSessions, resolveClassTeacher]);

  const totalFaculty = facultyWorkload.length;
  const totalStudents = facultyWorkload.reduce((total, faculty) => total + faculty.totalStudents, 0);
  const totalClasses = facultyWorkload.reduce((total, faculty) => total + faculty.classes, 0);
  const avgStudents = totalFaculty ? (totalStudents / totalFaculty).toFixed(1) : 0;

  const filteredFacultyWorkload = useMemo(
    () =>
      selectedFaculty
        ? facultyWorkload.filter((facultyItem) => facultyItem.faculty === selectedFaculty)
        : facultyWorkload,
    [facultyWorkload, selectedFaculty],
  );

  const toggleFacultyFilter = (faculty: string): void => {
    setSelectedFaculty((current) => (current === faculty ? null : faculty));
  };

  const rosterExportColumns = useMemo<ExportColumn[]>(
    () => [
      { header: t('teachers.report.colName'), key: 'name' },
      { header: t('teachers.report.colEmployeeId'), key: 'employeeId' },
      { header: t('teachers.report.colSpecialization'), key: 'specialization' },
      { header: t('teachers.report.colStatus'), key: 'status' },
      { header: t('teachers.report.colQualification'), key: 'qualification' },
      { header: t('teachers.report.colJoinDate'), key: 'joinDate' },
      { header: t('teachers.report.colGender'), key: 'gender' },
    ],
    [t],
  );

  const resolveRosterExportRows = (): Promise<Record<string, unknown>[]> =>
    resolveTeacherReportExportRows({ search: searchParam, status: statusParam });

  const drillDownToWork = useCallback(
    (quickFilter: TeachersQuickFilter | undefined) => applyTeachersReportDrillDown(t, quickFilter),
    [t],
  );

  const metricItems = useMemo(
    () => [
      ...buildTeacherReportMetricItems({
        t,
        metrics,
        reportStatusFilter,
        onStatusFilterChange: setReportStatusFilter,
        onDrillDown: drillDownToWork,
      }),
      { icon: Users, label: t('teachers.report.totalStudents'), value: totalStudents, accent: 'blue' },
      { icon: Layers, label: t('teachers.report.totalClasses'), value: totalClasses, accent: 'violet' },
      { icon: BookOpen, label: t('teachers.report.avgStudentsFaculty'), value: avgStudents, accent: 'green' },
    ],
    [t, metrics, reportStatusFilter, drillDownToWork, totalStudents, totalClasses, avgStudents],
  );

  return {
    t,
    activeSubTab,
    setActiveSubTab,
    REPORT_TABS,
    statusBadgeConfig,
    listPage,
    setListPage,
    reportStatusFilter,
    setReportStatusFilter,
    listError,
    listLoading,
    listRefetch,
    rosterQuery,
    teachers,
    listTotal,
    listHasMore,
    rosterExportColumns,
    resolveRosterExportRows,
    metricItems,
    metrics,
    metricsLoading,
    facultyWorkload,
    filteredFacultyWorkload,
    selectedFaculty,
    toggleFacultyFilter,
    totalStudents,
    totalClasses,
    avgStudents,
    filters,
  };
}
