import React, { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Loader2, LocateFixed, MapPin, Search } from 'lucide-react';
import {
  DEFAULT_GLOBAL_SETTINGS,
  detectBrowserTimezone,
  formatTimezoneLabel,
  getTimezoneOptions,
  groupTimezoneOptions,
  normalizeTimezone,
  type AppTranslationKey,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { notify } from '@/lib/notify';
import { detectTimezoneFromLocation } from '@/lib/detectTimezoneFromLocation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface TimezoneSelectProps {
  id?: string;
  value: string;
  onChange: (timezone: string) => void;
  disabled?: boolean;
}

function filterGrouped(
  grouped: ReturnType<typeof groupTimezoneOptions>,
  query: string,
): ReturnType<typeof groupTimezoneOptions> {
  const q = query.trim().toLowerCase();
  if (!q) return grouped;
  return grouped
    .map((group) => ({
      ...group,
      options: group.options.filter(
        (opt) => opt.keywords.includes(q) || opt.label.toLowerCase().includes(q),
      ),
    }))
    .filter((group) => group.options.length > 0);
}

function detectionErrorKey(
  code: 'geolocation_unsupported' | 'permission_denied' | 'position_unavailable' | 'timeout' | 'timezone_lookup_failed',
): AppTranslationKey {
  const map: Record<typeof code, AppTranslationKey> = {
    geolocation_unsupported: 'global.timezoneDetectUnsupported',
    permission_denied: 'global.timezoneDetectDenied',
    position_unavailable: 'global.timezoneDetectUnavailable',
    timeout: 'global.timezoneDetectTimeout',
    timezone_lookup_failed: 'global.timezoneDetectFailed',
  };
  return map[code];
}

/**
 * Searchable IANA timezone picker with GPS and device auto-detect.
 */
export default function TimezoneSelect({
  id,
  value,
  onChange,
  disabled = false,
}: TimezoneSelectProps): React.JSX.Element {
  const { t, language } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [detecting, setDetecting] = useState(false);

  const normalizedValue = normalizeTimezone(value, DEFAULT_GLOBAL_SETTINGS.timezone);
  const options = useMemo(() => getTimezoneOptions(language), [language]);
  const grouped = useMemo(() => groupTimezoneOptions(options), [options]);
  const filtered = useMemo(() => filterGrouped(grouped, query), [grouped, query]);
  const selectedLabel = formatTimezoneLabel(normalizedValue, language);

  const applyTimezone = (timezone: string, closePopover = false): void => {
    onChange(timezone);
    if (closePopover) {
      setOpen(false);
      setQuery('');
    }
  };

  const applyDeviceTimezone = (): void => {
    applyTimezone(detectBrowserTimezone(), true);
  };

  const handleLocationDetect = async (): Promise<void> => {
    if (detecting || disabled) return;
    setDetecting(true);
    try {
      const result = await detectTimezoneFromLocation();
      if (result.ok) {
        applyTimezone(result.timezone, true);
        const label = formatTimezoneLabel(result.timezone, language);
        notify.success(t('global.timezoneDetectSuccess'), {
          description:
            result.source === 'geolocation'
              ? t('global.timezoneDetectSuccessGps', { label })
              : t('global.timezoneDetectSuccessDevice', { label }),
        });
        return;
      }

      const errorKey = detectionErrorKey(result.code);
      const useFallback =
        result.code !== 'permission_denied' && result.code !== 'geolocation_unsupported';

      if (useFallback) {
        applyTimezone(result.fallbackTimezone, true);
        notify.warning(t(errorKey), {
          description: t('global.timezoneDetectFallback', {
            label: formatTimezoneLabel(result.fallbackTimezone, language),
          }),
        });
      } else {
        notify.error(t(errorKey), {
          description: t('global.timezoneDetectDeniedHint'),
        });
      }
    } finally {
      setDetecting(false);
    }
  };

  const handleOpenChange = (next: boolean): void => {
    setOpen(next);
    if (!next) setQuery('');
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label={t('global.timezone')}
            disabled={disabled}
            className={cn(
              'h-auto min-h-[44px] w-full justify-between px-3 py-2 font-normal sm:flex-1',
              !normalizedValue && 'text-muted-foreground',
            )}
          >
            <span className="truncate text-left text-sm">{selectedLabel}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" aria-hidden />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(100vw-2rem,24rem)] p-0" align="start">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" aria-hidden />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('global.timezoneSearch')}
              className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              aria-label={t('global.timezoneSearch')}
            />
          </div>
          <div className="max-h-[min(50vh,20rem)] overflow-y-auto p-1">
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start items-center gap-2 rounded-sm px-2 py-2 text-left font-normal hover:bg-accent hover:text-accent-foreground"
              onClick={() => void handleLocationDetect()}
              disabled={detecting}
            >
              {detecting ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
              ) : (
                <MapPin className="h-4 w-4 text-primary" aria-hidden />
              )}
              {detecting ? t('global.timezoneDetecting') : t('global.timezoneDetectLocation')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start items-center gap-2 rounded-sm px-2 py-2 text-left font-normal hover:bg-accent hover:text-accent-foreground"
              onClick={applyDeviceTimezone}
            >
              <LocateFixed className="h-4 w-4 text-primary" aria-hidden />
              {t('global.timezoneUseDevice')}
            </Button>
            <div className="my-1 h-px bg-border" role="separator" />
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {t('global.timezoneNoResults')}
              </p>
            ) : (
              filtered.map(({ region, options: regionOptions }) => (
                <div key={region} className="mb-1">
                  <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">{region}</p>
                  {regionOptions.map((opt) => (
                    <Button
                      key={opt.value}
                      type="button"
                      variant="ghost"
                      className={cn(
                        'w-full justify-start items-center gap-2 rounded-sm px-2 py-1.5 text-left font-normal hover:bg-accent hover:text-accent-foreground',
                        normalizedValue === opt.value && 'bg-accent text-accent-foreground',
                      )}
                      onClick={() => applyTimezone(opt.value, true)}
                    >
                      <Check
                        className={cn(
                          'h-4 w-4 shrink-0',
                          normalizedValue === opt.value ? 'opacity-100' : 'opacity-0',
                        )}
                        aria-hidden
                      />
                      <span className="truncate">{opt.label}</span>
                      <span className="ml-auto pl-2 font-mono text-[10px] text-muted-foreground">
                        {opt.value}
                      </span>
                    </Button>
                  ))}
                </div>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>

      <Button
        type="button"
        variant="outline"
        disabled={disabled || detecting}
        onClick={() => void handleLocationDetect()}
        className="shrink-0 gap-2"
        aria-label={t('global.timezoneDetectLocation')}
      >
        {detecting ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <MapPin className="h-4 w-4" aria-hidden />
        )}
        <span>{detecting ? t('global.timezoneDetecting') : t('global.timezoneDetectLocation')}</span>
      </Button>
    </div>
  );
}
