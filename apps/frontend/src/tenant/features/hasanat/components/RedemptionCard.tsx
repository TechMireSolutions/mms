import React from "react";
import { Star } from "lucide-react";
import type { HTMLMotionProps } from "framer-motion";
import { formatDate } from "@mms/shared";
import type { Redemption } from "@/lib/data/hasanatData";
import { useTranslation } from "@/hooks/useTranslation";
import { useWorkCardAction } from "@/hooks/useWorkCardAction";
import { DirectoryEntityCard } from "@/components/ui/DirectoryEntityCard";
import { DirectoryCardHeader } from "@/components/ui/DirectoryCardHeader";
import { DirectoryCardMetaGrid } from "@/components/ui/DirectoryCardMetaGrid";
import { DirectoryCardMetaTile } from "@/components/ui/DirectoryCardMetaTile";

export interface RedemptionCardProps {
  redemption: Redemption;
  columnVisible: (key: string) => boolean;
  motionProps?: HTMLMotionProps<"div">;
}

export function RedemptionCard({
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
