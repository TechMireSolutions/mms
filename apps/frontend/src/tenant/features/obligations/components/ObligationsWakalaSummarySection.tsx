import { EmptyState } from "@/components/ui/EmptyState";
import { ExportToolbar } from "@/components/ui/ExportToolbar";
import { ModuleTableHeaderCell } from "@/components/ui/ModuleTableHeaderCell";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WORK_SURFACE, WORK_SURFACE_INNER } from "@/components/ui/formStyles";
import { Badge } from "@/components/ui/badge";
import { StatGrid, StatRow } from "@/components/ui/StatGrid";
import { useTranslation } from "@/hooks/useTranslation";
import type { ObligationDistribution } from "@/lib/data/obligationsData";
import { AlertCircle, Layers } from "lucide-react";

import { SectionHeader } from "@/components/ui/SectionHeader";

export interface WakalaSummaryEntry {
  key: string;
  label: string;
  repName: string;
  mujtahidName: string;
  obligationType: string;
  count: number;
  total: number;
  hasWakala: boolean;
  distributions: ObligationDistribution[];
}

interface ObligationsWakalaSummarySectionProps {
  wakalaSummary: WakalaSummaryEntry[];
  totalAmount: number;
  activeCurrencyCode: string;
  formatCurrency: (amount: number | string | null | undefined) => string;
}

