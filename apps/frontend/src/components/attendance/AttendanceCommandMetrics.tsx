import React from 'react';
import {
  ClipboardList, Filter, UserCheck, UserX, Clock, CalendarClock, CalendarDays,
} from 'lucide-react';
import useTranslation from '@/hooks/useTranslation';
import { useAttendanceMetrics } from '@/hooks/useAttendance';
import ModuleCommandMetricCard from '@/components/ui/ModuleCommandMetricCard';

interface AttendanceCommandMetricsProps {
  total: number;
  shown: number;
  selectedDate: string;
}

export default function AttendanceCommandMetrics({
  total,
  shown,
  selectedDate,
}: AttendanceCommandMetricsProps): React.JSX.Element {
  const { t } = useTranslation();
  const { data: serverMetrics } = useAttendanceMetrics(selectedDate);

  const metrics = {
    total: serverMetrics?.total ?? total,
    selectedDatePresent: serverMetrics?.selectedDatePresent ?? 0,
    selectedDateAbsent: serverMetrics?.selectedDateAbsent ?? 0,
    selectedDateLate: serverMetrics?.selectedDateLate ?? 0,
    selectedDateExcused: serverMetrics?.selectedDateExcused ?? 0,
    periodTotal: serverMetrics?.periodTotal ?? 0,
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
      <ModuleCommandMetricCard icon={ClipboardList} label={t('attendance.metrics.total')} value={metrics.total} />
      <ModuleCommandMetricCard icon={Filter} label={t('attendance.metrics.filtered')} value={shown} />
      <ModuleCommandMetricCard icon={UserCheck} label={t('attendance.metrics.present')} value={metrics.selectedDatePresent} />
      <ModuleCommandMetricCard icon={UserX} label={t('attendance.metrics.absent')} value={metrics.selectedDateAbsent} />
      <ModuleCommandMetricCard icon={Clock} label={t('attendance.metrics.late')} value={metrics.selectedDateLate} />
      <ModuleCommandMetricCard icon={CalendarClock} label={t('attendance.metrics.excused')} value={metrics.selectedDateExcused} />
      <ModuleCommandMetricCard icon={CalendarDays} label={t('attendance.metrics.periodTotal')} value={metrics.periodTotal} />
    </div>
  );
}
