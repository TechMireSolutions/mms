import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import type { ExportColumn } from '@/components/ui/ExportToolbar';
import { ReportDataGridContainer } from './ReportDataGridContainer';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { QuestionBankSummaryRow } from './useQuestionBankReportData';

export interface QuestionBankSummaryDataGridProps {
  summaryRows: QuestionBankSummaryRow[];
  exportColumns: ExportColumn[];
}

export function QuestionBankSummaryDataGrid({
  summaryRows,
  exportColumns,
}: QuestionBankSummaryDataGridProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <ReportDataGridContainer
      title={t('questionBank.analytics.categoryBreakdown')}
      columns={exportColumns}
      rows={summaryRows as unknown as Record<string, unknown>[]}
      moduleId="questionBank"
      hideExport={summaryRows.length === 0}
    >
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
              <TableHead className="px-4 py-2.5 font-bold">{t('common.type')}</TableHead>
              <TableHead className="px-4 py-2.5 font-bold">{t('common.label')}</TableHead>
              <TableHead className="px-4 py-2.5 font-bold text-center">
                {t('questionBank.questions')}
              </TableHead>
              <TableHead className="px-4 py-2.5 font-bold text-center">
                {t('questionBank.report.generatedTests')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/50">
            {summaryRows.map((row) => (
              <TableRow
                key={`${row.type}-${row.name}`}
                className="hover:bg-muted/20 transition-colors"
              >
                <TableCell className="px-4 py-2.5 text-xs text-muted-foreground uppercase font-bold">
                  {row.type}
                </TableCell>
                <TableCell className="px-4 py-2.5 font-medium text-foreground">
                  {row.name}
                </TableCell>
                <TableCell className="px-4 py-2.5 text-center font-mono font-semibold text-primary">
                  {row.questions}
                </TableCell>
                <TableCell className="px-4 py-2.5 text-center font-mono text-muted-foreground">
                  {row.tests}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="divide-y divide-border/50 md:hidden" role="list">
        {summaryRows.map((row) => (
          <div
            key={`${row.type}-${row.name}`}
            className="flex min-w-0 items-center justify-between gap-3 px-4 py-3"
            role="listitem"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{row.name}</p>
              <p className="text-xs text-muted-foreground uppercase font-bold">{row.type}</p>
            </div>
            <div className="text-end">
              <span className="font-mono font-bold text-primary">{row.questions}</span>
              <span className="text-xs text-muted-foreground ms-1">
                {t('questionBank.questions').toLowerCase()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </ReportDataGridContainer>
  );
}
