import React from 'react';
import {
  ModuleCommandMetricCard,
  type ModuleCommandMetricCardProps,
} from '@/components/ui/ModuleCommandMetricCard';

interface MetricItem {
  icon: ModuleCommandMetricCardProps['icon'];
  label: string;
  value: string | number;
  accent?: ModuleCommandMetricCardProps['accent'];
  onClick?: ModuleCommandMetricCardProps['onClick'];
}

interface ModuleCommandMetricsGridProps {
  items: MetricItem[];
}

/**
 * Renders a responsive grid of metric cards with automated column width calculation
 * and staggered Framer Motion entrance animations.
 */
export function ModuleCommandMetricsGrid({ items }: ModuleCommandMetricsGridProps): React.JSX.Element {
  const count = items.length;

  let gridColsClass = 'grid-cols-2 sm:grid-cols-3';
  if (count === 6) {
    gridColsClass += ' lg:grid-cols-6';
  } else if (count === 7) {
    gridColsClass += ' lg:grid-cols-4 xl:grid-cols-7';
  } else if (count === 8) {
    gridColsClass += ' lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-8';
  } else {
    gridColsClass += ` lg:grid-cols-${Math.min(count, 4)} xl:grid-cols-${count}`;
  }

  return (
    <div className={`grid ${gridColsClass} gap-2`}>
      {items.map((item, index) => (
        <ModuleCommandMetricCard
          key={item.label}
          icon={item.icon}
          label={item.label}
          value={item.value}
          accent={item.accent}
          delayIndex={index}
          onClick={item.onClick}
        />
      ))}
    </div>
  );
}
