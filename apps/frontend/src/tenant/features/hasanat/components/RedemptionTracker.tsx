import React, { useState, useEffect } from "react";
import { Gift, Plus, Star } from "lucide-react";
import { type Redemption, type Distribution } from "@/lib/data/hasanatData";
import { useTranslation } from "@/hooks/useTranslation";
import { useListRowMotion } from "@/hooks/useListRowMotion";
import { ModuleColumnCustomizer, type ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { formatNumber } from "@mms/shared";
import { useHasanatRedemptionsCollection, useHasanatMutations } from "@/tenant/features/hasanat/hooks/useHasanatApi";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { DirectoryCardsGrid } from "@/components/ui/DirectoryCardsGrid";
import { WorkViewModeToggle } from "@/components/ui/WorkViewModeToggle";
import { useWorkDirectoryViewMode, type WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import { RedeemModal } from "@/tenant/features/hasanat/components/RedeemModal";
import { RedemptionCard } from "./RedemptionCard";
import { RedemptionTable } from "./RedemptionTable";

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
  viewMode?: WorkDirectoryViewMode;
  onViewModeChange?: (mode: WorkDirectoryViewMode) => void;
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
  viewMode: propViewMode,
  onViewModeChange: propOnViewModeChange,
}: RedemptionTrackerProps): React.JSX.Element {
  const { t } = useTranslation();
  const rowMotion = useListRowMotion({ fade: true, duration: 0.1 });
  const redemptions = useHasanatRedemptionsCollection();
  const { replaceRedemptions } = useHasanatMutations();
  const [showModal, setShowModal] = useState(false);
  const directoryViewMode = useWorkDirectoryViewMode();
  const viewMode = propViewMode ?? directoryViewMode.viewMode;
  const setViewMode = propOnViewModeChange ?? directoryViewMode.setViewMode;

  useEffect(() => {
    onFilteredCountChange?.(redemptions.length);
  }, [redemptions.length, onFilteredCountChange]);

  const totalPoints = redemptions.reduce(
    (sum: number, redemption: Redemption) => sum + redemption.pointsUsed,
    0,
  );

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
        title={t("hasanat.redemptionsSummary", {
          count: redemptions.length,
          points: formatNumber(totalPoints),
        })}
        actions={
          <>
            <WorkViewModeToggle
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
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
                className="flex items-center gap-1.5 min-h-11 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
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
      ) : viewMode === "cards" ? (
        <DirectoryCardsGrid>
          {redemptions.map((redemption, index) => (
            <RedemptionCard
              key={redemption.id}
              redemption={redemption}
              columnVisible={columnVisible}
              motionProps={rowMotion(index * 0.04)}
            />
          ))}
        </DirectoryCardsGrid>
      ) : (
        <RedemptionTable
          redemptions={redemptions}
          columnVisible={columnVisible}
          getColumnWidth={getColumnWidth}
          onColumnResize={onColumnResize}
          rowMotion={rowMotion}
        />
      )}

      {canWrite && (
        <RedeemModal
          open={showModal}
          distributions={distributions}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </section>
  );
}
