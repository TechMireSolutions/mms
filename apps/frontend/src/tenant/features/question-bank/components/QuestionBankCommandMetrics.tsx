import React from 'react';
import {
  HelpCircle, Filter, Sparkles, FileCheck, BarChart3, Layers, ClipboardList,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useQuestionBankMetrics } from '@/tenant/features/question-bank/hooks/useQuestionBankApi';
import { ModuleCommandMetricCard } from '@/components/ui/ModuleCommandMetricCard';

interface QuestionBankCommandMetricsProps {
  shown: number;
  total: number;
}

export function QuestionBankCommandMetrics({
  shown,
  total,
}: QuestionBankCommandMetricsProps): React.JSX.Element {
  const { t } = useTranslation();
  const { data: serverMetrics } = useQuestionBankMetrics();

  const metrics = {
    total: serverMetrics?.total ?? total,
    easy: serverMetrics?.easy ?? 0,
    medium: serverMetrics?.medium ?? 0,
    hard: serverMetrics?.hard ?? 0,
    totalTests: serverMetrics?.totalTests ?? 0,
    totalResults: serverMetrics?.totalResults ?? 0,
    categories: serverMetrics?.categories ?? 0,
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
      <ModuleCommandMetricCard icon={HelpCircle} label={t('questionBank.metrics.total')} value={metrics.total} />
      <ModuleCommandMetricCard icon={Filter} label={t('questionBank.metrics.filtered')} value={shown} />
      <ModuleCommandMetricCard icon={Sparkles} label={t('questionBank.metrics.easy')} value={metrics.easy} />
      <ModuleCommandMetricCard icon={BarChart3} label={t('questionBank.metrics.medium')} value={metrics.medium} />
      <ModuleCommandMetricCard icon={Layers} label={t('questionBank.metrics.hard')} value={metrics.hard} />
      <ModuleCommandMetricCard icon={ClipboardList} label={t('questionBank.metrics.tests')} value={metrics.totalTests} />
      <ModuleCommandMetricCard icon={FileCheck} label={t('questionBank.metrics.categories')} value={metrics.categories} />
    </div>
  );
}
