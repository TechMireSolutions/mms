import React from 'react';
import { WORK_SURFACE_INNER } from '@/components/ui/formStyles';
import { cn } from '@/lib/utils';

export function UserDetailModalRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-2.5 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-end text-xs font-semibold text-foreground">{value || '—'}</span>
    </div>
  );
}

export function UserDetailModalSection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className={cn(WORK_SURFACE_INNER, 'relative overflow-hidden group/card transition-all duration-300')}>
      <div className="absolute start-0 top-0 bottom-0 w-1.5 bg-primary/60 transition-colors group-hover/card:bg-primary" />
      <div className="flex items-center gap-2 border-b border-border/40 bg-muted/20 px-4 py-2.5 ps-5.5">
        <Icon className="h-3.5 w-3.5 text-primary/70 group-hover/card:text-primary transition-colors" aria-hidden />
        <p className="text-xs font-black uppercase tracking-wider text-foreground m-0">{title}</p>
      </div>
      <div className="px-5 pb-1">{children}</div>
    </div>
  );
}
