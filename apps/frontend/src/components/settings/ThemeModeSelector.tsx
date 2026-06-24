import React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { THEME_MODE_OPTIONS, type ThemeMode } from '@mms/shared';
import useTranslation from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const MODE_ICONS = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const;

interface ThemeModeSelectorProps {
  value: ThemeMode;
  onChange: (mode: ThemeMode) => void;
}

/**
 * Light / dark / system display mode — single control surface (Theme settings only).
 */
export default function ThemeModeSelector({ value, onChange }: ThemeModeSelectorProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="flex gap-2" role="group" aria-label={t('theme.displayModeTitle')}>
      {THEME_MODE_OPTIONS.map(({ value: mode, labelKey }) => {
        const Icon = MODE_ICONS[mode];
        return (
          <Button
            type="button"
            key={mode}
            variant="outline"
            onClick={() => onChange(mode)}
            aria-pressed={value === mode}
            className={cn(
              'flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg border py-2 text-[12px] font-semibold transition-all',
              value === mode
                ? 'border-primary bg-primary/5 text-primary hover:bg-primary/5 hover:text-primary'
                : 'border-border text-muted-foreground hover:bg-muted',
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            <span>{t(labelKey)}</span>
          </Button>
        );
      })}
    </div>
  );
}
