import React from 'react';
import {
  HelpCircle, Filter, Sparkles, FileCheck, BarChart3, Layers, ClipboardList,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useQuestionBankMetrics } from '@/tenant/features/question-bank/hooks/useQuestionBankApi';
import { ModuleCommandMetricsGrid } from '@/components/ui/ModuleCommandMetricsGrid';

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

  const items = [
    { icon: HelpCircle, label: t('questionBank.metrics.total'), value: metrics.total, accent: 'primary' as const },
    { icon: Filter, label: t('questionBank.metrics.filtered'), value: shown, accent: 'info' as const },
    { icon: Sparkles, label: t('questionBank.metrics.easy'), value: metrics.easy, accent: 'success' as const },
    { icon: BarChart3, label: t('questionBank.metrics.medium'), value: metrics.medium, accent: 'warning' as const },
    { icon: Layers, label: t('questionBank.metrics.hard'), value: metrics.hard, accent: 'destructive' as const },
    { icon: ClipboardList, label: t('questionBank.metrics.tests'), value: metrics.totalTests, accent: 'indigo' as const },
    { icon: FileCheck, label: t('questionBank.metrics.categories'), value: metrics.categories, accent: 'purple' as const },
  ];

  return <ModuleCommandMetricsGrid items={items} />;
}
