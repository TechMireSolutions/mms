import React from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExportToolbar } from "@/components/ui/ExportToolbar";
import { useTranslation } from "@/hooks/useTranslation";
import { useWorkDirectoryViewMode, type WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import { getInitials } from "@mms/shared";
import { Users } from "lucide-react";
import { ModuleTableHeaderCell } from "@/components/ui/ModuleTableHeaderCell";
import { MoneyTableCell } from "@/components/ui/MoneyTableCell";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MutedTableHeaderRow } from "@/components/ui/reports/FinancialDebitCreditTableChrome";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ObligationsRepDuesCardsView } from "./ObligationsRepDuesCardsView";

export interface RepSummaryEntry {
  key: string;
  repName: string;
  mujtahidName: string;
  count: number;
  total: number;
  due: number;
  byType: Record<string, number>;
}

interface ObligationsRepDuesSectionProps {
  repSummary: RepSummaryEntry[];
  totalAmount: number;
  activeCurrencyCode: string;
  formatCurrency: (amount: number | string | null | undefined) => string;
  formatValueOnly: (amount: number | string | null | undefined) => string;
  viewMode?: WorkDirectoryViewMode;
}

export function ObligationsRepDuesSection({
  repSummary,
  totalAmount,
  activeCurrencyCode,
  formatCurrency,
  formatValueOnly,
  viewMode: propViewMode,
}: ObligationsRepDuesSectionProps) {
  const { t } = useTranslation();
  const { viewMode: hookViewMode } = useWorkDirectoryViewMode();
  const viewMode = propViewMode ?? hookViewMode;
  const totalDue = repSummary.reduce((sum, representativeSummary) => sum + representativeSummary.due, 0);

  return (
    <section aria-label={t("obligations.summary.rep.aria")}>
      <SectionHeader
        align="start"
        icon={<Users className="w-3.5 h-3.5 text-primary" aria-hidden="true" />}
        title={t("obligations.summary.rep.title")}
        subtitle={t("obligations.summary.rep.subtitle")}
        actions={
          <ExportToolbar
            title={t("obligations.summary.rep.title")}
            filename="rep_dues_summary"
            moduleId="obligations"
            exportLabel={t("obligations.summary.rep.exportLabel")}
            columns={[
              { header: t("obligations.summary.rep.colRepresentative"), key: "repName" },
              { header: t("obligations.summary.rep.colMujtahid"), key: "mujtahidName" },
              { header: t("obligations.summary.rep.colByType"), key: "byTypeFmt" },
              { header: t("obligations.summary.rep.colCollections"), key: "count" },
              { header: t("obligations.summary.rep.colTotalCollected", { currency: activeCurrencyCode }), key: "totalFmt" },
              { header: t("obligations.summary.rep.colDueToRep", { currency: activeCurrencyCode }), key: "dueFmt" },
            ]}
            rows={repSummary.map((representativeSummary) => ({
              ...representativeSummary,
              byTypeFmt: Object.entries(representativeSummary.byType).map(([name, amount]) => `${name}: ${formatCurrency(amount)}`).join("; "),
              totalFmt: formatCurrency(representativeSummary.total),
              dueFmt: formatCurrency(representativeSummary.due),
            }))}
          />
        }
      />
      {repSummary.length === 0 ? (
        <EmptyState variant="dashed" title={t("obligations.summary.emptyFiltered")} compact role="alert" />
      ) : (
        <div className={WORK_SURFACE}>
          {viewMode === "cards" ? (
            <ObligationsRepDuesCardsView
              repSummary={repSummary}
              totalAmount={totalAmount}
              totalDue={totalDue}
              formatCurrency={formatCurrency}
              formatValueOnly={formatValueOnly}
            />
          ) : (
            <Table>
              <caption className="sr-only">{t("obligations.summary.rep.title")}</caption>
              <TableHeader sticky>
                <MutedTableHeaderRow>
                  <ModuleTableHeaderCell columnKey="representative" className="px-3 py-2.5">{t("obligations.summary.rep.colRepresentative")}</ModuleTableHeaderCell>
                  <ModuleTableHeaderCell columnKey="mujtahid" className="px-3 py-2.5">{t("obligations.summary.rep.colMujtahid")}</ModuleTableHeaderCell>
                  <ModuleTableHeaderCell columnKey="byType" className="px-3 py-2.5">{t("obligations.summary.rep.colByType")}</ModuleTableHeaderCell>
                  <ModuleTableHeaderCell columnKey="collections" variant="number" className="px-3 py-2.5">{t("obligations.summary.rep.colCollections")}</ModuleTableHeaderCell>
                  <ModuleTableHeaderCell columnKey="totalCollected" variant="currency" className="px-3 py-2.5">{t("obligations.summary.rep.colTotalCollectedShort")}</ModuleTableHeaderCell>
                  <ModuleTableHeaderCell columnKey="dueToRep" variant="currency" className="px-3 py-2.5 text-destructive">{t("obligations.summary.rep.colDueToRepShort")}</ModuleTableHeaderCell>
                </MutedTableHeaderRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/50">
                {repSummary.map((representativeSummary) => (
                  <TableRow key={representativeSummary.key} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                          <span className="text-xs font-bold text-primary">{getInitials(representativeSummary.repName)}</span>
                        </div>
                        <p className="font-semibold text-foreground text-sm m-0">{representativeSummary.repName}</p>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-2.5 text-xs text-muted-foreground">{representativeSummary.mujtahidName}</TableCell>
                    <TableCell className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(representativeSummary.byType).map(([name, amount]) => (
                          <span key={name} className="text-xs font-medium px-1.5 py-0.5 rounded bg-muted border border-border text-foreground whitespace-nowrap">
                            {name}: {formatValueOnly(amount)}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell variant="number" className="px-3 py-2.5 text-sm font-semibold text-foreground">{representativeSummary.count}</TableCell>
                    <MoneyTableCell value={formatCurrency(representativeSummary.total)} variant="neutral" />
                    <MoneyTableCell value={formatCurrency(representativeSummary.due)} variant="negative" />
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter sticky>
                <TableRow>
                  <TableCell colSpan={4} className="table-footer-label">{t("obligations.summary.rep.repCount", { count: repSummary.length })}</TableCell>
                  <MoneyTableCell value={formatCurrency(totalAmount)} variant="neutral" isFooter />
                  <MoneyTableCell value={formatCurrency(totalDue)} variant="negative" isFooter />
                </TableRow>
              </TableFooter>
            </Table>
          )}
        </div>
      )}
    </section>
  );
}
