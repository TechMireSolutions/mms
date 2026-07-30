import { ExportToolbar } from "@/components/ui/ExportToolbar";
import { useTranslation } from "@/hooks/useTranslation";
import { getInitials } from "@mms/shared";
import { Users } from "lucide-react";

import { SectionTitle } from "./ObligationsSectionTitle";

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
      <header className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <SectionTitle icon={Users} title={t("obligations.summary.rep.title")} subtitle={t("obligations.summary.rep.subtitle")} noMargin />
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
      </header>
      {repSummary.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground" role="alert">{t("obligations.summary.emptyFiltered")}</div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="space-y-3 p-3 md:hidden">
            {repSummary.map((representativeSummary) => (
              <article key={representativeSummary.key} className="space-y-3 rounded-xl border border-border bg-card p-3">
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
                <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t("obligations.summary.rep.colCollections")}</dt>
                    <dd className="text-sm font-semibold text-foreground">{representativeSummary.count}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t("obligations.summary.rep.colTotalCollectedShort")}</dt>
                    <dd className="font-mono font-bold text-foreground text-sm">{formatCurrency(representativeSummary.total)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-destructive">{t("obligations.summary.rep.colDueToRepShort")}</dt>
                    <dd className="font-mono font-bold text-destructive text-sm">{formatCurrency(representativeSummary.due)}</dd>
                  </div>
                </dl>
              </article>
            ))}
            <article className="space-y-2 rounded-xl border border-border bg-muted/30 p-3">
              <p className="text-xs font-bold text-muted-foreground uppercase m-0">{t("obligations.summary.rep.repCount", { count: repSummary.length })}</p>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">{t("obligations.summary.rep.colTotalCollectedShort")}</dt>
                  <dd className="font-mono font-bold text-foreground text-xs">{formatCurrency(totalAmount)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-destructive">{t("obligations.summary.rep.colDueToRepShort")}</dt>
                  <dd className="font-mono font-bold text-destructive text-xs">{formatCurrency(totalDue)}</dd>
                </div>
              </dl>
            </article>
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <caption className="sr-only">{t("obligations.summary.rep.title")}</caption>
              <thead className="bg-muted/60 border-b border-border">
                <tr>
                  <th scope="col" className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">{t("obligations.summary.rep.colRepresentative")}</th>
                  <th scope="col" className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">{t("obligations.summary.rep.colMujtahid")}</th>
                  <th scope="col" className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">{t("obligations.summary.rep.colByType")}</th>
                  <th scope="col" className="px-3 py-2.5 text-end text-xs font-semibold text-muted-foreground uppercase">{t("obligations.summary.rep.colCollections")}</th>
                  <th scope="col" className="px-3 py-2.5 text-end text-xs font-semibold text-muted-foreground uppercase">{t("obligations.summary.rep.colTotalCollectedShort")}</th>
                  <th scope="col" className="px-3 py-2.5 text-end text-xs font-semibold text-destructive uppercase">{t("obligations.summary.rep.colDueToRepShort")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {repSummary.map((representativeSummary) => (
                  <tr key={representativeSummary.key} className="hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                          <span className="text-xs font-bold text-primary">{getInitials(representativeSummary.repName)}</span>
                        </div>
                        <p className="font-semibold text-foreground text-sm m-0">{representativeSummary.repName}</p>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{representativeSummary.mujtahidName}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(representativeSummary.byType).map(([name, amount]) => (
                          <span key={name} className="text-xs font-medium px-1.5 py-0.5 rounded bg-muted border border-border text-foreground whitespace-nowrap">
                            {name}: {formatValueOnly(amount)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-end text-sm font-semibold text-foreground">{representativeSummary.count}</td>
                    <td className="px-3 py-3 text-end font-mono font-bold text-foreground text-sm">{formatCurrency(representativeSummary.total)}</td>
                    <td className="px-3 py-3 text-end">
                      <span className="font-mono font-bold text-destructive text-sm">{formatCurrency(representativeSummary.due)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-border bg-muted/30">
                <tr>
                  <td colSpan={4} className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase">{t("obligations.summary.rep.repCount", { count: repSummary.length })}</td>
                  <td className="px-3 py-2 text-end font-mono font-bold text-foreground text-xs">{formatCurrency(totalAmount)}</td>
                  <td className="px-3 py-2 text-end font-mono font-bold text-destructive text-xs">{formatCurrency(totalDue)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
