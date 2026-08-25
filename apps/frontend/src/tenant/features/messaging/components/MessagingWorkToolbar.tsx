import React, { type JSX } from 'react';
import type { ModuleColumnRegistryEntry } from '@mms/shared';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DateRangeFilterBar } from '@/components/ui/DateRangeFilterBar';
import { FilterChips } from '@/components/ui/FilterChips';
import { FormSelect } from '@/components/ui/FormSelect';
import { ModuleClearFiltersButton } from '@/components/ui/ModuleClearFiltersButton';
import { ModuleColumnCustomizer, type ModuleColumnCustomizerLabels } from '@/components/ui/ModuleColumnCustomizer';
import {
  ModuleFilterDivider,
  ModuleFilterDropdown,
  ModuleFilterRadioGroup,
} from '@/components/ui/ModuleFiltersMenuButton';
import { SearchBar } from '@/components/ui/SearchBar';
import { WorkViewModeToggle } from '@/components/ui/WorkViewModeToggle';
import { WORK_SURFACE } from '@/components/ui/formStyles';
import type { WorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { SEMANTIC_TEXT } from '@/lib/semanticTone';

export const MESSAGING_WORK_SEARCH_INPUT_ID = 'messaging-work-search';

export interface MessagingWorkToolbarProps {
  viewMode: WorkDirectoryViewMode;
  onViewModeChange: (mode: WorkDirectoryViewMode) => void;
  search: string;
  onSearchChange: (value: string) => void;
  channel: 'all' | 'sms' | 'whatsapp' | 'email';
  onChannelChange: (channel: 'all' | 'sms' | 'whatsapp' | 'email') => void;
  channelOptions: Array<{ value: string; label: string }>;
  status: 'all' | 'sent' | 'delivered' | 'failed' | 'skipped';
  onStatusChange: (status: 'all' | 'sent' | 'delivered' | 'failed' | 'skipped') => void;
  statusOptions: Array<{ value: string; label: string }>;
  category: string;
  onCategoryChange: (category: string) => void;
  categoryOptions: Array<{ value: string; label: string }>;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  onClearFilters: () => void;
  columnRegistry?: ModuleColumnRegistryEntry[];
  updateUserColumnLayout?: (columns: ModuleColumnRegistryEntry[]) => void;
  onResetColumnLayout?: () => void;
  columnCustomizerLabels?: ModuleColumnCustomizerLabels;
}

export function MessagingWorkToolbar({
  viewMode,
  onViewModeChange,
  search,
  onSearchChange,
  channel,
  onChannelChange,
  channelOptions,
  status,
  onStatusChange,
  statusOptions,
  category,
  onCategoryChange,
  categoryOptions,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  hasActiveFilters,
  activeFilterCount,
  onClearFilters,
  columnRegistry,
  updateUserColumnLayout,
  onResetColumnLayout,
  columnCustomizerLabels,
}: MessagingWorkToolbarProps): JSX.Element {
  const { t } = useTranslation();

  const channelLabel = channelOptions.find((o) => o.value === channel)?.label ?? channel;
  const statusLabel = statusOptions.find((o) => o.value === status)?.label ?? status;
  const categoryLabel = categoryOptions.find((o) => o.value === category)?.label ?? category;

  const handlePresetDate = (days: number): void => {
    const end = new Date();
    const start = new Date();
    if (days === 0) {
      const todayStr = end.toISOString().split('T')[0]!;
      onStartDateChange(todayStr);
      onEndDateChange(todayStr);
      return;
    }
    start.setDate(end.getDate() - days);
    onStartDateChange(start.toISOString().split('T')[0]!);
    onEndDateChange(end.toISOString().split('T')[0]!);
  };

  const clearDates = (): void => {
    onStartDateChange('');
    onEndDateChange('');
  };

  const isFailedOnly = status === 'failed';

  const chips = [
    search.trim() ? { key: `search:${search}`, label: `${t('common.search')}: "${search.trim()}"`, onRemove: () => onSearchChange('') } : null,
    channel !== 'all' ? { key: `channel:${channel}`, label: `${t('messaging.channel')}: ${channelLabel}`, onRemove: () => onChannelChange('all') } : null,
    status !== 'all' ? { key: `status:${status}`, label: `${t('common.status')}: ${statusLabel}`, onRemove: () => onStatusChange('all') } : null,
    category !== 'all' ? { key: `category:${category}`, label: `${t('messaging.category')}: ${categoryLabel}`, onRemove: () => onCategoryChange('all') } : null,
    startDate ? { key: `from:${startDate}`, label: `${t('messaging.dateFrom')}: ${startDate}`, onRemove: () => onStartDateChange('') } : null,
    endDate ? { key: `to:${endDate}`, label: `${t('messaging.dateTo')}: ${endDate}`, onRemove: () => onEndDateChange('') } : null,
  ].flatMap(c => c ? [c] : []);

  return (
    <>
      {/* Fix #6: aria-label scoped to toolbar function, not entire messaging section */}
      <div
        role="region"
        aria-label={t('messaging.toolbarAriaLabel')}
        className={cn(WORK_SURFACE, 'flex flex-col gap-3 p-3 sm:flex-row')}
      >
        <div className="relative min-w-0 flex-1">
          <SearchBar
            id={MESSAGING_WORK_SEARCH_INPUT_ID}
            value={search}
            onChange={onSearchChange}
            placeholder={t('messaging.search.placeholder')}
            className="w-full min-w-0"
          />
          <div className="pointer-events-none absolute end-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 md:flex">
            <kbd className="rounded border border-border/60 bg-muted/60 px-1.5 py-0.5 font-mono text-xs font-medium text-muted-foreground">
              /
            </kbd>
          </div>
        </div>

        <div className="flex max-w-full flex-wrap items-center gap-2 sm:flex-nowrap sm:overflow-x-auto">
          {/* Quick Failures-Only Filter Toggle */}
          <Button
            type="button"
            variant={isFailedOnly ? 'destructive' : 'outline'}
            size="sm"
            onClick={() => onStatusChange(isFailedOnly ? 'all' : 'failed')}
            className={cn(
              'h-10 text-xs gap-1.5 font-semibold shrink-0 transition-colors',
              isFailedOnly ? 'shadow-xs' : `border-destructive/30 ${SEMANTIC_TEXT.destructive} hover:bg-destructive/10`,
            )}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>{t('messaging.status.failed')}</span>
          </Button>

          <ModuleFilterDropdown
            label={t('common.filters')}
            activeCount={activeFilterCount}
            clearLabel={t('common.clearFilters')}
            onClear={onClearFilters}
          >
            <ModuleFilterRadioGroup
              label={t('messaging.channel')}
              value={channel}
              onValueChange={(val) => onChannelChange(val as typeof channel)}
              options={channelOptions}
            />
            <ModuleFilterDivider />
            <ModuleFilterRadioGroup
              label={t('common.status')}
              value={status}
              onValueChange={(val) => onStatusChange(val as typeof status)}
              options={statusOptions}
            />
            <ModuleFilterDivider />
            <div className="p-2 space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">{t('messaging.category')}</span>
              <FormSelect
                id="messagingCategoryFilter"
                value={category}
                onChange={onCategoryChange}
                options={categoryOptions}
                className="w-full text-xs"
              />
            </div>
            <ModuleFilterDivider />
            <div className="p-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">{t('messaging.dateSent')}</span>
              </div>
              {/* Fix #3: i18n-safe date preset labels */}
              <div className="flex flex-wrap gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetDate(0)}
                  className="h-6 px-2 text-[11px]"
                >
                  {t('datePicker.today')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetDate(7)}
                  className="h-6 px-2 text-[11px]"
                >
                  {t('messaging.datePreset7d')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetDate(30)}
                  className="h-6 px-2 text-[11px]"
                >
                  {t('messaging.datePreset30d')}
                </Button>
                {/* Fix #9: single batched clear callback */}
                {(startDate || endDate) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearDates}
                    className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    {t('datePicker.clear')}
                  </Button>
                )}
              </div>
              <DateRangeFilterBar
                idPrefix="messaging-work-filter"
                dateFrom={startDate}
                dateTo={endDate}
                onDateFromChange={onStartDateChange}
                onDateToChange={onEndDateChange}
                fromPlaceholder={t('messaging.dateFrom')}
                toPlaceholder={t('messaging.dateTo')}
                pickerClassName="w-full text-xs"
              />
            </div>
          </ModuleFilterDropdown>

          {hasActiveFilters && (
            <ModuleClearFiltersButton onClearFilters={onClearFilters} label={t('common.clearFilters')} />
          )}

          <WorkViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />

          {columnRegistry && updateUserColumnLayout && columnCustomizerLabels ? (
            <ModuleColumnCustomizer
              columnRegistry={columnRegistry}
              updateUserColumnLayout={updateUserColumnLayout}
              onResetLayout={onResetColumnLayout}
              labels={columnCustomizerLabels}
            />
          ) : null}
        </div>
      </div>

      <FilterChips chips={chips} onClearAll={onClearFilters} />
    </>
  );
}
