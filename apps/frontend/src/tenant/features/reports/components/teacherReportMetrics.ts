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
import { applyTeachersWorkDrillDown } from '@/tenant/hooks/collections/teachers';

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
      accent: 'green',
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
      accent: 'red',
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
      accent: 'blue',
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

