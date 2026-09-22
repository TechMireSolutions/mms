import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Gift, Plus, Star } from "lucide-react";
import { type Redemption, type Distribution } from "@/lib/data/hasanatData";
import { useTranslation } from "@/hooks/useTranslation";
import { useListRowMotion } from "@/hooks/useListRowMotion";
import { ModuleColumnCustomizer, type ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { formatDate, formatNumber } from "@mms/shared";
import { useHasanatRedemptionsCollection, useHasanatMutations } from "@/tenant/features/hasanat/hooks/useHasanatApi";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ModuleTableHeaderCell } from "@/components/ui/ModuleTableHeaderCell";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import { DirectoryEntityCard } from "@/components/ui/DirectoryEntityCard";
import { DirectoryCardHeader } from "@/components/ui/DirectoryCardHeader";
import { DirectoryCardMetaGrid } from "@/components/ui/DirectoryCardMetaGrid";
import { DirectoryCardMetaTile } from "@/components/ui/DirectoryCardMetaTile";
import { useWorkCardAction } from "@/hooks/useWorkCardAction";
import { RedeemModal } from "@/tenant/features/hasanat/components/RedeemModal";
import type { HTMLMotionProps } from "framer-motion";

const ALWAYS_COLUMN_VISIBLE = (_key: string): boolean => true;

export interface RedemptionTrackerProps {
  distributions: Distribution[];
  onUpdateDistribution: (distribution: Distribution) => void | Promise<void>;
  onFilteredCountChange?: (count: number) => void;
  canWrite?: boolean;
  isColumnVisible?: (key: string) => boolean;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
  columnCustomizer?: ModuleColumnCustomizerProps;
}

interface RedemptionCardProps {
  redemption: Redemption;
  columnVisible: (key: string) => boolean;
  motionProps?: HTMLMotionProps<"div">;
}

function RedemptionCard({
  redemption,
  columnVisible,
  motionProps,
}: RedemptionCardProps): React.JSX.Element {
  const { t } = useTranslation();
  const { cardProps } = useWorkCardAction({
    entity: redemption,
    selectedIds: [],
    canSelect: false,
  });

  const subtitle = columnVisible("pointsUsed") ? (
    <div className="flex shrink-0 items-center gap-1 mt-0.5">
      <Star className="w-3.5 h-3.5 text-warning" aria-hidden="true" />
      <span className="text-xs font-bold text-warning">
        {t("hasanat.form.pointsShort", { points: redemption.pointsUsed })}
      </span>
    </div>
  ) : undefined;

  return (
    <DirectoryEntityCard
      className="space-y-3 p-4"
      {...cardProps}
      {...motionProps}
    >
      <DirectoryCardHeader
        id={redemption.id}
        displayName={redemption.studentName || "—"}
        subtitle={subtitle}
        isSelected={false}
        onSelect={() => {}}
        selectAriaLabel=""
        showSelect={false}
      />
      <DirectoryCardMetaGrid className="pt-2 border-t border-border/40 ms-0">
        {columnVisible("reward") && (
          <DirectoryCardMetaTile label={t("hasanat.columns.redemption.reward")}>
            <span className="break-words">{redemption.reward}</span>
          </DirectoryCardMetaTile>
        )}
        {columnVisible("date") && (
          <DirectoryCardMetaTile label={t("hasanat.columns.redemption.date")}>
            <span className="font-mono">{formatDate(redemption.date)}</span>
          </DirectoryCardMetaTile>
        )}
        {columnVisible("approvedBy") && (
          <DirectoryCardMetaTile label={t("hasanat.columns.redemption.approvedBy")}>
            <span className="break-words">{redemption.approvedBy || "—"}</span>
          </DirectoryCardMetaTile>
        )}
      </DirectoryCardMetaGrid>
    </DirectoryEntityCard>
  );
}

