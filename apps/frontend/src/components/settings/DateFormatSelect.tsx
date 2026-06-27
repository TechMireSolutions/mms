import React, { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Languages } from 'lucide-react';
import {
  DEFAULT_GLOBAL_SETTINGS,
  detectLocaleDateFormat,
  getDateFormatOptions,
  normalizeDateFormat,
  type AppLanguageCode,
  type AppTranslationKey,
  type DateFormatId,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { notify } from '@/lib/notify';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DateFormatSelectProps {
  id?: string;
  value: string;
  onChange: (format: string) => void;
  language: AppLanguageCode;
  disabled?: boolean;
}

/**
 * Date format picker with live samples and locale-based auto-detect.
 */
export default function DateFormatSelect({
  id,
  value,
  onChange,
  language,
  disabled = false,
}: DateFormatSelectProps): React.JSX.Element {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const normalizedValue = normalizeDateFormat(
    value,
    DEFAULT_GLOBAL_SETTINGS.dateFormat as DateFormatId,
  );
  const options = useMemo(() => getDateFormatOptions(language), [language]);
  const selected = options.find((opt) => opt.value === normalizedValue) ?? options[0];

  const applyLocaleFormat = (): void => {
    const detected = detectLocaleDateFormat(language);
    onChange(detected);
    setOpen(false);
    const sample = options.find((opt) => opt.value === detected)?.sample ?? detected;
    notify.success(t('global.dateFormatMatchSuccess'), {
      description: t('global.dateFormatMatchSuccessDesc', { pattern: detected, sample }),
    });
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label={t('global.dateFormat')}
            disabled={disabled}
            className={cn(
              'h-auto min-h-[44px] w-full justify-between px-3 py-2 font-normal sm:flex-1',
            )}
          >
            <span className="truncate text-left text-sm">
              <span className="font-mono">{selected.pattern}</span>
              <span className="mx-2 text-muted-foreground">·</span>
              <span className="text-muted-foreground">{selected.sample}</span>
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" aria-hidden />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(100vw-2rem,22rem)] p-1" align="start">
          <div className="max-h-[min(50vh,18rem)] overflow-y-auto">
            {options.map((opt) => (
              <Button
                key={opt.value}
                type="button"
                variant="ghost"
                className={cn(
                  'h-auto w-full justify-start items-start gap-2 rounded-sm px-2 py-2 text-left font-normal hover:bg-accent hover:text-accent-foreground',
                  normalizedValue === opt.value && 'bg-accent text-accent-foreground',
                )}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    'mt-0.5 h-4 w-4 shrink-0',
                    normalizedValue === opt.value ? 'opacity-100' : 'opacity-0',
                  )}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-mono text-xs">{opt.pattern}</span>
                  <span className="block text-muted-foreground text-left">{opt.sample}</span>
                  <span className="block text-left text-[11px] text-muted-foreground/80">
                    {t(opt.hintKey as AppTranslationKey)}
                  </span>
                </span>
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={applyLocaleFormat}
        className="shrink-0 gap-2"
        aria-label={t('global.dateFormatMatchLanguage')}
      >
        <Languages className="h-4 w-4" aria-hidden />
        <span>{t('global.dateFormatMatchLanguage')}</span>
      </Button>
    </div>
  );
}
