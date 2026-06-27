import React from 'react';
import {
  BookOpen, Filter, CheckCircle2, FileEdit, Layers, EyeOff, TrendingUp,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAccountingMetrics } from '@/hooks/useAccountingApi';
import { ModuleCommandMetricCard } from '@/components/ui/ModuleCommandMetricCard';

interface AccountingCommandMetricsProps {
  entryTotal: number;
  shown: number;
}

export function AccountingCommandMetrics({
  entryTotal,
  shown,
}: AccountingCommandMetricsProps): React.JSX.Element {
  const { t } = useTranslation();
  const { data: serverMetrics } = useAccountingMetrics();

  const metrics = {
    totalEntries: serverMetrics?.totalEntries ?? entryTotal,
    posted: serverMetrics?.posted ?? 0,
    draft: serverMetrics?.draft ?? 0,
    activeAccounts: serverMetrics?.activeAccounts ?? 0,
    inactiveAccounts: serverMetrics?.inactiveAccounts ?? 0,
    newThisPeriod: serverMetrics?.newThisPeriod ?? 0,
    postedVolume: serverMetrics?.postedVolume ?? 0,
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
      <ModuleCommandMetricCard icon={BookOpen} label={t('accounting.metrics.totalEntries')} value={metrics.totalEntries} />
      <ModuleCommandMetricCard icon={Filter} label={t('accounting.metrics.filtered')} value={shown} />
      <ModuleCommandMetricCard icon={CheckCircle2} label={t('accounting.metrics.posted')} value={metrics.posted} />
      <ModuleCommandMetricCard icon={FileEdit} label={t('accounting.metrics.draft')} value={metrics.draft} />
      <ModuleCommandMetricCard icon={Layers} label={t('accounting.metrics.activeAccounts')} value={metrics.activeAccounts} />
      <ModuleCommandMetricCard icon={EyeOff} label={t('accounting.metrics.inactiveAccounts')} value={metrics.inactiveAccounts} />
      <ModuleCommandMetricCard icon={TrendingUp} label={t('accounting.metrics.postedVolume')} value={metrics.postedVolume} />
    </div>
  );
}
