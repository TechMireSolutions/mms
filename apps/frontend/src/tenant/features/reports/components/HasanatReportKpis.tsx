import React from "react";
import { Gift, Star, TrendingDown, Users } from "lucide-react";
import { formatNumber } from "@mms/shared";
import { ModuleCommandMetricsGrid } from "@/components/ui/ModuleCommandMetricsGrid";
import { useTranslation } from "@/hooks/useTranslation";

interface HasanatReportKpisProps {
  totalDistributed: number;
  totalRedeemed: number;
  totalBalance: number;
  redemptionRate: string | number;
}

export function HasanatReportKpis({
  totalDistributed,
  totalRedeemed,
  totalBalance,
  redemptionRate,
}: HasanatReportKpisProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <ModuleCommandMetricsGrid
      items={[
        { icon: Star, label: t("hasanat.report.totalDistributed"), value: formatNumber(totalDistributed), accent: "primary" },
        { icon: Gift, label: t("hasanat.report.totalRedeemed"), value: formatNumber(totalRedeemed), accent: "green" },
        { icon: TrendingDown, label: t("hasanat.report.balance"), value: formatNumber(totalBalance), accent: "amber" },
        { icon: Users, label: t("hasanat.report.redemptionRate"), value: `${redemptionRate}%`, accent: "blue" },
      ]}
    />
  );
}
