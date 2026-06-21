import React from 'react';
import {
  Calendar, Filter, CheckCircle2, Clock, XCircle, Users,
} from 'lucide-react';
import useTranslation from '@/hooks/useTranslation';
import { useSessionsMetrics } from '@/hooks/useSessions';
import ModuleCommandMetricCard from '@/components/ui/ModuleCommandMetricCard';

interface SessionsCommandMetricsProps {
  total: number;
  shown: number;
}

export default function SessionsCommandMetrics({
  total,
  shown,
}: SessionsCommandMetricsProps): React.JSX.Element {
  const { t } = useTranslation();
  const { data: serverMetrics } = useSessionsMetrics();

  const metrics = {
    total: serverMetrics?.total ?? total,
    active: serverMetrics?.active ?? 0,
    upcoming: serverMetrics?.upcoming ?? 0,
    completed: serverMetrics?.completed ?? 0,
    cancelled: serverMetrics?.cancelled ?? 0,
    totalEnrolled: serverMetrics?.totalEnrolled ?? 0,
    totalCapacity: serverMetrics?.totalCapacity ?? 0,
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
      <ModuleCommandMetricCard icon={Calendar} label={t('sessions.metrics.total')} value={metrics.total} />
      <ModuleCommandMetricCard icon={Filter} label={t('sessions.metrics.filtered')} value={shown} />
      <ModuleCommandMetricCard icon={CheckCircle2} label={t('sessions.metrics.active')} value={metrics.active} />
      <ModuleCommandMetricCard icon={Clock} label={t('sessions.metrics.upcoming')} value={metrics.upcoming} />
      <ModuleCommandMetricCard icon={Users} label={t('sessions.metrics.enrolled')} value={metrics.totalEnrolled} />
      <ModuleCommandMetricCard icon={CheckCircle2} label={t('sessions.metrics.completed')} value={metrics.completed} />
      <ModuleCommandMetricCard icon={XCircle} label={t('sessions.metrics.cancelled')} value={metrics.cancelled} />
    </div>
  );
}
