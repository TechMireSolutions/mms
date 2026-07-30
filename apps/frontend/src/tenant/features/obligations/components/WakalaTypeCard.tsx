import React from "react";
import { Plus, Pencil, Trash2, AlertCircle } from "lucide-react";
import { WakalaType, ObligationDistribution } from '@/lib/data/obligationsData';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { WakalaDistributionList } from "@/tenant/features/obligations/components/WakalaDistributionList";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";

interface WakalaTypeCardProps {
  wakalaType: WakalaType;
  typeName: string;
  repName: string;
  mujtahidName: string;
  wakalaDistributions: ObligationDistribution[];
  total: number;
  isComplete: boolean;
  distributionTypeConfig: Record<string, StatusBadgeConfigItem>;
  t: TranslationFunction;
  onEdit: () => void;
  onDelete: () => void;
  onEditDistribution: (distribution: ObligationDistribution) => void;
  onDeleteDistribution: (distributionId: string) => void;
  onAddDistribution: () => void;
}

export function WakalaTypeCard({
  wakalaType,
  typeName,
  repName,
  mujtahidName,
  wakalaDistributions,
  total,
  isComplete,
  distributionTypeConfig,
  t,
  onEdit,
  onDelete,
  onEditDistribution,
  onDeleteDistribution,
  onAddDistribution,
}: WakalaTypeCardProps): React.JSX.Element {
  return (
    <Card key={wakalaType.id} accentColor="primary" className="group/wakala">
      <header className="flex flex-col gap-2 border-b border-border/40 px-5 py-3 ps-5.5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h3 className="m-0 min-w-0 truncate text-sm font-bold text-foreground">{typeName}</h3>
            <span className="shrink-0 text-xs text-muted-foreground">{t("obligations.wakala.via")}</span>
            <span className="min-w-0 truncate text-sm font-semibold text-foreground">{repName}</span>
          </div>
          <p className="m-0 mt-0.5 truncate text-xs text-muted-foreground">{t("obligations.wakala.mujtahidLabel", { name: mujtahidName })}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1 self-end sm:self-start">
          <span aria-label={t("obligations.wakala.totalPctAria", { pct: total.toFixed(0) })}>
            <StatusBadge
              status={isComplete ? "complete" : "incomplete"}
              size="sm"
              config={{
                complete: { label: `${total.toFixed(0)}%`, cls: SEMANTIC_BADGE.success },
                incomplete: { label: `${total.toFixed(0)}%`, cls: SEMANTIC_BADGE.warning },
              }}
            />
          </span>
          <Button type="button" aria-label={t("obligations.wakala.editAria", { name: typeName })} onClick={onEdit}
            variant="ghost"
            size="icon"
            className="rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground shadow-none transition-colors">
            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
          </Button>
          <Button type="button" aria-label={t("obligations.wakala.deleteAria", { name: typeName })} onClick={onDelete}
            variant="ghost"
            size="icon"
            className="rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive shadow-none transition-colors">
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          </Button>
        </div>
      </header>

      <div className="bg-muted/20">
        {!isComplete && total > 0 && (
          <div className="flex items-center gap-1.5 px-4 py-2 bg-warning/10 border-b border-warning/20 text-xs text-warning" role="alert">
            <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" /> {t("obligations.wakala.incompleteAlert", { pct: total.toFixed(1) })}
          </div>
        )}
        {wakalaDistributions.length === 0 ? (
          <p className="px-4 py-3 text-xs text-muted-foreground m-0">{t("obligations.wakala.noDistributions")}</p>
        ) : (
          <WakalaDistributionList
            distributions={wakalaDistributions}
            distributionTypeConfig={distributionTypeConfig}
            t={t}
            onEdit={onEditDistribution}
            onDelete={onDeleteDistribution}
          />
        )}
        <div className="px-4 py-2 border-t border-border">
          <Button type="button" onClick={onAddDistribution}
            variant="ghost"
            className="flex items-center gap-1 min-h-11 h-auto px-1 text-xs font-semibold text-primary hover:text-primary/80 hover:bg-transparent shadow-none transition-colors">
            <Plus className="w-3 h-3" aria-hidden="true" /> {t("obligations.wakala.addDistribution")}
          </Button>
        </div>
      </div>
    </Card>
  );
}
