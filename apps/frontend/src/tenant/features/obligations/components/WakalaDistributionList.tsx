import React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { ObligationDistribution } from '@/lib/data/obligationsData';
import { Button } from "@/components/ui/button";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { ModuleTableHeaderCell } from "@/components/ui/ModuleTableHeaderCell";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WORK_SURFACE, WORK_SURFACE_INNER } from "@/components/ui/formStyles";
import { StatGrid, StatRow } from "@/components/ui/StatGrid";
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
    <div className={WORK_SURFACE}>
      <div className="space-y-3 p-3 md:hidden">
        {distributions.map((distribution) => (
          <article
            key={distribution.id}
            className={`${WORK_SURFACE_INNER} space-y-3 p-3`}
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <p className="text-sm font-medium text-foreground">{distribution.name}</p>
              <div className="flex shrink-0 items-center gap-1">
                <Button type="button" aria-label={t("obligations.wakala.distEditAria", { name: distribution.name })} onClick={() => onEdit(distribution)}
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 min-h-7 min-w-7 rounded-lg border-info/30 bg-info/5 text-info hover:text-info hover:bg-info/15 hover:border-info/40 shadow-none transition-colors">
                  <Pencil className="w-3 h-3" aria-hidden="true" />
                </Button>
                <Button type="button" aria-label={t("obligations.wakala.distDeleteAria", { name: distribution.name })} onClick={() => onDelete(distribution.id)}
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 min-h-7 min-w-7 rounded-lg border-destructive/30 bg-destructive/5 text-destructive hover:text-destructive hover:bg-destructive/15 hover:border-destructive/40 shadow-none transition-colors">
                  <Trash2 className="w-3 h-3" aria-hidden="true" />
                </Button>
              </div>
            </div>
            <StatGrid>
              <StatRow
                label={t("obligations.wakala.colType")}
                value={<StatusBadge status={distribution.type} config={distributionTypeConfig} size="sm" />}
              />
              <StatRow
                label={t("obligations.wakala.colPct")}
                value={`${distribution.percentage}%`}
                ddClassName="font-mono text-xs font-semibold"
              />
            </StatGrid>
          </article>
        ))}
      </div>
      <div className="hidden md:block">
        <Table>
          <caption className="sr-only">{t("obligations.wakala.distTableCaption")}</caption>
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
              <ModuleTableHeaderCell columnKey="name" className="px-3 py-2.5">{t("obligations.wakala.colName")}</ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="type" className="px-3 py-2.5">{t("obligations.wakala.colType")}</ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="percentage" className="px-3 py-2.5">{t("obligations.wakala.colPct")}</ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="actions" className="px-3 py-2.5 text-end"><span className="sr-only">{t("obligations.wakala.colActions")}</span></ModuleTableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/50">
            {distributions.map((distribution) => (
              <TableRow key={distribution.id} className="hover:bg-muted/20 transition-colors">
                <TableCell className="px-3 py-2.5 font-medium text-foreground">{distribution.name}</TableCell>
                <TableCell className="px-3 py-2.5">
                  <StatusBadge status={distribution.type} config={distributionTypeConfig} size="sm" />
                </TableCell>
                <TableCell className="px-3 py-2.5 font-mono font-semibold text-foreground">{distribution.percentage}%</TableCell>
                <TableCell className="px-3 py-2.5 text-end">
                  <div className="flex items-center justify-end gap-1">
                    <Button type="button" aria-label={t("obligations.wakala.distEditAria", { name: distribution.name })} onClick={() => onEdit(distribution)}
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 min-h-7 min-w-7 rounded-lg border-info/30 bg-info/5 text-info hover:text-info hover:bg-info/15 hover:border-info/40 shadow-none transition-colors">
                      <Pencil className="w-3 h-3" aria-hidden="true" />
                    </Button>
                    <Button type="button" aria-label={t("obligations.wakala.distDeleteAria", { name: distribution.name })} onClick={() => onDelete(distribution.id)}
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 min-h-7 min-w-7 rounded-lg border-destructive/30 bg-destructive/5 text-destructive hover:text-destructive hover:bg-destructive/15 hover:border-destructive/40 shadow-none transition-colors">
                      <Trash2 className="w-3 h-3" aria-hidden="true" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
