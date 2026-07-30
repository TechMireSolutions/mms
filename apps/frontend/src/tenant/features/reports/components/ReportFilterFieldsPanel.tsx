import React from 'react';
import { Calendar } from 'lucide-react';
import { DatePicker } from '@/components/ui/DatePicker';
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

  return (
    <div className="px-4 pb-4 flex flex-wrap gap-4 border-t border-border/50 pt-4">
      {allowed.includes('session') && (
        <div className="flex flex-col gap-1 text-start min-w-[8.75rem] flex-1">
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
        <div className="flex flex-col gap-1 text-start min-w-[8.75rem] flex-1">
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
        <div className="flex flex-col gap-1 text-start min-w-[7.5rem] flex-1">
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

      {allowed.includes('dateFrom') && (
        <div className="flex flex-col gap-1 text-start min-w-[8.125rem] flex-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <Calendar className="w-3 h-3" />{t('reports.filters.from')}
          </label>
          <DatePicker value={filters.dateFrom} onChange={(value) => onFieldChange('dateFrom', value)} />
        </div>
      )}

      {allowed.includes('dateTo') && (
        <div className="flex flex-col gap-1 text-start min-w-[8.125rem] flex-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <Calendar className="w-3 h-3" />{t('reports.filters.to')}
          </label>
          <DatePicker value={filters.dateTo} onChange={(value) => onFieldChange('dateTo', value)} />
        </div>
      )}

      {allowed.includes('student') && (
        <div className="flex flex-col gap-1 text-start min-w-[9.375rem] flex-1">
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
