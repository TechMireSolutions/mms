import React, { useMemo } from 'react';
import {
  ClipboardList, Filter, CheckCircle2, Clock,
} from 'lucide-react';
import { useFinanceCurrency } from '@/hooks/useCurrency';
import { useTranslation } from '@/hooks/useTranslation';
import { useEnrollmentsMetrics } from '@/tenant/features/enrollments/hooks/useEnrollmentsApi';
import { ModuleCommandMetricsGrid } from '@/components/ui/ModuleCommandMetricsGrid';

interface EnrollmentsCommandMetricsProps {
  total: number;
  shown: number;
}

export const EnrollmentsCommandMetrics = React.memo(function EnrollmentsCommandMetrics({
  total,
  shown,
}: EnrollmentsCommandMetricsProps): React.JSX.Element {
  const { t } = useTranslation();
  const { formatCurrency, activeCurrency } = useFinanceCurrency();
  const { data: serverMetrics } = useEnrollmentsMetrics();

  const metrics = useMemo(() => ({
    total: serverMetrics?.total ?? total,
    confirmed: serverMetrics?.confirmed ?? 0,
    pending: serverMetrics?.pending ?? 0,
    cancelled: serverMetrics?.cancelled ?? 0,
    revenue: serverMetrics?.revenue ?? 0,
    newThisPeriod: serverMetrics?.newThisPeriod ?? 0,
  }), [serverMetrics, total]);

  const items = useMemo(() => [
    { icon: ClipboardList, label: t('enrollments.metrics.total'), value: metrics.total, accent: 'primary' as const },
    { icon: Filter, label: t('enrollments.metrics.filtered'), value: shown, accent: 'info' as const },
    { icon: CheckCircle2, label: t('enrollments.metrics.confirmed'), value: metrics.confirmed, accent: 'success' as const },
    { icon: Clock, label: t('enrollments.metrics.pending'), value: metrics.pending, accent: 'warning' as const },
  ], [t, shown, metrics, activeCurrency.code, formatCurrency]);

  return <ModuleCommandMetricsGrid items={items} />;
});
