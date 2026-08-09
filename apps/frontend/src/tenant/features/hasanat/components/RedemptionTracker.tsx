import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Gift, Plus, Star } from "lucide-react";
import { Redemption, Distribution } from "@/lib/data/hasanatData";
import { useTranslation } from "@/hooks/useTranslation";
import { useListRowMotion } from "@/hooks/useListRowMotion";
import { ModuleColumnCustomizer, type ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { formatDate, formatNumber } from "@mms/shared";
import { useHasanatRedemptionsCollection, useHasanatMutations } from "@/tenant/features/hasanat/hooks/useHasanatApi";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ResizableTableHead } from "@/components/ui/ResizableTableHead";
import { RedeemModal } from "@/tenant/features/hasanat/components/RedeemModal";

const ALWAYS_COLUMN_VISIBLE = (_key: string): boolean => true;

export interface RedemptionTrackerProps {
  distributions: Distribution[];
  onUpdateDistributions: (distributions: Distribution[]) => void | Promise<void>;
  onFilteredCountChange?: (count: number) => void;
  canWrite?: boolean;
  isColumnVisible?: (key: string) => boolean;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
  columnCustomizer?: ModuleColumnCustomizerProps;
}

export function RedemptionTracker({
  distributions,
  onUpdateDistributions,
  onFilteredCountChange,
  canWrite = true,
  isColumnVisible,
  getColumnWidth,
  onColumnResize,
  columnCustomizer,
}: RedemptionTrackerProps) {
  const { t } = useTranslation();
  const rowMotion = useListRowMotion({ fade: true, duration: 0.1 });
  const redemptions = useHasanatRedemptionsCollection();
  const { replaceRedemptions } = useHasanatMutations();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    onFilteredCountChange?.(redemptions.length);
  }, [redemptions.length, onFilteredCountChange]);

  const totalPoints = redemptions.reduce((sum: number, redemption: Redemption) => sum + redemption.pointsUsed, 0);

  const handleSave = async (redemption: Redemption) => {
    await replaceRedemptions.mutateAsync([...redemptions, redemption]);
    await onUpdateDistributions(distributions.map((distribution: Distribution) => distribution.id === redemption.distributionId ? { ...distribution, status: "redeemed" as const } : distribution));
    setShowModal(false);
  };

  const columnVisible = isColumnVisible ?? ALWAYS_COLUMN_VISIBLE;

  return (
    <section aria-label={t("hasanat.tabs.redemptions")} className="space-y-4">
      <header className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-warning" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-foreground m-0">
            {t("hasanat.redemptionsSummary", { count: redemptions.length, points: formatNumber(totalPoints) })}
          </h2>

        </div>
        <div className="flex items-center gap-2">
          {columnCustomizer && (
            <ModuleColumnCustomizer
              columnRegistry={columnCustomizer.columnRegistry}
              updateUserColumnLayout={columnCustomizer.updateUserColumnLayout}
              labels={columnCustomizer.labels}
            />
          )}
          {canWrite && (
            <Button
              type="button"
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {t("hasanat.recordRedemption")}
            </Button>
          )}
        </div>
      </header>

      {redemptions.length === 0 ? (
        <EmptyState
          variant="dashed"
          icon={Gift}
          title={t("hasanat.empty.redemptions")}
        />
      ) : (
        <Card accentColor="primary" className="p-0 overflow-hidden">
          <div className="space-y-3 p-3 md:hidden">
            {redemptions.map((redemption, index) => (
              <motion.article
                key={redemption.id}
                {...rowMotion(index * 0.04)}
                className="space-y-3 rounded-xl border border-border bg-card p-3"
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  {columnVisible("student") && (
                    <h4 className="min-w-0 truncate text-sm font-semibold text-foreground">{redemption.studentName || "—"}</h4>
                  )}
                  {columnVisible("pointsUsed") && (
                    <div className="flex shrink-0 items-center gap-1">
                      <Star className="w-3 h-3 text-warning" aria-hidden="true" />
                      <span className="text-sm font-bold text-warning">{redemption.pointsUsed}</span>
                    </div>
                  )}
                </div>
                <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  {columnVisible("reward") && (
                    <div>
                      <dt className="text-xs font-semibold text-muted-foreground">{t("hasanat.columns.redemption.reward")}</dt>
                      <dd className="break-words text-foreground">{redemption.reward}</dd>
                    </div>
                  )}
                  {columnVisible("date") && (
                    <div>
                      <dt className="text-xs font-semibold text-muted-foreground">{t("hasanat.columns.redemption.date")}</dt>
                      <dd className="text-muted-foreground">{formatDate(redemption.date)}</dd>
                    </div>
                  )}
                  {columnVisible("approvedBy") && (
                    <div>
                      <dt className="text-xs font-semibold text-muted-foreground">{t("hasanat.columns.redemption.approvedBy")}</dt>
                      <dd className="break-words text-muted-foreground">{redemption.approvedBy || "—"}</dd>
                    </div>
                  )}
                </dl>
              </motion.article>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm table-fixed">
              <caption className="sr-only">{t("hasanat.tabs.redemptions")}</caption>
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {columnVisible("student") && (
                    <ResizableTableHead columnKey="student" width={getColumnWidth?.("student")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                      {t("hasanat.columns.redemption.student")}
                    </ResizableTableHead>
                  )}
                  {columnVisible("reward") && (
                    <ResizableTableHead columnKey="reward" width={getColumnWidth?.("reward")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                      {t("hasanat.columns.redemption.reward")}
                    </ResizableTableHead>
                  )}
                  {columnVisible("pointsUsed") && (
                    <ResizableTableHead columnKey="pointsUsed" width={getColumnWidth?.("pointsUsed")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                      {t("hasanat.columns.redemption.pointsUsed")}
                    </ResizableTableHead>
                  )}
                  {columnVisible("date") && (
                    <ResizableTableHead columnKey="date" width={getColumnWidth?.("date")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                      {t("hasanat.columns.redemption.date")}
                    </ResizableTableHead>
                  )}
                  {columnVisible("approvedBy") && (
                    <ResizableTableHead columnKey="approvedBy" width={getColumnWidth?.("approvedBy")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                      {t("hasanat.columns.redemption.approvedBy")}
                    </ResizableTableHead>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {redemptions.map((redemption, index) => (
                  <motion.tr key={redemption.id} {...rowMotion(index * 0.04)} className="hover:bg-muted/20 transition-colors">
                    {columnVisible("student") && (
                      <td className="px-4 py-3 text-sm font-semibold text-foreground whitespace-nowrap">{redemption.studentName || "—"}</td>
                    )}
                    {columnVisible("reward") && (
                      <td className="px-4 py-3 text-sm text-foreground">{redemption.reward}</td>
                    )}
                    {columnVisible("pointsUsed") && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-warning" aria-hidden="true" />
                          <span className="text-sm font-bold text-warning">{redemption.pointsUsed}</span>
                        </div>
                      </td>
                    )}
                    {columnVisible("date") && (
                      <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{formatDate(redemption.date)}</td>
                    )}
                    {columnVisible("approvedBy") && (
                      <td className="px-4 py-3 text-sm text-muted-foreground">{redemption.approvedBy || "—"}</td>
                    )}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {canWrite && (
        <RedeemModal open={showModal} distributions={distributions} onClose={() => setShowModal(false)} onSave={handleSave} />
      )}
    </section>
  );
}
