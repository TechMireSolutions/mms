import React from 'react';
import { Rows4, Rows3, Rows2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import type { AppTranslationKey } from '@mms/shared';
import type { PlatformDensity } from '@/platform/hooks/usePlatformDensity';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface PlatformWorkspaceDensityToggleProps {
  density: PlatformDensity;
  onDensityChange: (density: PlatformDensity) => void;
  className?: string;
}

interface DensityOption {
  key: PlatformDensity;
  labelKey: AppTranslationKey;
  defaultLabel: string;
  icon: React.ElementType;
}

const DENSITY_OPTIONS: readonly DensityOption[] = [
  { key: 'compact', labelKey: 'dashboard.densityCompact', defaultLabel: 'Compact (38px)', icon: Rows4 },
  { key: 'standard', labelKey: 'dashboard.densityStandard', defaultLabel: 'Standard (48px)', icon: Rows3 },
  { key: 'comfortable', labelKey: 'dashboard.densityComfortable', defaultLabel: 'Comfortable (64px)', icon: Rows2 },
] as const;

export function PlatformWorkspaceDensityToggle({
  density,
  onDensityChange,
  className,
}: PlatformWorkspaceDensityToggleProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <TooltipProvider delayDuration={150}>
      <div
        role="group"
        aria-label={t('dashboard.layoutDensity') || 'Data display density'}
        className={cn(
          'inline-flex items-center rounded-xl border border-border/60 bg-muted/30 p-0.5 shadow-2xs',
          className,
        )}
      >
        {DENSITY_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isSelected = density === opt.key;
          const label = t(opt.labelKey) || opt.defaultLabel;

          return (
            <Tooltip key={opt.key}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onDensityChange(opt.key)}
                  aria-label={label}
                  aria-pressed={isSelected}
                  className={cn(
                    'h-9 w-9 min-h-11 min-w-11 rounded-lg transition-all cursor-pointer',
                    isSelected
                      ? 'bg-card text-foreground shadow-xs font-semibold'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-3xs">
                {label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
