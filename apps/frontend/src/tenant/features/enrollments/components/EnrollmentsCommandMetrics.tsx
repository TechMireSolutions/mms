import React from 'react';
import {
  ClipboardList, Filter, CheckCircle2, Clock, XCircle, CalendarPlus, Banknote,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useEnrollmentsMetrics } from '@/tenant/features/enrollments/hooks/useEnrollmentsApi';
import { ModuleCommandMetricCard } from '@/components/ui/ModuleCommandMetricCard';

interface EnrollmentsCommandMetricsProps {
  total: number;
  shown: number;
}

export function EnrollmentsCommandMetrics({
  total,
  shown,
}: EnrollmentsCommandMetricsProps): React.JSX.Element {
  const { t } = useTranslation();
  const { data: serverMetrics } = useEnrollmentsMetrics();

  const metrics = {
    total: serverMetrics?.total ?? total,
    confirmed: serverMetrics?.confirmed ?? 0,
    pending: serverMetrics?.pending ?? 0,
    cancelled: serverMetrics?.cancelled ?? 0,
    revenue: serverMetrics?.revenue ?? 0,
    newThisPeriod: serverMetrics?.newThisPeriod ?? 0,
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
      <ModuleCommandMetricCard icon={ClipboardList} label={t('enrollments.metrics.total')} value={metrics.total} />
      <ModuleCommandMetricCard icon={Filter} label={t('enrollments.metrics.filtered')} value={shown} />
      <ModuleCommandMetricCard icon={CheckCircle2} label={t('enrollments.metrics.confirmed')} value={metrics.confirmed} />
      <ModuleCommandMetricCard icon={Clock} label={t('enrollments.metrics.pending')} value={metrics.pending} />
      <ModuleCommandMetricCard icon={Banknote} label={t('enrollments.metrics.revenue')} value={metrics.revenue} />
      <ModuleCommandMetricCard icon={XCircle} label={t('enrollments.metrics.cancelled')} value={metrics.cancelled} />
      <ModuleCommandMetricCard icon={CalendarPlus} label={t('enrollments.metrics.newThisPeriod')} value={metrics.newThisPeriod} />
    </div>
  );
}
