import type { JSX } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { ModuleTableHeaderCell } from '@/components/ui/ModuleTableHeaderCell';
import {
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTranslation } from '@/hooks/useTranslation';

export interface QuestionBankTableHeaderProps {
  canDelete: boolean;
  isColumnVisible: (key: string) => boolean;
  allVisibleSelected: boolean;
  someVisibleSelected: boolean;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
  onToggleSelectAll: (checked: boolean) => void;
}

export function QuestionBankTableHeader({
  canDelete,
  isColumnVisible,
  allVisibleSelected,
  someVisibleSelected,
  getColumnWidth,
  onColumnResize,
  onToggleSelectAll,
}: QuestionBankTableHeaderProps): JSX.Element {
  const { t } = useTranslation();
  return (
    <TableHeader>
      <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
        {canDelete && (
          <TableHead className="w-10 px-3 py-2.5 h-auto">
            <Checkbox
              checked={allVisibleSelected ? true : someVisibleSelected ? 'indeterminate' : false}
              onCheckedChange={(checked) => onToggleSelectAll(checked === true)}
              aria-label={t('questionBank.table.selectAll')}
            />
          </TableHead>
        )}
        {isColumnVisible('text') && (
          <ModuleTableHeaderCell columnKey="text" width={getColumnWidth?.('text')} onResize={onColumnResize} className="px-4 py-2.5">
            {t('questionBank.columns.text')}
          </ModuleTableHeaderCell>
        )}
        {isColumnVisible('category') && (
          <ModuleTableHeaderCell columnKey="category" width={getColumnWidth?.('category')} onResize={onColumnResize} className="whitespace-nowrap px-4 py-2.5">
            {t('questionBank.columns.category')}
          </ModuleTableHeaderCell>
        )}
        {isColumnVisible('language') && (
          <ModuleTableHeaderCell columnKey="language" width={getColumnWidth?.('language')} onResize={onColumnResize} className="whitespace-nowrap px-4 py-2.5">
            {t('questionBank.columns.language')}
          </ModuleTableHeaderCell>
        )}
        {isColumnVisible('type') && (
          <ModuleTableHeaderCell columnKey="type" width={getColumnWidth?.('type')} onResize={onColumnResize} className="whitespace-nowrap px-4 py-2.5">
            {t('questionBank.columns.type')}
          </ModuleTableHeaderCell>
        )}
        {isColumnVisible('difficulty') && (
          <ModuleTableHeaderCell columnKey="difficulty" width={getColumnWidth?.('difficulty')} onResize={onColumnResize} className="whitespace-nowrap px-4 py-2.5">
            {t('questionBank.columns.difficulty')}
          </ModuleTableHeaderCell>
        )}
        {isColumnVisible('source') && (
          <ModuleTableHeaderCell columnKey="source" width={getColumnWidth?.('source')} onResize={onColumnResize} className="whitespace-nowrap px-4 py-2.5">
            {t('questionBank.columns.source')}
          </ModuleTableHeaderCell>
        )}
        <TableHead className="whitespace-nowrap px-4 py-2.5 text-end h-auto">
          <span className="sr-only">{t('questionBank.columns.actions')}</span>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
