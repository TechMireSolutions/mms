import { ExportToolbar } from "@/components/ui/ExportToolbar";
import { useTranslation } from "@/hooks/useTranslation";
import type { ObligationDistribution } from "@/lib/data/obligationsData";
import { AlertCircle, Layers } from "lucide-react";

import { SectionTitle } from "./ObligationsSectionTitle";

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
      <header className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <SectionTitle icon={Layers} title={t("obligations.summary.wakala.title")} subtitle={t("obligations.summary.wakala.subtitle")} noMargin />
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
      </header>
      {wakalaSummary.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground" role="alert">{t("obligations.summary.emptyFiltered")}</div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="space-y-3 p-3 md:hidden">
            {wakalaSummary.map((wakalaSummaryItem) => (
              <article key={wakalaSummaryItem.key} className="space-y-3 rounded-xl border border-border bg-card p-3">
                <div>
                  <h4 className="text-sm font-semibold text-foreground m-0">{wakalaSummaryItem.repName}</h4>
                  {!wakalaSummaryItem.hasWakala && (
                    <span className="inline-flex items-center gap-1 text-xs text-warning font-bold mt-0.5" aria-label={t("obligations.summary.wakala.noConfigAria")}>
                      <AlertCircle className="w-3 h-3" aria-hidden="true" /> {t("obligations.summary.wakala.noConfig")}
                    </span>
                  )}
                </div>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t("obligations.summary.wakala.colMujtahid")}</dt>
                    <dd className="text-xs text-muted-foreground">{wakalaSummaryItem.mujtahidName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t("obligations.summary.wakala.colObligation")}</dt>
                    <dd><span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full">{wakalaSummaryItem.obligationType}</span></dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t("obligations.summary.wakala.colCollections")}</dt>
                    <dd className="text-sm font-semibold text-foreground">{wakalaSummaryItem.count}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t("obligations.summary.wakala.colTotalAmountShort")}</dt>
                    <dd className="font-mono font-bold text-success text-sm">{formatCurrency(wakalaSummaryItem.total)}</dd>
                  </div>
                </dl>
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
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <caption className="sr-only">{t("obligations.summary.wakala.title")}</caption>
              <thead className="bg-muted/60 border-b border-border">
                <tr>
                  <th scope="col" className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">{t("obligations.summary.wakala.colRepWakala")}</th>
                  <th scope="col" className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">{t("obligations.summary.wakala.colMujtahid")}</th>
                  <th scope="col" className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">{t("obligations.summary.wakala.colObligation")}</th>
                  <th scope="col" className="px-3 py-2.5 text-end text-xs font-semibold text-muted-foreground uppercase">{t("obligations.summary.wakala.colCollections")}</th>
                  <th scope="col" className="px-3 py-2.5 text-end text-xs font-semibold text-muted-foreground uppercase">{t("obligations.summary.wakala.colTotalAmountShort")}</th>
                  <th scope="col" className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">{t("obligations.summary.wakala.colDistributions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {wakalaSummary.map((wakalaSummaryItem) => (
                  <tr key={wakalaSummaryItem.key} className="hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-3">
                      <p className="font-semibold text-foreground text-sm m-0">{wakalaSummaryItem.repName}</p>
                      {!wakalaSummaryItem.hasWakala && (
                        <span className="inline-flex items-center gap-1 text-xs text-warning font-bold mt-0.5" aria-label={t("obligations.summary.wakala.noConfigAria")}>
                          <AlertCircle className="w-3 h-3" aria-hidden="true" /> {t("obligations.summary.wakala.noConfig")}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{wakalaSummaryItem.mujtahidName}</td>
                    <td className="px-3 py-3">
                      <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full">{wakalaSummaryItem.obligationType}</span>
                    </td>
                    <td className="px-3 py-3 text-end text-sm font-semibold text-foreground">{wakalaSummaryItem.count}</td>
                    <td className="px-3 py-3 text-end font-mono font-bold text-success text-sm">{formatCurrency(wakalaSummaryItem.total)}</td>
                    <td className="px-3 py-3">
                      {wakalaSummaryItem.distributions.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {wakalaSummaryItem.distributions.map((distribution) => (
                            <span key={distribution.id} className={`text-xs font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${distribution.type === "Liability" ? "bg-destructive/10 border-destructive/30 text-destructive" : "bg-success/10 border-success/30 text-success"}`}>
                              {distribution.name} {distribution.percentage}%
                            </span>
                          ))}
                        </div>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-border bg-muted/30">
                <tr>
                  <td colSpan={4} className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase">{t("obligations.summary.wakala.configCount", { count: wakalaSummary.length })}</td>
                  <td className="px-3 py-2 text-end font-mono font-bold text-success text-xs">{formatCurrency(totalAmount)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
