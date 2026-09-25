import { UserCheck, UserMinus, UserPlus, UserX, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type {
  TeachersCommandMetricsSnapshot,
  TeachersQuickFilter,
} from '@mms/shared';
import { resolveTeacherStatusRoles } from '@mms/shared';
import type { AccentColor } from '@/components/ui/statCardAccent';
import type { TranslationFunction } from '@/lib/contexts/TranslationContext';
import { notify } from '@/lib/notify';
import { applyTeachersWorkDrillDown } from '@/tenant/hooks/collections/faculty';
import type { FacultyWorkloadItem } from './facultyReportTypes';

export interface TeacherReportMetricItem {
  icon: LucideIcon;
  label: string;
  value: string | number;
  accent: AccentColor;
  isActive?: boolean;
  onClick?: () => void;
}

/** Toast + route the Work directory to a status preset (Reports -> Work drill-down). */
export function applyTeachersReportDrillDown(
  t: TranslationFunction,
  quickFilter: TeachersQuickFilter | undefined,
): void {
  notify.message(t('teachers.drillDownApplied'));
  applyTeachersWorkDrillDown(quickFilter ? { quickFilter } : {});
}

/** Builds the Teachers report KPI tiles (parity with Students tile semantics). */
export function buildTeacherReportMetricItems(input: {
  t: TranslationFunction;
  metrics: TeachersCommandMetricsSnapshot | undefined;
  reportStatusFilter: string | null;
  onStatusFilterChange: (status: string | null) => void;
  onDrillDown: (quickFilter: TeachersQuickFilter | undefined) => void;
}): TeacherReportMetricItem[] {
  const {
    t,
    metrics,
    reportStatusFilter,
    onStatusFilterChange,
    onDrillDown,
  } = input;
  const { active: activeStatus, inactive: inactiveStatus, onLeave: onLeaveStatus } =
    resolveTeacherStatusRoles();

  const toggleStatus = (status: string): void =>
    onStatusFilterChange(reportStatusFilter === status ? null : status);

  return [
    {
      icon: Users,
      label: t('teachers.report.totalFaculty'),
      value: metrics?.total ?? 0,
      accent: 'primary',
      isActive: !reportStatusFilter,
      onClick: () => {
        onStatusFilterChange(null);
        onDrillDown('all');
      },
    },
    {
      icon: UserCheck,
      label: t('teachers.metrics.active'),
      value: metrics?.active ?? 0,
      accent: 'success',
      isActive: reportStatusFilter === activeStatus,
      onClick: () => {
        toggleStatus(activeStatus);
        onDrillDown('active');
      },
    },
    {
      icon: UserX,
      label: t('teachers.metrics.inactive'),
      value: metrics?.inactive ?? 0,
      accent: 'destructive',
      isActive: reportStatusFilter === inactiveStatus,
      onClick: () => {
        toggleStatus(inactiveStatus);
        onDrillDown('inactive');
      },
    },
    {
      icon: UserMinus,
      label: t('teachers.metrics.onLeave'),
      value: metrics?.onLeave ?? 0,
      accent: 'warning',
      isActive: reportStatusFilter === onLeaveStatus,
      onClick: () => {
        toggleStatus(onLeaveStatus);
        onDrillDown('onLeave');
      },
    },
    {
      icon: UserPlus,
      label: t('teachers.metrics.newThisPeriod'),
      value: metrics?.newThisPeriod ?? 0,
      accent: 'secondary',
      onClick: () => onDrillDown(undefined),
    },
  ];
}

/** Aggregates class & session workload counts per faculty member across active sessions. */
export function computeFacultyWorkload(
  filteredSessions: Array<{
    id: string;
    classes?: Array<{
      id: string;
      enrolled: number;
      facultyId?: string;
      teacherId?: string;
      facultyName?: string;
      teacherName?: string;
    }>;
  }>,
  resolveClassTeacher: (teacherId: string, teacherName: string) => string,
): FacultyWorkloadItem[] {
  const workloadByTeacherName: Record<string, { classes: Set<string>; sessions: Set<string>; students: number }> = {};
  filteredSessions.forEach((session) => {
    (session.classes || []).forEach((sessionClass) => {
      const teacherName = resolveClassTeacher(
        sessionClass.facultyId || sessionClass.teacherId || '',
        (sessionClass.facultyName || sessionClass.teacherName) ?? '',
      );
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
}

/** Summarizes total faculty, students, classes, and average students per faculty. */
export function summarizeFacultyWorkload(workload: Array<{ classes: number; totalStudents: number }>) {
  const totalFaculty = workload.length;
  const totalStudents = workload.reduce((total, faculty) => total + faculty.totalStudents, 0);
  const totalClasses = workload.reduce((total, faculty) => total + faculty.classes, 0);
  const avgStudents = totalFaculty ? (totalStudents / totalFaculty).toFixed(1) : 0;
  return { totalFaculty, totalStudents, totalClasses, avgStudents };
}


