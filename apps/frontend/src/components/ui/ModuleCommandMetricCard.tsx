import React from 'react';

export interface ModuleCommandMetricCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  onClick?: () => void;
}

/** Single metric tile for module command centres (globle1 §2.1). */
export default function ModuleCommandMetricCard({
  icon: Icon,
  label,
  value,
  onClick,
}: ModuleCommandMetricCardProps): React.JSX.Element {
  const className =
    'flex items-center gap-3 rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm px-4 py-3 min-h-[44px] w-full text-left transition-colors';
  const interactiveClass = onClick ? ' cursor-pointer hover:border-primary/40 hover:bg-card/80' : '';

  const content = (
    <>
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
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
      <button type="button" onClick={onClick} className={`${className}${interactiveClass}`}>
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}
