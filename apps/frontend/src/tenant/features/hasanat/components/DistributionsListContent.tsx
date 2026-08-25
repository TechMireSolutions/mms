import type React from "react";
import { Send } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import { DistributionsListCards } from "@/tenant/features/hasanat/components/DistributionsListCards";
import { DistributionsListDesktopTable } from "@/tenant/features/hasanat/components/DistributionsListDesktopTable";
import type { DistributionsListContentProps } from "@/tenant/features/hasanat/components/distributionsListShared";

export function DistributionsListContent(props: DistributionsListContentProps): React.JSX.Element {
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
    <DistributionsListCards {...props} />
  ) : (
    <div className={WORK_SURFACE}>
      <DistributionsListDesktopTable {...props} />
    </div>
  );
}
