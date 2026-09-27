import React from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { FinancialLedgerRow } from '@mms/shared';

export type { FinancialLedgerRow };

export interface FinancialLedgerTableProps {
  /** Accessible <caption> text (screen-reader only). */
  caption: string;
  rows: FinancialLedgerRow[];
  /** Column header labels. Defaults to account / Debit / Credit. */
  columnLabels?: {
    account?: string;
    debit?: string;
    credit?: string;
  };
  className?: string;
}

const PLACEHOLDER = '—';

const ROW_VARIANT_CLASS: Record<NonNullable<FinancialLedgerRow['variant']>, string> = {
  debit: 'row-debit border-b border-border',
  credit: 'row-credit border-0',
  neutral: 'border-b border-border',
};

/**
 * Generic financial ledger preview table.
 *
 * Renders a bordered debit/credit table with semantic row colour-coding,
 * using the CSS utilities defined in index.css (table-header-cell,
 * table-amount-cell, row-debit, row-credit). Consumers pass plain data;
 * no styling decisions are made at the call-site.
 *
 * @example
 * <FinancialLedgerTable
 *   caption="Transaction posting preview"
 *   rows={[
 *     { account: 'Cash',    debit:  '1,000.00', variant: 'debit'  },
 *     { account: 'Revenue', credit: '1,000.00', variant: 'credit' },
 *   ]}
 * />
 */
export function FinancialLedgerTable({
  caption,
  rows,
  columnLabels,
  className,
}: FinancialLedgerTableProps): React.JSX.Element {
  const labels = {
    account: columnLabels?.account ?? 'Account',
    debit: columnLabels?.debit ?? 'Debit',
    credit: columnLabels?.credit ?? 'Credit',
  };

  return (
    <div className={cn('overflow-x-auto rounded-xl border border-border', className)}>
      <Table className="min-w-review-panel w-full">
        <TableCaption className="sr-only">{caption}</TableCaption>
        <TableHeader>
          <TableRow className="border-b border-border bg-surface-table-header">
            <TableHead className="table-header-cell text-start">{labels.account}</TableHead>
            <TableHead className="table-header-cell text-end">{labels.debit}</TableHead>
            <TableHead className="table-header-cell text-end">{labels.credit}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => {
            const variant = row.variant ?? 'neutral';
            const rowClass = ROW_VARIANT_CLASS[variant];
            return (
              <TableRow key={i} className={rowClass}>
                <TableCell className="px-3 py-2 font-semibold text-foreground">
                  {row.account}
                </TableCell>
                <TableCell
                  className={cn(
                    'table-amount-cell',
                    variant === 'debit' ? 'text-info' : 'text-muted-foreground',
                  )}
                >
                  {row.debit ?? PLACEHOLDER}
                </TableCell>
                <TableCell
                  className={cn(
                    'table-amount-cell',
                    variant === 'credit' ? 'text-success' : 'text-muted-foreground',
                  )}
                >
                  {row.credit ?? PLACEHOLDER}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