export function ObligationsWakalaSummarySection({
  wakalaSummary,
  totalAmount,
  activeCurrencyCode,
  formatCurrency,
}: ObligationsWakalaSummarySectionProps) {
  const { t } = useTranslation();

  return (
    <section aria-label={t("obligations.summary.wakala.aria")}>
      <SectionHeader
        align="start"
        icon={<Layers className="w-3.5 h-3.5 text-primary" aria-hidden="true" />}
        title={t("obligations.summary.wakala.title")}
        subtitle={t("obligations.summary.wakala.subtitle")}
        actions={
          <ExportToolbar
            title={t("obligations.summary.wakala.title")}
            filename="wakala_summary"
            moduleId="obligations"
            exportLabel={t("obligations.summary.wakala.exportLabel")}
            columns={[
              { header: t("obligations.summary.wakala.colRepWakala"), key: "repName" },
              { header: t("obligations.summary.wakala.colMujtahid"), key: "mujtahidName" },
              { header: t("obligations.summary.wakala.colObligationType"), key: "obligationType" },
              { header: t("obligations.summary.wakala.colCollections"), key: "count" },
              { header: t("obligations.summary.wakala.colTotalAmount", { currency: activeCurrencyCode }), key: "totalFmt" },
              { header: t("obligations.summary.wakala.colDistributions"), key: "distFmt" },
            ]}
            rows={wakalaSummary.map((wakalaSummaryItem) => ({
              ...wakalaSummaryItem,
              totalFmt: formatCurrency(wakalaSummaryItem.total),
              distFmt: wakalaSummaryItem.distributions.map((distribution) => `${distribution.name} ${distribution.percentage}%`).join("; ") || "—",
            }))}
          />
        }
      />
      {wakalaSummary.length === 0 ? (
        <EmptyState variant="dashed" title={t("obligations.summary.emptyFiltered")} compact role="alert" />
      ) : (
        <div className={WORK_SURFACE}>
          <div className="space-y-3 p-3 md:hidden">
            {wakalaSummary.map((wakalaSummaryItem) => (
              <article key={wakalaSummaryItem.key} className={`${WORK_SURFACE_INNER} space-y-3 p-3`}>
                <div>
                  <h4 className="text-sm font-semibold text-foreground m-0">{wakalaSummaryItem.repName}</h4>
                  {!wakalaSummaryItem.hasWakala && (
                    <span className="inline-flex items-center gap-1 text-xs text-warning font-bold mt-0.5" aria-label={t("obligations.summary.wakala.noConfigAria")}>
                      <AlertCircle className="w-3 h-3" aria-hidden="true" /> {t("obligations.summary.wakala.noConfig")}
                    </span>
                  )}
                </div>
                <StatGrid>
                  <StatRow
                    label={t("obligations.summary.wakala.colMujtahid")}
                    value={wakalaSummaryItem.mujtahidName}
                    ddClassName="text-xs text-muted-foreground"
                  />
                  <StatRow
                    label={t("obligations.summary.wakala.colObligation")}
                    value={<Badge pill tone="primary" className="px-2 font-bold">{wakalaSummaryItem.obligationType}</Badge>}
                  />
                  <StatRow
                    label={t("obligations.summary.wakala.colCollections")}
                    value={wakalaSummaryItem.count}
                    ddClassName="text-sm font-semibold"
                  />
                  <StatRow
                    label={t("obligations.summary.wakala.colTotalAmountShort")}
                    value={formatCurrency(wakalaSummaryItem.total)}
                    ddClassName="font-mono font-bold text-success text-sm"
                  />
                </StatGrid>
                {wakalaSummaryItem.distributions.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">{t("obligations.summary.wakala.colDistributions")}</p>
                    <div className="flex flex-wrap gap-1">
                      {wakalaSummaryItem.distributions.map((distribution) => (
                        <span key={distribution.id} className={`text-xs font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${distribution.type === "Liability" ? "bg-destructive/10 border-destructive/30 text-destructive" : "bg-success/10 border-success/30 text-success"}`}>
                          {distribution.name} {distribution.percentage}%
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            ))}
            <article className="space-y-2 rounded-xl border border-border bg-muted/30 p-3">
              <p className="text-xs font-bold text-muted-foreground uppercase m-0">{t("obligations.summary.wakala.configCount", { count: wakalaSummary.length })}</p>
              <p className="font-mono font-bold text-success text-sm m-0">{formatCurrency(totalAmount)}</p>
            </article>
          </div>
          <div className="hidden md:block">
            <Table>
              <caption className="sr-only">{t("obligations.summary.wakala.title")}</caption>
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
                  <ModuleTableHeaderCell columnKey="repWakala" className="px-3 py-2.5">{t("obligations.summary.wakala.colRepWakala")}</ModuleTableHeaderCell>
                  <ModuleTableHeaderCell columnKey="mujtahid" className="px-3 py-2.5">{t("obligations.summary.wakala.colMujtahid")}</ModuleTableHeaderCell>
                  <ModuleTableHeaderCell columnKey="obligation" className="px-3 py-2.5">{t("obligations.summary.wakala.colObligation")}</ModuleTableHeaderCell>
                  <ModuleTableHeaderCell columnKey="collections" className="px-3 py-2.5 text-end">{t("obligations.summary.wakala.colCollections")}</ModuleTableHeaderCell>
                  <ModuleTableHeaderCell columnKey="totalAmount" className="px-3 py-2.5 text-end">{t("obligations.summary.wakala.colTotalAmountShort")}</ModuleTableHeaderCell>
                  <ModuleTableHeaderCell columnKey="distributions" className="px-3 py-2.5">{t("obligations.summary.wakala.colDistributions")}</ModuleTableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/50">
                {wakalaSummary.map((wakalaSummaryItem) => (
                  <TableRow key={wakalaSummaryItem.key} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="px-3 py-2.5">
                      <p className="font-semibold text-foreground text-sm m-0">{wakalaSummaryItem.repName}</p>
                      {!wakalaSummaryItem.hasWakala && (
                        <span className="inline-flex items-center gap-1 text-xs text-warning font-bold mt-0.5" aria-label={t("obligations.summary.wakala.noConfigAria")}>
                          <AlertCircle className="w-3 h-3" aria-hidden="true" /> {t("obligations.summary.wakala.noConfig")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-3 py-2.5 text-xs text-muted-foreground">{wakalaSummaryItem.mujtahidName}</TableCell>
                    <TableCell className="px-3 py-2.5">
                      <Badge as="span" pill tone="primary" className="px-2 font-bold">{wakalaSummaryItem.obligationType}</Badge>
                    </TableCell>
                    <TableCell className="px-3 py-2.5 text-end text-sm font-semibold text-foreground">{wakalaSummaryItem.count}</TableCell>
                    <TableCell className="px-3 py-2.5 text-end font-mono font-bold text-success text-sm">{formatCurrency(wakalaSummaryItem.total)}</TableCell>
                    <TableCell className="px-3 py-2.5">
                      {wakalaSummaryItem.distributions.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {wakalaSummaryItem.distributions.map((distribution) => (
                            <span key={distribution.id} className={`text-xs font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${distribution.type === "Liability" ? "bg-destructive/10 border-destructive/30 text-destructive" : "bg-success/10 border-success/30 text-success"}`}>
                              {distribution.name} {distribution.percentage}%
                            </span>
                          ))}
                        </div>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4} className="px-3 py-2.5 text-xs font-bold text-muted-foreground uppercase">{t("obligations.summary.wakala.configCount", { count: wakalaSummary.length })}</TableCell>
                  <TableCell className="px-3 py-2.5 text-end font-mono font-bold text-success text-xs">{formatCurrency(totalAmount)}</TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </div>
      )}
    </section>
  );
}
