import React from "react";
import { formatMoney } from "@mms/shared";
import { WORK_SURFACE, WORK_SURFACE_INNER } from "@/components/ui/formStyles";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { ModuleTableHeaderCell } from "@/components/ui/ModuleTableHeaderCell";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MutedTableHeaderRow } from "@/components/ui/reports/FinancialDebitCreditTableChrome";
import { WarningCallout } from "@/components/ui/WarningCallout";
import { StatGrid, StatRow } from "@/components/ui/StatGrid";
import { useTranslation } from "@/hooks/useTranslation";
import { useWorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import type {
  ObligationCollection,
  WakalaType,
  ObligationDistribution,
} from "@/lib/data/obligationsData";

interface ObligationCollectionDistributionsSectionProps {
  collection: ObligationCollection;
  dists: ObligationDistribution[];
  wakalaType: WakalaType | undefined;
  totalPct: number;
  totalAmount: number;
  currency: { code?: string } | null | undefined;
  distributionTypeConfig: Record<string, StatusBadgeConfigItem>;
}

export function ObligationCollectionDistributionsSection({
  collection,
  dists,
  wakalaType,
  totalPct,
  totalAmount,
  currency,
  distributionTypeConfig,
}: ObligationCollectionDistributionsSectionProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const { viewMode } = useWorkDirectoryViewMode();

  return (
    <>
      {dists.length > 0 && (
        <section aria-label={t("obligations.detail.distribution")}>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 m-0">
            {t("obligations.detail.distribution")}
          </h4>
          <div className={WORK_SURFACE}>
            {viewMode === "cards" ? (
              <div className="space-y-3 p-3">
                {dists.map((distribution) => (
                  <article key={distribution.id} className={`${WORK_SURFACE_INNER} space-y-2 p-3`}>
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-foreground m-0">{distribution.name}</p>
                      <StatusBadge status={distribution.type} config={distributionTypeConfig} size="sm" />
                    </div>
                    <StatGrid>
                      <StatRow
                        label={t("obligations.detail.colPct")}
                        value={`${distribution.percentage}%`}
                        ddClassName="font-mono text-xs font-semibold"
                      />
                      <StatRow
                        label={t("obligations.columns.amount")}
                        value={formatMoney((collection.amount * distribution.percentage) / 100, currency?.code)}
                        ddClassName="font-mono text-xs font-semibold"
                      />
                    </StatGrid>
                  </article>
                ))}
                <div className="flex items-center justify-between px-3 py-2 bg-muted/40 rounded-lg border border-border/50 text-xs font-semibold">
                  <span>{t("reports.fields.total")}</span>
                  <span className="font-mono">
                    {totalPct}% • {formatMoney(totalAmount, currency?.code)}
                  </span>
                </div>
              </div>
            ) : (
              <Table>
                <caption className="sr-only">
                  {t("obligations.detail.distributionCaption", { receipt: collection.receipt_no })}
                </caption>
                <TableHeader>
                  <MutedTableHeaderRow>
                    <ModuleTableHeaderCell columnKey="name" className="px-5 py-2">
                      {t("obligations.detail.colName")}
                    </ModuleTableHeaderCell>
                    <ModuleTableHeaderCell columnKey="type" className="px-4 py-2">
                      {t("obligations.detail.colType")}
                    </ModuleTableHeaderCell>
                    <ModuleTableHeaderCell columnKey="pct" variant="number" className="px-4 py-2">
                      {t("obligations.detail.colPct")}
                    </ModuleTableHeaderCell>
                    <ModuleTableHeaderCell columnKey="amount" variant="currency" className="px-5 py-2">
                      {t("obligations.columns.amount")}
                    </ModuleTableHeaderCell>
                  </MutedTableHeaderRow>
                </TableHeader>
                <TableBody className="divide-y divide-border">
                  {dists.map((distribution) => (
                    <TableRow key={distribution.id} className="hover:bg-muted/20">
                      <TableCell className="px-5 py-2.5 font-medium text-foreground">
                        {distribution.name}
                      </TableCell>
                      <TableCell className="px-4 py-2.5">
                        <StatusBadge status={distribution.type} config={distributionTypeConfig} size="sm" />
                      </TableCell>
                      <TableCell variant="number" noWrap className="px-4 py-2.5 text-xs font-semibold">
                        {distribution.percentage}%
                      </TableCell>
                      <TableCell variant="currency" noWrap className="px-5 py-2.5 text-xs font-semibold text-foreground">
                        {formatMoney((collection.amount * distribution.percentage) / 100, currency?.code)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter sticky className="bg-muted/40 font-semibold border-t border-border">
                  <TableRow>
                    <TableCell colSpan={2} className="px-5 py-2.5 text-foreground">
                      {t("reports.fields.total")}
                    </TableCell>
                    <TableCell variant="number" noWrap className="px-4 py-2.5 text-xs font-bold">
                      {totalPct}%
                    </TableCell>
                    <TableCell variant="currency" noWrap className="px-5 py-2.5 text-xs font-bold text-foreground">
                      {formatMoney(totalAmount, currency?.code)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            )}
          </div>
        </section>
      )}

      {dists.length === 0 && wakalaType && (
        <WarningCallout
          density="compact"
          role="alert"
          className="text-warning"
          description={t("obligations.detail.noDistribution")}
        />
      )}
    </>
  );
}
