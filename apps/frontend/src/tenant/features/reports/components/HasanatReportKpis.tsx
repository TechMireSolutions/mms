import React from "react";
import { Gift, Star, TrendingDown, Users } from "lucide-react";
import { formatNumber } from "@mms/shared";
import { StatCard } from "@/components/ui/StatCard";
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
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatCard icon={Star} label={t("hasanat.report.totalDistributed")} value={formatNumber(totalDistributed)} color="primary" />
      <StatCard icon={Gift} label={t("hasanat.report.totalRedeemed")} value={formatNumber(totalRedeemed)} color="green" />
      <StatCard icon={TrendingDown} label={t("hasanat.report.balance")} value={formatNumber(totalBalance)} color="amber" />
      <StatCard icon={Users} label={t("hasanat.report.redemptionRate")} value={`${redemptionRate}%`} color="blue" />
    </div>
  );
}
