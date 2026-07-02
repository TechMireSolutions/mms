import React from 'react';
import {
  Layers, Filter, Package, Star, Gift, TrendingUp, RotateCcw,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useHasanatMetrics } from '@/tenant/features/hasanat/hooks/useHasanatApi';
import { ModuleCommandMetricCard } from '@/components/ui/ModuleCommandMetricCard';

interface HasanatCommandMetricsProps {
  shown: number;
}

export function HasanatCommandMetrics({
  shown,
}: HasanatCommandMetricsProps): React.JSX.Element {
  const { t } = useTranslation();
  const { data: serverMetrics } = useHasanatMetrics();

  const metrics = {
    totalStock: serverMetrics?.totalStock ?? 0,
    available: serverMetrics?.available ?? 0,
    distributed: serverMetrics?.distributed ?? 0,
    redeemed: serverMetrics?.redeemed ?? 0,
    active: serverMetrics?.active ?? 0,
    returned: serverMetrics?.returned ?? 0,
    denominations: serverMetrics?.denominations ?? 0,
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
      <ModuleCommandMetricCard icon={Layers} label={t('hasanat.metrics.totalStock')} value={metrics.totalStock} />
      <ModuleCommandMetricCard icon={Filter} label={t('hasanat.metrics.filtered')} value={shown} />
      <ModuleCommandMetricCard icon={Package} label={t('hasanat.metrics.available')} value={metrics.available} />
      <ModuleCommandMetricCard icon={Star} label={t('hasanat.metrics.distributed')} value={metrics.distributed} />
      <ModuleCommandMetricCard icon={Gift} label={t('hasanat.metrics.redeemed')} value={metrics.redeemed} />
      <ModuleCommandMetricCard icon={TrendingUp} label={t('hasanat.metrics.active')} value={metrics.active} />
      <ModuleCommandMetricCard icon={RotateCcw} label={t('hasanat.metrics.returned')} value={metrics.returned} />
    </div>
  );
}
