import React from 'react';
import { ReportDataGridContainer } from '@/components/ui/reports/ReportDataGridContainer';
import type { ExportColumn } from '@/components/ui/ExportToolbar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getSolidBgClass } from '@/lib/semanticTone';

export interface ChannelSummaryRow {
  id: string;
  channel: string;
  count: number;
  rate: string;
  accent: string;
}

export interface MessagingReportSummaryTableProps {
  title: string;
  columns: ExportColumn[];
  rows: ChannelSummaryRow[];
  detailsHeader: string;
  growthRateHeader: string;
}

export function MessagingReportSummaryTable({
  title,
  columns,
  rows,
  detailsHeader,
  growthRateHeader,
}: MessagingReportSummaryTableProps): React.JSX.Element {
  return (
    <ReportDataGridContainer
      title={title}
      columns={columns}
      rows={rows as unknown as Record<string, unknown>[]}
      moduleId="messaging"
      hideExport={rows.length === 0}
    >
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-4 py-2.5 font-bold">{title}</TableHead>
              <TableHead className="px-4 py-2.5 font-bold text-center">{detailsHeader}</TableHead>
              <TableHead className="px-4 py-2.5 font-bold text-end">{growthRateHeader}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="px-4 py-2.5 font-medium flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${getSolidBgClass(row.accent)}`} />
                  {row.channel}
                </TableCell>
                <TableCell className="px-4 py-2.5 text-center font-mono font-bold">{row.count}</TableCell>
                <TableCell className="px-4 py-2.5 text-end font-mono text-primary font-bold">{row.rate}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="divide-y divide-border/50 md:hidden" role="list">
        {rows.map((row) => (
          <div
            key={row.id}
            className="flex min-w-0 items-center justify-between gap-3 px-4 py-3"
            role="listitem"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className={`h-2 w-2 rounded-full shrink-0 ${getSolidBgClass(row.accent)}`} />
              <span className="truncate text-sm font-medium text-foreground">{row.channel}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="font-mono text-sm font-bold text-foreground">{row.count}</span>
              <span className="font-mono text-sm font-bold text-primary">{row.rate}</span>
            </div>
          </div>
        ))}
      </div>
    </ReportDataGridContainer>
  );
}
