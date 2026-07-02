import React from 'react';
import {
  Receipt, Filter, Banknote, Wallet, Globe, CalendarPlus, ClipboardList,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useObligationsMetrics } from '@/tenant/features/obligations/hooks/useObligationsApi';
import { ModuleCommandMetricCard } from '@/components/ui/ModuleCommandMetricCard';

interface ObligationsCommandMetricsProps {
  total: number;
  shown: number;
}

export function ObligationsCommandMetrics({
  total,
  shown,
}: ObligationsCommandMetricsProps): React.JSX.Element {
  const { t } = useTranslation();
  const { data: serverMetrics } = useObligationsMetrics();

  const metrics = {
    total: serverMetrics?.total ?? total,
    totalAmount: serverMetrics?.totalAmount ?? 0,
    cash: serverMetrics?.cash ?? 0,
    online: serverMetrics?.online ?? 0,
    newThisPeriod: serverMetrics?.newThisPeriod ?? 0,
    obligationTypes: serverMetrics?.obligationTypes ?? 0,
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
      <ModuleCommandMetricCard icon={Receipt} label={t('obligations.metrics.total')} value={metrics.total} />
      <ModuleCommandMetricCard icon={Filter} label={t('obligations.metrics.filtered')} value={shown} />
      <ModuleCommandMetricCard icon={Banknote} label={t('obligations.metrics.totalAmount')} value={metrics.totalAmount} />
      <ModuleCommandMetricCard icon={Wallet} label={t('obligations.metrics.cash')} value={metrics.cash} />
      <ModuleCommandMetricCard icon={Globe} label={t('obligations.metrics.online')} value={metrics.online} />
      <ModuleCommandMetricCard icon={CalendarPlus} label={t('obligations.metrics.newThisPeriod')} value={metrics.newThisPeriod} />
      <ModuleCommandMetricCard icon={ClipboardList} label={t('obligations.metrics.obligationTypes')} value={metrics.obligationTypes} />
    </div>
  );
}