export function RedemptionTracker({
  distributions,
  onUpdateDistribution,
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
    const distribution = distributions.find((item) => item.id === redemption.distributionId);
    if (distribution) {
      await onUpdateDistribution({ ...distribution, status: "redeemed" as const });
    }
    setShowModal(false);
  };

  const columnVisible = isColumnVisible ?? ALWAYS_COLUMN_VISIBLE;

  return (
    <section aria-label={t("hasanat.tabs.redemptions")} className="space-y-4">
      <SectionHeader
        layout="row"
        icon={<Star className="w-4 h-4 text-warning" aria-hidden="true" />}
        iconClassName="bg-warning/10"
        title={t("hasanat.redemptionsSummary", { count: redemptions.length, points: formatNumber(totalPoints) })}
        actions={
          <>
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
          </>
        }
      />

      {redemptions.length === 0 ? (
        <EmptyState
          variant="dashed"
          icon={Gift}
          title={t("hasanat.empty.redemptions")}
        />
      ) : (
        <div className={WORK_SURFACE}>
          <div className="space-y-3 p-3 md:hidden">
            {redemptions.map((redemption, index) => (
              <RedemptionCard
                key={redemption.id}
                redemption={redemption}
                columnVisible={columnVisible}
                motionProps={rowMotion(index * 0.04)}
              />
            ))}
          </div>
          <div className="hidden md:block">
            <Table className="table-fixed">
              <caption className="sr-only">{t("hasanat.tabs.redemptions")}</caption>
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
                  {columnVisible("student") && (
                    <ModuleTableHeaderCell columnKey="student" width={getColumnWidth?.("student")} onResize={onColumnResize} className="px-3 py-2.5">
                      {t("hasanat.columns.redemption.student")}
                    </ModuleTableHeaderCell>
                  )}
                  {columnVisible("reward") && (
                    <ModuleTableHeaderCell columnKey="reward" width={getColumnWidth?.("reward")} onResize={onColumnResize} className="px-3 py-2.5">
                      {t("hasanat.columns.redemption.reward")}
                    </ModuleTableHeaderCell>
                  )}
                  {columnVisible("pointsUsed") && (
                    <ModuleTableHeaderCell columnKey="pointsUsed" width={getColumnWidth?.("pointsUsed")} onResize={onColumnResize} className="px-3 py-2.5">
                      {t("hasanat.columns.redemption.pointsUsed")}
                    </ModuleTableHeaderCell>
                  )}
                  {columnVisible("date") && (
                    <ModuleTableHeaderCell columnKey="date" width={getColumnWidth?.("date")} onResize={onColumnResize} className="px-3 py-2.5">
                      {t("hasanat.columns.redemption.date")}
                    </ModuleTableHeaderCell>
                  )}
                  {columnVisible("approvedBy") && (
                    <ModuleTableHeaderCell columnKey="approvedBy" width={getColumnWidth?.("approvedBy")} onResize={onColumnResize} className="px-3 py-2.5">
                      {t("hasanat.columns.redemption.approvedBy")}
                    </ModuleTableHeaderCell>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/50">
                {redemptions.map((redemption, index) => (
                  <motion.tr key={redemption.id} {...rowMotion(index * 0.04)} className="hover:bg-muted/20 transition-colors">
                    {columnVisible("student") && (
                      <TableCell className="px-3 py-2.5 text-sm font-semibold text-foreground whitespace-nowrap">{redemption.studentName || "—"}</TableCell>
                    )}
                    {columnVisible("reward") && (
                      <TableCell className="px-3 py-2.5 text-sm text-foreground">{redemption.reward}</TableCell>
                    )}
                    {columnVisible("pointsUsed") && (
                      <TableCell className="px-3 py-2.5">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-warning" aria-hidden="true" />
                          <span className="text-sm font-bold text-warning">{redemption.pointsUsed}</span>
                        </div>
                      </TableCell>
                    )}
                    {columnVisible("date") && (
                      <TableCell className="px-3 py-2.5 text-sm text-muted-foreground whitespace-nowrap">{formatDate(redemption.date)}</TableCell>
                    )}
                    {columnVisible("approvedBy") && (
                      <TableCell className="px-3 py-2.5 text-sm text-muted-foreground">{redemption.approvedBy || "—"}</TableCell>
                    )}
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {canWrite && (
        <RedeemModal open={showModal} distributions={distributions} onClose={() => setShowModal(false)} onSave={handleSave} />
      )}
    </section>
  );
}
