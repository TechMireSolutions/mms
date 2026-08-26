import React from 'react';
import { Calendar } from 'lucide-react';
import { DateRangeFilterBar } from '@/components/ui/DateRangeFilterBar';
import { useTranslation } from '@/hooks/useTranslation';
import { FormSelect } from '@/components/ui/FormSelect';
import { Input } from '@/components/ui/input';
import type { AppTranslationKey } from '@mms/shared';
import { capitalize } from '@mms/shared';
import type { ReportFilterFields } from './ReportFilters';

const STATUSES: string[] = ['all', 'active', 'inactive', 'completed'];

interface ReportFilterFieldsPanelProps {
  allowed: (keyof ReportFilterFields)[];
  filters: ReportFilterFields;
  onFieldChange: (key: keyof ReportFilterFields, value: string) => void;
  sessions: Array<{ id: string; name: string }>;
  classes: Array<{ id: string; name: string }>;
}

export function ReportFilterFieldsPanel({
  allowed,
  filters,
  onFieldChange,
  sessions,
  classes,
}: ReportFilterFieldsPanelProps): React.JSX.Element {
  const { t } = useTranslation();
  const showDateFrom = allowed.includes('dateFrom');
  const showDateTo = allowed.includes('dateTo');

  return (
    <div className="px-4 pb-4 flex flex-wrap gap-4 border-t border-border/50 pt-4">
      {allowed.includes('session') && (
        <div className="flex flex-col gap-1 text-start min-w-filter-lg flex-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('reports.filters.session')}</label>
          <FormSelect
            value={filters.session}
            onChange={(val) => onFieldChange('session', val)}
            options={sessions.map((session) => ({ value: session.id, label: session.name }))}
            className="w-full"
          />
        </div>
      )}

      {allowed.includes('class') && (
        <div className="flex flex-col gap-1 text-start min-w-filter-lg flex-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('reports.filters.class')}</label>
          <FormSelect
            value={filters.class}
            onChange={(val) => onFieldChange('class', val)}
            options={classes.map((sessionClass) => ({ value: sessionClass.id, label: sessionClass.name }))}
            className="w-full"
          />
        </div>
      )}

      {allowed.includes('status') && (
        <div className="flex flex-col gap-1 text-start min-w-filter-sm flex-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('reports.filters.status')}</label>
          <FormSelect
            value={filters.status}
            onChange={(val) => onFieldChange('status', val)}
            options={STATUSES.map((status) => ({
              value: status,
              label: status === 'all'
                ? t('reports.filters.allStatuses')
                : t(`reports.filters.status${capitalize(status)}` as AppTranslationKey),
            }))}
            className="w-full"
          />
        </div>
      )}

      {(showDateFrom || showDateTo) && (
        <DateRangeFilterBar
          idPrefix="report-filters"
          dateFrom={filters.dateFrom}
          dateTo={filters.dateTo}
          onDateFromChange={(value) => onFieldChange('dateFrom', value)}
          onDateToChange={(value) => onFieldChange('dateTo', value)}
          showFrom={showDateFrom}
          showTo={showDateTo}
          fromLabel={
            showDateFrom ? (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" aria-hidden="true" />
                {t('reports.filters.from')}
              </span>
            ) : undefined
          }
          toLabel={
            showDateTo ? (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" aria-hidden="true" />
                {t('reports.filters.to')}
              </span>
            ) : undefined
          }
          className="min-w-filter-md flex-1 gap-4"
          pickerClassName="w-full min-w-0"
        />
      )}

      {allowed.includes('student') && (
        <div className="flex flex-col gap-1 text-start min-w-filter-xl flex-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('reports.filters.student')}</label>
          <Input
            type="text"
            value={filters.student}
            onChange={(event) => onFieldChange('student', event.target.value)}
            placeholder={t('reports.filters.searchName')}
            className="text-sm border-border/50 bg-background/50 backdrop-blur-sm focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
          />
        </div>
      )}
    </div>
  );
}
