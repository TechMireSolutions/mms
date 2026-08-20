import React from 'react';
import { Card } from '@/components/ui/card';
import { CardTitleBar } from '@/components/ui/CardTitleBar';
import { cn } from '@/lib/utils';
import { CARD_STRIPE_INSET } from '@/lib/semanticTone';

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
    <Card accentColor="primary" className="p-0 overflow-hidden">
      <CardTitleBar
        headingLevel={3}
        inset
        icon={<Icon className="h-3.5 w-3.5 text-primary/70 group-hover/card:text-primary transition-colors" aria-hidden />}
        title={title}
      />
      <div className={cn("px-5 pb-1", CARD_STRIPE_INSET)}>{children}</div>
    </Card>
  );
}
