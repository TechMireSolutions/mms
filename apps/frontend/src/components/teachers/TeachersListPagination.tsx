import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';

interface TeachersListPaginationProps {
  page: number;
  total: number;
  limit: number;
  hasMore: boolean;
  onPageChange: (page: number) => void;
}

export function TeachersListPagination({
  page,
  total,
  limit,
  hasMore,
  onPageChange,
}: TeachersListPaginationProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const totalPages = Math.max(1, Math.ceil(total / limit));
  if (total <= limit) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between gap-3 px-1 py-2 text-sm">
      <p className="text-muted-foreground text-xs">
        {t('teachers.pagination.range', { from, to, total })}
      </p>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="h-8 gap-1 px-2.5 py-1.5 rounded-lg text-xs font-normal"
          aria-label={t('teachers.pagination.previous')}
        >
          <ChevronLeft className="w-4 h-4" />
          {t('teachers.pagination.previous')}
        </Button>
        <span className="text-xs text-muted-foreground px-2 tabular-nums">
          {t('teachers.pagination.pageOf', { page, totalPages })}
        </span>
        <Button
          type="button"
          variant="outline"
          disabled={!hasMore && page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="h-8 gap-1 px-2.5 py-1.5 rounded-lg text-xs font-normal"
          aria-label={t('teachers.pagination.next')}
        >
          {t('teachers.pagination.next')}
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
