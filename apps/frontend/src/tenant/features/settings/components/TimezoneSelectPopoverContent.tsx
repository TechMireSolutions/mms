import React from 'react';
import { Check, Loader2, LocateFixed, MapPin, Search } from 'lucide-react';
import type { TranslationFunction } from '@/lib/contexts/TranslationContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PopoverContent } from '@/components/ui/popover';

interface TimezoneSelectPopoverContentProps {
  t: TranslationFunction;
  language: string;
  normalizedValue: string;
  query: string;
  setQuery: (query: string) => void;
  detecting: boolean;
  filtered: ReturnType<typeof import('@mms/shared').groupTimezoneOptions>;
  onLocationDetect: () => Promise<void>;
  onDeviceTimezone: () => void;
  onSelectTimezone: (timezone: string) => void;
}

export function TimezoneSelectPopoverContent({
  t,
  language,
  normalizedValue,
  query,
  setQuery,
  detecting,
  filtered,
  onLocationDetect,
  onDeviceTimezone,
  onSelectTimezone,
}: TimezoneSelectPopoverContentProps): React.JSX.Element {
  return (
    <PopoverContent className="w-popover-wide p-0" align="start">
      <div className="flex items-center border-b px-3">
        <Search className="me-2 h-4 w-4 shrink-0 opacity-50" aria-hidden />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('global.timezoneSearch')}
          className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          aria-label={t('global.timezoneSearch')}
        />
      </div>
      <div className="max-h-popover-scroll overflow-y-auto p-1">
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-start items-center gap-2 rounded-sm px-2 py-2 text-start font-normal hover:bg-accent hover:text-accent-foreground"
          onClick={() => void onLocationDetect()}
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
          className="w-full justify-start items-center gap-2 rounded-sm px-2 py-2 text-start font-normal hover:bg-accent hover:text-accent-foreground"
          onClick={onDeviceTimezone}
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
              {regionOptions.map((timezoneOption) => (
                <Button
                  key={timezoneOption.value}
                  type="button"
                  variant="ghost"
                  className={cn(
                    'w-full justify-start items-center gap-2 rounded-sm px-2 py-1.5 text-start font-normal hover:bg-accent hover:text-accent-foreground',
                    normalizedValue === timezoneOption.value && 'bg-accent text-accent-foreground',
                  )}
                  onClick={() => onSelectTimezone(timezoneOption.value)}
                >
                  <Check
                    className={cn(
                      'h-4 w-4 shrink-0',
                      normalizedValue === timezoneOption.value ? 'opacity-100' : 'opacity-0',
                    )}
                    aria-hidden
                  />
                  <span className="truncate">{timezoneOption.label}</span>
                  <span className="ms-auto ps-2 font-mono text-xs text-muted-foreground">
                    {timezoneOption.value}
                  </span>
                </Button>
              ))}
            </div>
          ))
        )}
      </div>
    </PopoverContent>
  );
}
