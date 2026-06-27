import React from 'react';
import {
  BookOpen, Filter, Clock, PlayCircle, CheckCircle2, FileText, ClipboardList,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useExaminationsMetrics } from '@/hooks/useExaminationsApi';
import { ModuleCommandMetricCard } from '@/components/ui/ModuleCommandMetricCard';

interface ExaminationsCommandMetricsProps {
  shown: number;
  total: number;
}

export function ExaminationsCommandMetrics({
  shown,
  total,
}: ExaminationsCommandMetricsProps): React.JSX.Element {
  const { t } = useTranslation();
  const { data: serverMetrics } = useExaminationsMetrics();

  const metrics = {
    total: serverMetrics?.total ?? total,
    upcoming: serverMetrics?.upcoming ?? 0,
    ongoing: serverMetrics?.ongoing ?? 0,
    completed: serverMetrics?.completed ?? 0,
    totalResults: serverMetrics?.totalResults ?? 0,
    examsWithResults: serverMetrics?.examsWithResults ?? 0,
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
      <ModuleCommandMetricCard icon={BookOpen} label={t('examinations.metrics.total')} value={metrics.total} />
      <ModuleCommandMetricCard icon={Filter} label={t('examinations.metrics.filtered')} value={shown} />
      <ModuleCommandMetricCard icon={Clock} label={t('examinations.metrics.upcoming')} value={metrics.upcoming} />
      <ModuleCommandMetricCard icon={PlayCircle} label={t('examinations.metrics.ongoing')} value={metrics.ongoing} />
      <ModuleCommandMetricCard icon={CheckCircle2} label={t('examinations.metrics.completed')} value={metrics.completed} />
      <ModuleCommandMetricCard icon={FileText} label={t('examinations.metrics.totalResults')} value={metrics.totalResults} />
      <ModuleCommandMetricCard icon={ClipboardList} label={t('examinations.metrics.examsWithResults')} value={metrics.examsWithResults} />
    </div>
  );
}
