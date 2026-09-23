import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableRow,
} from "@/components/ui/table";
import { DirectoryCardsGrid } from "@/components/ui/DirectoryCardsGrid";
import { DirectoryEntityCard } from "@/components/ui/DirectoryEntityCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { WORK_SURFACE, WORK_SURFACE_INNER } from "@/components/ui/formStyles";
import { useAccountingCurrency } from "@/hooks/useCurrency";
import { useTranslation } from "@/hooks/useTranslation";
import { useWorkDirectoryViewMode, type WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";

export interface ReportRow {
  id: string;
  name: string;
  code: string;
  type: string;
  subtype?: string;
  totalDebit: number;
  totalCredit: number;
}

interface ReportSectionProps {
  title: string;
  rows: ReportRow[];
  totalLabel: string;
  total: number;
  debitNormal: boolean;
  color?: string;
  viewMode?: WorkDirectoryViewMode;
}

export function ReportSection({
  title,
  rows,
  totalLabel,
  total,
  debitNormal,
  color,
  viewMode: propViewMode,
}: ReportSectionProps): React.JSX.Element {
  const { t } = useTranslation();
  const { formatCurrency } = useAccountingCurrency();
  const { viewMode: hookViewMode } = useWorkDirectoryViewMode();
  const viewMode = propViewMode ?? hookViewMode;
  const maxAmount = Math.max(
    ...rows.map((reportRow) => {
      const rowAmount = debitNormal ? reportRow.totalDebit - reportRow.totalCredit : reportRow.totalCredit - reportRow.totalDebit;
      return Math.abs(rowAmount);
    }),
    1,
  );

  return (
    <section aria-label={title} className={WORK_SURFACE}>
      <header className={`px-4 py-2.5 border-b border-border ${color || "bg-muted/60"}`}>
        <SectionLabel as="h3" weight="bold" tracking="wide" tone="foreground" className="m-0">{title}</SectionLabel>
      </header>
      {viewMode === "cards" ? (
        <DirectoryCardsGrid className="p-3">
          {rows.map((reportRow, index) => {
            const rowAmount = debitNormal ? reportRow.totalDebit - reportRow.totalCredit : reportRow.totalCredit - reportRow.totalDebit;
            const percentage = (Math.abs(rowAmount) / maxAmount) * 100;
            return (
              <DirectoryEntityCard
                key={reportRow.id}
                className={`${WORK_SURFACE_INNER} space-y-3 p-3`}
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="truncate text-sm font-medium text-foreground">{reportRow.name}</h4>
                    <p className="text-xs text-muted-foreground font-mono m-0">
                      {reportRow.code} · {reportRow.subtype || reportRow.type}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono font-semibold text-foreground">{formatCurrency(Math.abs(rowAmount))}</span>
                </div>
                <ProgressBar
                  value={percentage}
                  size="sm"
                  fillClassName="bg-primary/40"
                  aria-hidden="true"
                />
              </DirectoryEntityCard>
            );
          })}
          <article className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-3 col-span-full">
            <span className="font-bold text-foreground">{totalLabel}</span>
            <span className="font-mono font-bold text-foreground text-base">{formatCurrency(total)}</span>
          </article>
        </DirectoryCardsGrid>
      ) : (
        <Table>
          <caption className="sr-only">{t("accounting.reports.sectionDataCaption", { title })}</caption>
          <TableBody className="divide-y divide-border/50">
            {rows.map((reportRow) => {
              const rowAmount = debitNormal ? reportRow.totalDebit - reportRow.totalCredit : reportRow.totalCredit - reportRow.totalDebit;
              const percentage = (Math.abs(rowAmount) / maxAmount) * 100;
              return (
                <TableRow key={reportRow.id} className="hover:bg-muted/10">
                  <TableCell className="px-3 py-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-foreground">{reportRow.name}</span>
                      <span className="font-mono font-semibold text-foreground ms-2">{formatCurrency(Math.abs(rowAmount))}</span>
                    </div>
                    <ProgressBar
                      value={percentage}
                      size="sm"
                      fillClassName="bg-primary/40"
                      aria-hidden="true"
                    />
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono m-0">
                      {reportRow.code} · {reportRow.subtype || reportRow.type}
                    </p>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="px-3 py-2.5 flex items-center justify-between">
                <span className="font-bold text-foreground">{totalLabel}</span>
                <span className="font-mono font-bold text-foreground text-base">{formatCurrency(total)}</span>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      )}
    </section>
  );
}
