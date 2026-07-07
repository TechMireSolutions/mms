import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AppTranslationKey } from '@mms/shared';

export interface ListPaginationProps {
  page: number;
  total: number;
  limit: number;
  hasMore?: boolean;
  onPageChange: (page: number) => void;
  i18nNamespace: string; // e.g. 'students', 'contacts', 'teachers', 'enrollments', 'attendance'
  variant?: 'range' | 'summary'; // 'range' (students, contacts, teachers) or 'summary' (enrollments, attendance)
  className?: string;
}

export function ListPagination({
  page,
  total,
  limit,
  hasMore = false,
  onPageChange,
  i18nNamespace,
  variant = 'range',
  className,
}: ListPaginationProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const totalPages = Math.max(1, Math.ceil(total / limit));
  if (total <= limit) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  if (variant === 'summary') {
    const summaryKey = `${i18nNamespace}.pagination.summary` as AppTranslationKey;
    const labelKey = `${i18nNamespace}.pagination.label` as AppTranslationKey;
    const prevKey = `${i18nNamespace}.pagination.previous` as AppTranslationKey;
    const nextKey = `${i18nNamespace}.pagination.next` as AppTranslationKey;

    const navLabel = i18nNamespace === 'enrollments' ? t(labelKey) : undefined;

    return (
      <div 
        className={cn("flex items-center justify-between text-xs text-muted-foreground py-2", className)}
        role="navigation"
        aria-label={navLabel}
      >
        <span>{t(summaryKey, { count: total, page, totalPages })}</span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            aria-label={t(prevKey)}
            className="p-1.5 w-8 h-8 rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            aria-label={t(nextKey)}
            className="p-1.5 w-8 h-8 rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    );
  }

  // Variant: range (detailed)
  const rangeKey = `${i18nNamespace}.pagination.range` as AppTranslationKey;
  const prevKey = `${i18nNamespace}.pagination.previous` as AppTranslationKey;
  const nextKey = `${i18nNamespace}.pagination.next` as AppTranslationKey;
  const pageOfKey = `${i18nNamespace}.pagination.pageOf` as AppTranslationKey;

  const actualHasMore = hasMore || page < totalPages;

  return (
    <div className={cn("flex items-center justify-between gap-3 px-1 py-2 text-sm", className)}>
      <p className="text-muted-foreground text-xs">
        {t(rangeKey, { from, to, total })}
      </p>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-muted/60 h-auto text-foreground shadow-none text-xs font-normal"
          aria-label={t(prevKey)}
        >
          <ChevronLeft className="w-4 h-4" />
          {t(prevKey)}
        </Button>
        <span className="text-xs text-muted-foreground px-2 tabular-nums">
          {t(pageOfKey, { page, totalPages })}
        </span>
        <Button
          type="button"
          variant="outline"
          disabled={!actualHasMore}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-muted/60 h-auto text-foreground shadow-none text-xs font-normal"
          aria-label={t(nextKey)}
        >
          {t(nextKey)}
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
