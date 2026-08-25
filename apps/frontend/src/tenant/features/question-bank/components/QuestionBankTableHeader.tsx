import type { JSX } from 'react';
import { ModuleWorkTableHeader } from '@/components/ui/ModuleWorkTableHeader';
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

  const columns = [
    isColumnVisible('text') ? { id: 'text', label: t('questionBank.columns.text') } : null,
    isColumnVisible('category') ? { id: 'category', label: t('questionBank.columns.category') } : null,
    isColumnVisible('language') ? { id: 'language', label: t('questionBank.columns.language') } : null,
    isColumnVisible('type') ? { id: 'type', label: t('questionBank.columns.type') } : null,
    isColumnVisible('difficulty') ? { id: 'difficulty', label: t('questionBank.columns.difficulty') } : null,
    isColumnVisible('source') ? { id: 'source', label: t('questionBank.columns.source') } : null,
  ].filter(Boolean) as { id: string; label: string }[];

  return (
    <ModuleWorkTableHeader
      columns={columns}
      getColumnWidth={(key) => getColumnWidth?.(key)}
      setColumnWidth={(key, width) => onColumnResize?.(key, width)}
      selection={
        canDelete
          ? {
              allSelected: allVisibleSelected,
              someSelected: someVisibleSelected,
              onSelectAll: () => onToggleSelectAll(!allVisibleSelected),
              ariaLabel: t('questionBank.table.selectAll'),
            }
          : undefined
      }
      actionsLabel={t('questionBank.columns.actions')}
      stickyColumnId="text"
    />
  );
}
