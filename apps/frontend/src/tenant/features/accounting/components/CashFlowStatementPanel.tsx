import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableRow,
} from "@/components/ui/table";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { WORK_SURFACE, WORK_SURFACE_INNER } from "@/components/ui/formStyles";
import { useAccountingCurrency } from '@/hooks/useCurrency';
import { useTranslation } from '@/hooks/useTranslation';

interface CashFlowStatementPanelProps {
  netSurplus: number;
  depreciationAdjustment: number;
  receivablesChange: number;
  payablesChange: number;
  netCashFlow: number;
  cashInflow: number;
  cashOutflow: number;
}

export function CashFlowStatementPanel({
  netSurplus,
  depreciationAdjustment,
  receivablesChange,
  payablesChange,
  netCashFlow,
  cashInflow,
  cashOutflow,
}: CashFlowStatementPanelProps): React.JSX.Element {
  const { t } = useTranslation();
  const { formatCurrency } = useAccountingCurrency();
  const adjustments = [
    { label: t('accounting.reports.cashflow.depreciation'), amount: depreciationAdjustment },
    { label: t('accounting.reports.cashflow.receivables'), amount: receivablesChange },
    { label: t('accounting.reports.cashflow.payables'), amount: payablesChange },
  ];

  return (
    <section aria-label={t('accounting.reports.views.cashflow')} className="space-y-4">
      <div className={WORK_SURFACE}>
        <header className="px-4 py-2.5 bg-info/10/60 border-b border-border">
          <SectionLabel as="h3" weight="bold" tracking="wide" tone="foreground" className="m-0">{t('accounting.reports.cashflow.title')}</SectionLabel>
        </header>
        <div className="space-y-3 p-3 md:hidden">
          <article className="rounded-xl border border-border bg-muted/10 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-foreground">{t('accounting.reports.cashflow.netSurplusOrDeficit')}</span>
              <span className="font-mono font-semibold">{formatCurrency(netSurplus)}</span>
            </div>
          </article>
          {adjustments.map((item) => (
            <article key={item.label} className={`${WORK_SURFACE_INNER} space-y-3 p-3`}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="font-mono text-muted-foreground">{formatCurrency(item.amount)}</span>
              </div>
            </article>
          ))}
          <article className="rounded-xl border border-border bg-muted/30 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="font-bold text-foreground">{t('accounting.reports.cashflow.netCashOperations')}</span>
              <span className="font-mono font-bold text-foreground text-base">
                {formatCurrency(Math.abs(netCashFlow))}
                <span className={`text-xs ms-1 ${netCashFlow >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {netCashFlow >= 0 ? t('accounting.reports.cashflow.inflow') : t('accounting.reports.cashflow.outflow')}
                </span>
              </span>
            </div>
          </article>
        </div>
        <div className="hidden md:block">
          <Table>
            <caption className="sr-only">{t('accounting.reports.cashflow.breakdownCaption')}</caption>
            <TableBody className="divide-y divide-border/50">
              <TableRow className="bg-muted/10">
                <TableCell className="px-3 py-2.5 font-semibold text-foreground">{t('accounting.reports.cashflow.netSurplusOrDeficit')}</TableCell>
                <TableCell className="px-3 py-2.5 text-end font-mono font-semibold">{formatCurrency(netSurplus)}</TableCell>
              </TableRow>
              {adjustments.map((item) => (
                <TableRow key={item.label}>
                  <TableCell className="px-3 py-2.5 text-muted-foreground ps-8">{item.label}</TableCell>
                  <TableCell className="px-3 py-2.5 text-end font-mono text-muted-foreground">{formatCurrency(item.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="px-3 py-2.5 font-bold text-foreground">{t('accounting.reports.cashflow.netCashOperations')}</TableCell>
                <TableCell className="px-3 py-2.5 text-end font-mono font-bold text-foreground text-base">
                  {formatCurrency(Math.abs(netCashFlow))}
                  <span className={`text-xs ms-1 ${netCashFlow >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {netCashFlow >= 0 ? t('accounting.reports.cashflow.inflow') : t('accounting.reports.cashflow.outflow')}
                  </span>
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <article className="rounded-xl border border-border px-4 py-3 bg-success/10/60 text-center">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase m-0">{t('accounting.reports.cashflow.cashInflow')}</h4>
          <p className="font-mono font-bold text-success text-lg mt-1 m-0">{formatCurrency(cashInflow)}</p>
        </article>
        <article className="rounded-xl border border-border px-4 py-3 bg-destructive/10/60 text-center">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase m-0">{t('accounting.reports.cashflow.cashOutflow')}</h4>
          <p className="font-mono font-bold text-destructive text-lg mt-1 m-0">{formatCurrency(cashOutflow)}</p>
        </article>
        <article className={`rounded-xl border border-border px-4 py-3 text-center ${netCashFlow >= 0 ? 'bg-primary/5' : 'bg-destructive/10/60'}`}>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase m-0">{t('accounting.reports.cashflow.netCashFlow')}</h4>
          <p className={`font-mono font-bold text-lg mt-1 m-0 ${netCashFlow >= 0 ? 'text-primary' : 'text-destructive'}`}>
            {formatCurrency(Math.abs(netCashFlow))}
          </p>
        </article>
      </div>
    </section>
  );
}
