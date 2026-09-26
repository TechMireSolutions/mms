import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { CARD_STRIPE_BASE, CARD_STRIPE_INSET } from '@/lib/semanticTone';
import type { ModuleDefinition } from '@mms/shared';

export interface PlatformModuleSelectCardProps {
  module: ModuleDefinition;
  selected: boolean;
  disabled?: boolean;
  icon?: React.ElementType;
  onToggle: (id: string, checked: boolean) => void;
  className?: string;
}

/**
 * Reusable module selection card primitive for platform onboarding and workspace module configuration.
 */
export function PlatformModuleSelectCard({
  module,
  selected,
  disabled = false,
  icon: Icon,
  onToggle,
  className,
}: PlatformModuleSelectCardProps): React.JSX.Element {
  const { t } = useTranslation();
  const isDisabled = disabled || module.required;

  return (
    <label
      htmlFor={`module-${module.id}`}
      className={cn(
        'relative overflow-hidden group/card flex items-start gap-3 rounded-2xl border p-3.5 shadow-2xs transition-all cursor-pointer select-none text-start',
        CARD_STRIPE_INSET,
        selected
          ? 'border-primary/40 bg-primary/5 shadow-xs'
          : 'border-border/60 bg-card/60 hover:bg-card hover:border-border',
        isDisabled && 'cursor-default opacity-85',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          CARD_STRIPE_BASE,
          selected ? 'bg-primary' : 'bg-primary/30 group-hover/card:bg-primary/50',
          'transition-colors duration-150 ease-out',
        )}
      />
      <Checkbox
        id={`module-${module.id}`}
        checked={selected}
        disabled={isDisabled}
        onCheckedChange={(checked) => onToggle(module.id, Boolean(checked))}
        className="mt-0.5"
      />
      <div className="space-y-1 min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {Icon ? (
            <Icon
              className={cn(
                'w-3.5 h-3.5 shrink-0',
                selected ? 'text-primary' : 'text-muted-foreground',
              )}
              aria-hidden
            />
          ) : null}
          <span className="text-xs font-bold text-foreground truncate">
            {module.label}
          </span>
          {module.required ? (
            <Badge as="span" tone="muted" size="sm" pill className="ms-auto font-semibold">
              {t('platform.moduleRequired')}
            </Badge>
          ) : null}
        </div>
        <p className="text-3xs text-muted-foreground leading-relaxed">
          {module.description}
        </p>
      </div>
    </label>
  );
}
