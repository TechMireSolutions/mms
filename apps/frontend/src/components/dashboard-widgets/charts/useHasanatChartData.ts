import { useMemo } from 'react';
import { getDenominationPoints } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useHasanatDistributionsCollection, useHasanatDenomsCollection } from '@/tenant/hooks/collections/hasanat';
import { useDashboardConfig } from '@/hooks/useDashboardConfig';
import { useBrandedDashboardChartColors } from '@/components/dashboard-widgets/useBrandedDashboardChartColors';

export interface HasanatPoint {
  name: string;
  value: number;
  color: string;
}

export function useHasanatChartData() {
  const { t } = useTranslation();
  const { hasanat: HASANAT_THEMES } = useBrandedDashboardChartColors();
  const distributions = useHasanatDistributionsCollection();
  const denominations = useHasanatDenomsCollection();
  const {
    hasanatChartType: chartType,
    hasanatChartColor: colorTheme,
    updatePref,
  } = useDashboardConfig();

  const { hasanatData, total, activeColors } = useMemo(() => {
    let memorisationPoints = 0;
    let attendancePoints = 0;
    let behaviorPoints = 0;

    distributions.forEach((distribution) => {
      if (!distribution) return;
      const points = getDenominationPoints(distribution.denominationId, distribution.denominationName, denominations);
      const totalPoints = Number(distribution.quantity || 1) * points;
      const reason = String(distribution.reason || '').toLowerCase();
      if (reason.includes('attendance') || reason.includes('absence')) {
        attendancePoints += totalPoints;
      } else if (
        reason.includes('juz') || reason.includes('hifz') || reason.includes('completion')
        || reason.includes('memorisation') || reason.includes('memorization') || reason.includes('milestone')
      ) {
        memorisationPoints += totalPoints;
      } else {
        behaviorPoints += totalPoints;
      }
    });

    const activeColors = HASANAT_THEMES[colorTheme] || HASANAT_THEMES.mixed;
    const data: HasanatPoint[] = [
      { name: t('dashboard.charts.hasanat.memorisation'), value: memorisationPoints, color: activeColors.mem },
      { name: t('dashboard.charts.hasanat.attendance'), value: attendancePoints, color: activeColors.att },
      { name: t('dashboard.charts.hasanat.behavior'), value: behaviorPoints, color: activeColors.beh },
    ];
    const sum = data.reduce((s, hasanatPoint) => s + hasanatPoint.value, 0);
    return { hasanatData: data, total: sum, activeColors };
  }, [distributions, denominations, colorTheme, HASANAT_THEMES, t]);

  return {
    t,
    chartType,
    colorTheme,
    updatePref,
    hasanatData,
    total,
    activeColors,
  };
}
