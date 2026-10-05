import React from "react";
import { Star } from "lucide-react";
import type { HTMLMotionProps } from "framer-motion";
import { formatDate } from "@mms/shared";
import type { Redemption } from "@/lib/data/hasanatData";
import { useTranslation } from "@/hooks/useTranslation";
import { useWorkCardAction } from "@/hooks/useWorkCardAction";
import { EntityCard } from "@/components/ui/EntityCard";
import { EntityCardMetaTile } from "@/components/ui/EntityCardMetaTile";

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
    <EntityCard
      className="space-y-3 p-4"
      {...cardProps}
      {...motionProps}
    >
      <EntityCard.Header
        id={redemption.id}
        displayName={redemption.studentName || "—"}
        subtitle={subtitle}
        isSelected={false}
        onSelect={() => {}}
        selectAriaLabel=""
        showSelect={false}
      />
      <EntityCard.MetaGrid className="pt-2 border-t border-border/40 ms-0">
        {columnVisible("reward") && (
          <EntityCardMetaTile label={t("hasanat.columns.redemption.reward")}>
            <span className="break-words">{redemption.reward}</span>
          </EntityCardMetaTile>
        )}
        {columnVisible("date") && (
          <EntityCardMetaTile label={t("hasanat.columns.redemption.date")}>
            <span className="font-mono">{formatDate(redemption.date)}</span>
          </EntityCardMetaTile>
        )}
        {columnVisible("approvedBy") && (
          <EntityCardMetaTile label={t("hasanat.columns.redemption.approvedBy")}>
            <span className="break-words">{redemption.approvedBy || "—"}</span>
          </EntityCardMetaTile>
        )}
      </EntityCard.MetaGrid>
    </EntityCard>
  );
}
