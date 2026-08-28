import React from 'react';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/hooks/useTranslation';
import { usePlatformLanguage } from '@/platform/hooks/usePlatformLanguage';
import { cn } from '@/lib/utils';
import type { AppLanguageCode } from '@mms/shared';

export function PlatformLanguagePicker({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  const { platformLanguage, setPlatformLanguage, languages } = usePlatformLanguage();

  const current = languages.find((l) => l.code === platformLanguage) ?? languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-label={t('global.language')}
          className={cn(
            'relative flex items-center gap-1.5 rounded-xl text-xs text-muted-foreground border-border/80 hover:bg-muted/80 transition-colors cursor-pointer',
            compact ? 'h-11 w-11 p-0 justify-center min-h-11 min-w-11' : 'h-11 px-3 py-1.5 min-h-11',
          )}
        >
          <Globe className="h-4 w-4 shrink-0" aria-hidden />
          {!compact && (
            <span className="hidden md:inline font-semibold text-foreground">
              {current.nativeLabel}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 p-1.5 rounded-2xl shadow-xl border-border/60">
        <DropdownMenuLabel className="text-2xs font-bold text-muted-foreground uppercase tracking-wider px-2 py-1">
          {t('global.language')}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1" />
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            dir={lang.direction}
            onClick={() => setPlatformLanguage(lang.code as AppLanguageCode)}
            className={cn(
              'rounded-xl text-xs gap-2.5 min-h-10 cursor-pointer justify-between',
              platformLanguage === lang.code && 'bg-primary/10 text-primary font-bold',
            )}
          >
            <span className="font-semibold">{lang.nativeLabel}</span>
            <span className="text-muted-foreground text-2xs font-medium">{lang.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
