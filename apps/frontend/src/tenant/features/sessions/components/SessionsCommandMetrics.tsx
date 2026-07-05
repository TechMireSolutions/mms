import React from 'react';
import {
  Calendar, Filter, CheckCircle2, Clock, XCircle, Users,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useSessionsMetrics } from '@/tenant/features/sessions/hooks/useSessions';
import { ModuleCommandMetricsGrid } from '@/components/ui/ModuleCommandMetricsGrid';

interface SessionsCommandMetricsProps {
  total: number;
  shown: number;
}

export function SessionsCommandMetrics({
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

  const items = [
    { icon: Calendar, label: t('sessions.metrics.total'), value: metrics.total, accent: 'primary' as const },
    { icon: Filter, label: t('sessions.metrics.filtered'), value: shown, accent: 'info' as const },
    { icon: CheckCircle2, label: t('sessions.metrics.active'), value: metrics.active, accent: 'success' as const },
    { icon: Clock, label: t('sessions.metrics.upcoming'), value: metrics.upcoming, accent: 'warning' as const },
    { icon: Users, label: t('sessions.metrics.enrolled'), value: metrics.totalEnrolled, accent: 'indigo' as const },
    { icon: CheckCircle2, label: t('sessions.metrics.completed'), value: metrics.completed, accent: 'success' as const },
    { icon: XCircle, label: t('sessions.metrics.cancelled'), value: metrics.cancelled, accent: 'destructive' as const },
  ];

  return <ModuleCommandMetricsGrid items={items} />;
}
