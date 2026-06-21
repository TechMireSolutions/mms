import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import useTranslation from '@/hooks/useTranslation';

interface StudentsListPaginationProps {
  page: number;
  total: number;
  limit: number;
  hasMore: boolean;
  onPageChange: (page: number) => void;
}

export default function StudentsListPagination({
  page,
  total,
  limit,
  hasMore,
  onPageChange,
}: StudentsListPaginationProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const totalPages = Math.max(1, Math.ceil(total / limit));
  if (total <= limit) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between gap-3 px-1 py-2 text-sm">
      <p className="text-muted-foreground text-xs">
        {t('students.pagination.range', { from, to, total })}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-muted/60"
          aria-label={t('students.pagination.previous')}
        >
          <ChevronLeft className="w-4 h-4" />
          {t('students.pagination.previous')}
        </button>
        <span className="text-xs text-muted-foreground px-2 tabular-nums">
          {t('students.pagination.pageOf', { page, totalPages })}
        </span>
        <button
          type="button"
          disabled={!hasMore && page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-muted/60"
          aria-label={t('students.pagination.next')}
        >
          {t('students.pagination.next')}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
