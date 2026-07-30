import React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { ObligationDistribution } from '@/lib/data/obligationsData';
import { Button } from "@/components/ui/button";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";

interface WakalaDistributionListProps {
  distributions: ObligationDistribution[];
  distributionTypeConfig: Record<string, StatusBadgeConfigItem>;
  t: TranslationFunction;
  onEdit: (distribution: ObligationDistribution) => void;
  onDelete: (distributionId: string) => void;
}

export function WakalaDistributionList({
  distributions,
  distributionTypeConfig,
  t,
  onEdit,
  onDelete,
}: WakalaDistributionListProps): React.JSX.Element {
  return (
    <>
      <div className="space-y-3 p-3 md:hidden">
        {distributions.map((distribution) => (
          <article
            key={distribution.id}
            className="space-y-3 rounded-xl border border-border bg-card p-3"
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <p className="text-sm font-medium text-foreground">{distribution.name}</p>
              <div className="flex shrink-0 items-center gap-1">
                <Button type="button" aria-label={t("obligations.wakala.distEditAria", { name: distribution.name })} onClick={() => onEdit(distribution)}
                  variant="ghost"
                  size="icon"
                  className="rounded hover:bg-muted text-muted-foreground hover:text-foreground shadow-none transition-colors">
                  <Pencil className="w-3 h-3" aria-hidden="true" />
                </Button>
                <Button type="button" aria-label={t("obligations.wakala.distDeleteAria", { name: distribution.name })} onClick={() => onDelete(distribution.id)}
                  variant="ghost"
                  size="icon"
                  className="rounded hover:bg-muted text-muted-foreground hover:text-destructive shadow-none transition-colors">
                  <Trash2 className="w-3 h-3" aria-hidden="true" />
                </Button>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-xs font-semibold text-muted-foreground">{t("obligations.wakala.colType")}</dt>
                <dd>
                  <StatusBadge status={distribution.type} config={distributionTypeConfig} size="sm" />
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-muted-foreground">{t("obligations.wakala.colPct")}</dt>
                <dd className="font-mono text-xs font-semibold text-foreground">{distribution.percentage}%</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-xs">
          <caption className="sr-only">{t("obligations.wakala.distTableCaption")}</caption>
          <thead className="border-b border-border">
            <tr>
              <th scope="col" className="px-4 py-2 text-start font-semibold text-muted-foreground">{t("obligations.wakala.colName")}</th>
              <th scope="col" className="px-4 py-2 text-start font-semibold text-muted-foreground">{t("obligations.wakala.colType")}</th>
              <th scope="col" className="px-4 py-2 text-start font-semibold text-muted-foreground">{t("obligations.wakala.colPct")}</th>
              <th scope="col" className="px-4 py-2 text-end font-semibold text-muted-foreground"><span className="sr-only">{t("obligations.wakala.colActions")}</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {distributions.map((distribution) => (
              <tr key={distribution.id} className="hover:bg-muted/20">
                <td className="px-4 py-2 font-medium text-foreground">{distribution.name}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={distribution.type} config={distributionTypeConfig} size="sm" />
                </td>
                <td className="px-4 py-2 font-mono font-semibold text-foreground">{distribution.percentage}%</td>
                <td className="px-4 py-2 text-end">
                  <div className="flex items-center justify-end gap-1">
                    <Button type="button" aria-label={t("obligations.wakala.distEditAria", { name: distribution.name })} onClick={() => onEdit(distribution)}
                      variant="ghost"
                      size="icon"
                      className="rounded hover:bg-muted text-muted-foreground hover:text-foreground shadow-none transition-colors">
                      <Pencil className="w-3 h-3" aria-hidden="true" />
                    </Button>
                    <Button type="button" aria-label={t("obligations.wakala.distDeleteAria", { name: distribution.name })} onClick={() => onDelete(distribution.id)}
                      variant="ghost"
                      size="icon"
                      className="rounded hover:bg-muted text-muted-foreground hover:text-destructive shadow-none transition-colors">
                      <Trash2 className="w-3 h-3" aria-hidden="true" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
