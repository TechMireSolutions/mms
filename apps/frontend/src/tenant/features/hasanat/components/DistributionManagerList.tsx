import type React from "react";
import { Send } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import { DistributionManagerListCards } from "@/tenant/features/hasanat/components/DistributionManagerListCards";
import { DistributionManagerListDesktopTable } from "@/tenant/features/hasanat/components/DistributionManagerListDesktopTable";
import type { DistributionManagerListProps } from "@/tenant/features/hasanat/components/distributionManagerListShared";

export function DistributionManagerList(props: DistributionManagerListProps): React.JSX.Element {
  const { t } = useTranslation();

  if (props.distributions.length === 0) {
    return (
      <EmptyState
        variant="dashed"
        icon={Send}
        title={t("hasanat.empty.distributions")}
        compact
      />
    );
  }

  return props.viewMode === "cards" ? (
    <DistributionManagerListCards {...props} />
  ) : (
    <div className={WORK_SURFACE}>
      <DistributionManagerListDesktopTable {...props} />
    </div>
  );
}
