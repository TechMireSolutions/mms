import type React from "react";
import { Card } from "@/components/ui/card";
import { DistributionManagerListCards } from "@/tenant/features/hasanat/components/DistributionManagerListCards";
import { DistributionManagerListTable } from "@/tenant/features/hasanat/components/DistributionManagerListTable";
import type { DistributionManagerListProps } from "@/tenant/features/hasanat/components/distributionManagerListShared";

export function DistributionManagerList(props: DistributionManagerListProps): React.JSX.Element {
  return (
    <Card accentColor="primary" className="shadow-sm hover:shadow-md border-border/80 p-0 overflow-hidden bg-card/45 backdrop-blur-sm">
      {props.viewMode === "cards" ? (
        <DistributionManagerListCards {...props} />
      ) : (
        <DistributionManagerListTable {...props} />
      )}
    </Card>
  );
}
