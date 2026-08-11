import { EmptyState } from "@/components/ui/EmptyState";
import { ExportToolbar } from "@/components/ui/ExportToolbar";
import { useTranslation } from "@/hooks/useTranslation";
import { getInitials } from "@mms/shared";
import { Users } from "lucide-react";
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
import { StatGrid, StatRow } from "@/components/ui/StatGrid";

import { SectionHeader } from "@/components/ui/SectionHeader";

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
}

export function ObligationsRepDuesSection({
  repSummary,
  totalAmount,
  activeCurrencyCode,
  formatCurrency,
  formatValueOnly,
}: ObligationsRepDuesSectionProps) {
  const { t } = useTranslation();
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
          <div className="space-y-3 p-3 md:hidden">
            {repSummary.map((representativeSummary) => (
              <article key={representativeSummary.key} className={`${WORK_SURFACE_INNER} space-y-3 p-3`}>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                    <span className="text-xs font-bold text-primary">{getInitials(representativeSummary.repName)}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm m-0">{representativeSummary.repName}</h4>
                    <p className="text-xs text-muted-foreground m-0">{representativeSummary.mujtahidName}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">{t("obligations.summary.rep.colByType")}</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(representativeSummary.byType).map(([name, amount]) => (
                      <span key={name} className="text-xs font-medium px-1.5 py-0.5 rounded bg-muted border border-border text-foreground whitespace-nowrap">
                        {name}: {formatValueOnly(amount)}
                      </span>
                    ))}
                  </div>
                </div>
                <StatGrid columns="sm3">
                  <StatRow
                    label={t("obligations.summary.rep.colCollections")}
                    value={representativeSummary.count}
                    ddClassName="text-sm font-semibold"
                  />
                  <StatRow
                    label={t("obligations.summary.rep.colTotalCollectedShort")}
                    value={formatCurrency(representativeSummary.total)}
                    ddClassName="font-mono font-bold text-sm"
                  />
                  <StatRow
                    label={t("obligations.summary.rep.colDueToRepShort")}
                    value={formatCurrency(representativeSummary.due)}
                    dtClassName="text-destructive"
                    ddClassName="font-mono font-bold text-destructive text-sm"
                  />
                </StatGrid>
              </article>
            ))}
            <article className="space-y-2 rounded-xl border border-border bg-muted/30 p-3">
              <p className="text-xs font-bold text-muted-foreground uppercase m-0">{t("obligations.summary.rep.repCount", { count: repSummary.length })}</p>
              <StatGrid>
                <StatRow
                  label={t("obligations.summary.rep.colTotalCollectedShort")}
                  value={formatCurrency(totalAmount)}
                  ddClassName="font-mono font-bold text-xs"
                />
                <StatRow
                  label={t("obligations.summary.rep.colDueToRepShort")}
                  value={formatCurrency(totalDue)}
                  dtClassName="text-destructive"
                  ddClassName="font-mono font-bold text-destructive text-xs"
                />
              </StatGrid>
            </article>
          </div>
          <div className="hidden md:block">
            <Table>
              <caption className="sr-only">{t("obligations.summary.rep.title")}</caption>
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
                  <ModuleTableHeaderCell columnKey="representative" className="px-3 py-2.5">{t("obligations.summary.rep.colRepresentative")}</ModuleTableHeaderCell>
                  <ModuleTableHeaderCell columnKey="mujtahid" className="px-3 py-2.5">{t("obligations.summary.rep.colMujtahid")}</ModuleTableHeaderCell>
                  <ModuleTableHeaderCell columnKey="byType" className="px-3 py-2.5">{t("obligations.summary.rep.colByType")}</ModuleTableHeaderCell>
                  <ModuleTableHeaderCell columnKey="collections" className="px-3 py-2.5 text-end">{t("obligations.summary.rep.colCollections")}</ModuleTableHeaderCell>
                  <ModuleTableHeaderCell columnKey="totalCollected" className="px-3 py-2.5 text-end">{t("obligations.summary.rep.colTotalCollectedShort")}</ModuleTableHeaderCell>
                  <ModuleTableHeaderCell columnKey="dueToRep" className="px-3 py-2.5 text-end text-destructive">{t("obligations.summary.rep.colDueToRepShort")}</ModuleTableHeaderCell>
                </TableRow>
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
                    <TableCell className="px-3 py-2.5 text-end text-sm font-semibold text-foreground">{representativeSummary.count}</TableCell>
                    <TableCell className="px-3 py-2.5 text-end font-mono font-bold text-foreground text-sm">{formatCurrency(representativeSummary.total)}</TableCell>
                    <TableCell className="px-3 py-2.5 text-end">
                      <span className="font-mono font-bold text-destructive text-sm">{formatCurrency(representativeSummary.due)}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4} className="px-3 py-2.5 text-xs font-bold text-muted-foreground uppercase">{t("obligations.summary.rep.repCount", { count: repSummary.length })}</TableCell>
                  <TableCell className="px-3 py-2.5 text-end font-mono font-bold text-foreground text-xs">{formatCurrency(totalAmount)}</TableCell>
                  <TableCell className="px-3 py-2.5 text-end font-mono font-bold text-destructive text-xs">{formatCurrency(totalDue)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </div>
      )}
    </section>
  );
}
