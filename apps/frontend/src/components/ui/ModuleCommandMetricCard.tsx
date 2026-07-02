import React from 'react';

export interface ModuleCommandMetricCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  onClick?: () => void;
}

/** Single metric tile for module command centres (globle1 §2.1). */
export function ModuleCommandMetricCard({
  icon: Icon,
  label,
  value,
  onClick,
}: ModuleCommandMetricCardProps): React.JSX.Element {
  const baseClass =
    'relative overflow-hidden group/metric flex items-center gap-3 rounded-2xl border border-border/80 bg-card/45 backdrop-blur-sm px-4 py-3 pl-5.5 min-h-[44px] w-full text-left transition-all duration-300 shadow-sm';
  const interactiveClass = onClick ? ' cursor-pointer hover:shadow-md hover:border-primary/40 hover:bg-card/75' : '';

  const content = (
    <>
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/45 transition-colors group-hover/metric:bg-primary" />
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 ml-0.5">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide truncate">{label}</p>
        <p className="text-lg font-bold text-foreground leading-tight tabular-nums">{value.toLocaleString()}</p>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${baseClass}${interactiveClass}`}>
        {content}
      </button>
    );
  }

  return <div className={baseClass}>{content}</div>;
}
