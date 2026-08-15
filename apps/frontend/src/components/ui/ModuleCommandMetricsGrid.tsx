import React from 'react';
import { StatCard, type StatCardProps } from '@/components/ui/StatCard';

interface MetricItem {
  icon?: StatCardProps['icon'];
  label: string;
  value: string | number;
  sub?: StatCardProps['sub'];
  accent?: StatCardProps['accent'];
  onClick?: StatCardProps['onClick'];
  isActive?: StatCardProps['isActive'];
}

interface ModuleCommandMetricsGridProps {
  items: MetricItem[];
}

const GRID_COLS_BY_COUNT: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
  6: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6',
  7: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-7',
  8: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-8',
};

export const ModuleCommandMetricsGrid = React.memo(function ModuleCommandMetricsGrid({
  items,
}: ModuleCommandMetricsGridProps): React.JSX.Element {
  const count = items.length;
  const gridColsClass = GRID_COLS_BY_COUNT[count] ?? GRID_COLS_BY_COUNT[4];

  return (
    <div className={`grid ${gridColsClass} gap-2`}>
      {items.map((item, index) => (
        <StatCard
          key={item.label}
          icon={item.icon}
          label={item.label}
          value={item.value}
          sub={item.sub}
          accent={item.accent}
          delayIndex={index}
          onClick={item.onClick}
          isActive={item.isActive}
          variant="compact"
        />
      ))}
    </div>
  );
});
