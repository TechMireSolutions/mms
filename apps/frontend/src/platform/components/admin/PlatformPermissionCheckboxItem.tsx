import React, { useId } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from '@/hooks/useTranslation';
import { SEMANTIC_BADGE } from '@/lib/semanticTone';
import { cn } from '@/lib/utils';

export interface PlatformPermissionCheckboxItemProps {
  name: string;
  label: string;
  description: string;
  icon: LucideIcon;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

export function PlatformPermissionCheckboxItem({
  name,
  label,
  description,
  icon: Icon,
  checked,
  disabled = false,
  onChange,
}: PlatformPermissionCheckboxItemProps): React.JSX.Element {
  const { t } = useTranslation();
  const inputId = useId();

  return (
    <label
      htmlFor={inputId}
      className={cn(
        'flex min-h-12 cursor-pointer items-start gap-3.5 p-3 rounded-xl border border-border/40 bg-card/60 hover:bg-accent/20 transition-all select-none',
        checked && 'border-primary/40 bg-primary/5',
        disabled && 'opacity-60 cursor-not-allowed',
      )}
    >
      <Checkbox
        id={inputId}
        name={name}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(c) => onChange(c === true)}
        className="mt-1"
      />
      <div className="flex-1 min-w-0 text-start space-y-1">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden />
          <span className="text-xs font-bold text-foreground">{label}</span>
          <span
            className={cn(
              'ms-auto text-2xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider',
              checked ? SEMANTIC_BADGE.success : 'bg-muted text-muted-foreground',
            )}
          >
            {checked ? t('platform.workspaceActive') : t('platform.workspaceInactive')}
          </span>
        </div>
        <p className="text-3xs font-medium text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </label>
  );
}
