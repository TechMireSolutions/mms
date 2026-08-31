import React from 'react';
import { Calendar } from 'lucide-react';
import { DateRangeFilterBar } from '@/components/ui/DateRangeFilterBar';
import { useTranslation } from '@/hooks/useTranslation';
import { FormSelect } from '@/components/ui/FormSelect';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  STUDENT_STATUS_VALUES,
  TEACHER_STATUS_VALUES,
  ENROLLMENT_STATUSES,
  ATTENDANCE_RECORD_STATUSES,
  type AppTranslationKey,
  toTitleCase,
} from '@mms/shared';
import type { ReportFilterFields } from './ReportFilters';
import { calculateReportDateRange } from '@/lib/reports/reportDateUtils';

interface ReportFilterFieldsPanelProps {
  category?: string;
  allowed: (keyof ReportFilterFields)[];
  filters: ReportFilterFields;
  onFieldChange: (key: keyof ReportFilterFields, value: string) => void;
  sessions: Array<{ id: string; name: string }>;
  classes: Array<{ id: string; name: string }>;
}

export function ReportFilterFieldsPanel({
  category,
  allowed,
  filters,
  onFieldChange,
  sessions,
  classes,
}: ReportFilterFieldsPanelProps): React.JSX.Element {
  const { t } = useTranslation();
  const showDateFrom = allowed.includes('dateFrom');
  const showDateTo = allowed.includes('dateTo');

  const normalizedCategory = (() => {
    const c = category?.toLowerCase() || '';
    if (c === 'faculty') return 'teachers';
    if (c === 'financial') return 'finance';
    if (c === 'academic') return 'examinations';
    if (c === 'questionbank') return 'question-bank';
    return c;
  })();

  const statusOptions = (() => {
    let rawStatuses: readonly string[] = ['all'];

    switch (normalizedCategory) {
      case 'students':
        rawStatuses = ['all', ...STUDENT_STATUS_VALUES];
        break;
      case 'teachers':
        rawStatuses = ['all', ...TEACHER_STATUS_VALUES];
        break;
      case 'enrollments':
        rawStatuses = ['all', ...ENROLLMENT_STATUSES];
        break;
      case 'attendance':
        rawStatuses = ['all', ...ATTENDANCE_RECORD_STATUSES];
        break;
      case 'finance':
        rawStatuses = ['all', 'unpaid', 'paid', 'partial', 'overdue', 'cancelled'];
        break;
      case 'sessions':
        rawStatuses = ['all', 'active', 'upcoming', 'completed', 'cancelled'];
        break;
      case 'users':
        rawStatuses = ['all', 'active', 'inactive', 'suspended'];
        break;
      default:
        rawStatuses = ['all', 'active', 'inactive', 'completed'];
        break;
    }

    return rawStatuses.map((st) => {
      if (st === 'all') {
        return { value: 'all', label: t('reports.filters.allStatuses') };
      }

      // Try module-specific translation keys first
      let label = '';
      if (normalizedCategory === 'students') {
        label = t(`students.status.${st}` as AppTranslationKey);
      } else if (normalizedCategory === 'teachers') {
        label = t(`teachers.status.${st}` as AppTranslationKey);
      } else if (normalizedCategory === 'enrollments') {
        label = t(`enrollments.status.${st}` as AppTranslationKey);
      } else if (normalizedCategory === 'attendance') {
        label = t(`attendance.status.${st}` as AppTranslationKey);
      } else if (normalizedCategory === 'finance') {
        label = t(`finance.invoiceStatus.${st}` as AppTranslationKey);
      } else if (normalizedCategory === 'sessions') {
        label = t(`sessions.status.${st}` as AppTranslationKey);
      } else if (normalizedCategory === 'users') {
        label = t(`users.status.${st}` as AppTranslationKey);
      }

      if (!label || label.startsWith('students.') || label.startsWith('teachers.') || label.startsWith('enrollments.') || label.startsWith('attendance.') || label.startsWith('finance.') || label.startsWith('sessions.') || label.startsWith('users.')) {
        label = toTitleCase(st.replace(/_/g, ' '));
      }

      return { value: st, label };
    });
  })();

  const searchLabel = (() => {
    if (normalizedCategory === 'teachers') return t('teachers.report.colFaculty');
    if (normalizedCategory === 'contacts') return t('contacts.columns.name');
    return t('reports.filters.student');
  })();

  const searchPlaceholder = (() => {
    if (normalizedCategory === 'teachers') return t('teachers.searchPlaceholder');
    if (normalizedCategory === 'contacts') return t('contacts.searchPlaceholder');
    return t('reports.filters.searchName');
  })();

  return (
    <div className="px-4 pb-4 flex flex-wrap gap-4 border-t border-border/50 pt-4">
      {allowed.includes('session') && (
        <div className="flex flex-col gap-1 text-start min-w-filter-lg flex-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {t('reports.filters.session')}
          </label>
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
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {t('reports.filters.class')}
          </label>
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
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {t('reports.filters.status')}
          </label>
          <FormSelect
            value={filters.status}
            onChange={(val) => onFieldChange('status', val)}
            options={statusOptions}
            className="w-full"
          />
        </div>
      )}

      {(showDateFrom || showDateTo) && (
        <div className="flex flex-col gap-1 min-w-filter-md flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {t('reports.comparison.dateRanges')}
            </span>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant={!filters.dateFrom && !filters.dateTo ? 'secondary' : 'ghost'}
                size="sm"
                className="h-6 px-1.5 text-3xs"
                onClick={() => {
                  const range = calculateReportDateRange('none');
                  onFieldChange('dateFrom', range.from);
                  onFieldChange('dateTo', range.to);
                }}
              >
                {t('common.none')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-3xs"
                onClick={() => {
                  const range = calculateReportDateRange('today');
                  onFieldChange('dateFrom', range.from);
                  onFieldChange('dateTo', range.to);
                }}
              >
                {t('datePicker.today')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-3xs"
                onClick={() => {
                  const range = calculateReportDateRange('7d');
                  onFieldChange('dateFrom', range.from);
                  onFieldChange('dateTo', range.to);
                }}
              >
                {t('messaging.datePreset7d')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-3xs"
                onClick={() => {
                  const range = calculateReportDateRange('30d');
                  onFieldChange('dateFrom', range.from);
                  onFieldChange('dateTo', range.to);
                }}
              >
                {t('messaging.datePreset30d')}
              </Button>
            </div>
          </div>
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
            className="w-full gap-3"
            pickerClassName="w-full min-w-0"
          />
        </div>
      )}

      {allowed.includes('student') && (
        <div className="flex flex-col gap-1 text-start min-w-filter-xl flex-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {searchLabel}
          </label>
          <Input
            type="text"
            value={filters.student}
            onChange={(event) => onFieldChange('student', event.target.value)}
            placeholder={searchPlaceholder}
            className="text-sm border-border/50 bg-background/50 backdrop-blur-sm focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
          />
        </div>
      )}
    </div>
  );
}
