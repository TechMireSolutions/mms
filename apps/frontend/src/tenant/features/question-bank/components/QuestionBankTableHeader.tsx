import type { JSX } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { ResizableTableHead } from '@/components/ui/ResizableTableHead';
import { useTranslation } from '@/hooks/useTranslation';

export interface QuestionBankTableHeaderProps {
  canDelete: boolean;
  showText: boolean;
  showCategory: boolean;
  showLanguage: boolean;
  showType: boolean;
  showDifficulty: boolean;
  showSource: boolean;
  allFilteredSelected: boolean;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
  onToggleSelectAllFiltered: (checked: boolean) => void;
}

export function QuestionBankTableHeader({
  canDelete,
  showText,
  showCategory,
  showLanguage,
  showType,
  showDifficulty,
  showSource,
  allFilteredSelected,
  getColumnWidth,
  onColumnResize,
  onToggleSelectAllFiltered,
}: QuestionBankTableHeaderProps): JSX.Element {
  const { t } = useTranslation();
  return (
    <thead>
      <tr className="border-b border-border bg-muted/30">
        {canDelete && (
          <th className="w-10 px-3 py-2.5">
            <Checkbox
              checked={allFilteredSelected}
              onCheckedChange={(checked) => onToggleSelectAllFiltered(checked === true)}
              aria-label={t('questionBank.trash.selectAll')}
            />
          </th>
        )}
        {showText && (
          <ResizableTableHead columnKey="text" width={getColumnWidth?.('text')} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('questionBank.columns.text')}
          </ResizableTableHead>
        )}
        {showCategory && (
          <ResizableTableHead columnKey="category" width={getColumnWidth?.('category')} onResize={onColumnResize} className="whitespace-nowrap px-4 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('questionBank.columns.category')}
          </ResizableTableHead>
        )}
        {showLanguage && (
          <ResizableTableHead columnKey="language" width={getColumnWidth?.('language')} onResize={onColumnResize} className="whitespace-nowrap px-4 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('questionBank.columns.language')}
          </ResizableTableHead>
        )}
        {showType && (
          <ResizableTableHead columnKey="type" width={getColumnWidth?.('type')} onResize={onColumnResize} className="whitespace-nowrap px-4 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('questionBank.columns.type')}
          </ResizableTableHead>
        )}
        {showDifficulty && (
          <ResizableTableHead columnKey="difficulty" width={getColumnWidth?.('difficulty')} onResize={onColumnResize} className="whitespace-nowrap px-4 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('questionBank.columns.difficulty')}
          </ResizableTableHead>
        )}
        {showSource && (
          <ResizableTableHead columnKey="source" width={getColumnWidth?.('source')} onResize={onColumnResize} className="whitespace-nowrap px-4 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('questionBank.columns.source')}
          </ResizableTableHead>
        )}
        <th scope="col" className="whitespace-nowrap px-4 py-2.5 text-end text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <span className="sr-only">{t('questionBank.columns.actions')}</span>
        </th>
      </tr>
    </thead>
  );
}
