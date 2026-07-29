import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/StatCard";
import { motion } from "framer-motion";
import { Star, Package, Gift, RotateCcw, TrendingUp, Layers } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { SafeResponsiveContainer } from "@/components/ui/SafeResponsiveContainer";
import type { Denomination, StockBatch, Distribution } from '@/lib/data/hasanatData';
import { useBrandPalette } from "@/lib/contexts/BrandingPaletteContext";
import { useTranslation } from "@/hooks/useTranslation";

interface HasanatDashboardProps {
  denoms?: Denomination[];
  batches?: StockBatch[];
  distributions?: Distribution[];
}

/**
 * HasanatDashboard Component
 *
 * Renders the main dashboard for the Hasanat points and cards reward system.
 * Displays overall statistics including total stock, available cards, points distributed,
 * points redeemed, and active/returned statuses. Includes visual donut charts and progress bars
 * showing stock depletion by denomination and overall stock utilization.
 *
 * @returns React element representing the Hasanat points dashboard.
 */
export function HasanatDashboard({
  denoms = [],
  batches = [],
  distributions = [],
}: HasanatDashboardProps) {
  const { t } = useTranslation();
  const palette = useBrandPalette();

  const totalStock = batches.reduce((sum: number, batch: StockBatch) => sum + batch.quantity, 0);
  const totalRemaining = batches.reduce((sum: number, batch: StockBatch) => sum + batch.remaining, 0);
  const totalDistributed = distributions.reduce((sum: number, distribution: Distribution) => sum + distribution.quantity, 0);
  const totalRedeemed = distributions.filter((distribution: Distribution) => distribution.status === "redeemed").reduce((sum: number, distribution: Distribution) => sum + distribution.quantity, 0);
  const totalReturned = distributions.filter((distribution: Distribution) => distribution.status === "returned").reduce((sum: number, distribution: Distribution) => sum + distribution.quantity, 0);
  const totalActive = distributions.filter((distribution: Distribution) => distribution.status === "active").reduce((sum: number, distribution: Distribution) => sum + distribution.quantity, 0);
  const usedPct = totalStock > 0 ? Math.round(((totalStock - totalRemaining) / totalStock) * 100) : 0;

  const pieData = useMemo(
    () => [
      { name: t("hasanat.status.active"), value: totalActive, color: palette.charts[3] },
      { name: t("hasanat.status.redeemed"), value: totalRedeemed, color: palette.charts[4] },
      { name: t("hasanat.status.returned"), value: totalReturned, color: palette.charts[1] },
      { name: t("hasanat.stats.available"), value: totalRemaining, color: palette.primary },
    ],
    [t, palette, totalActive, totalRedeemed, totalReturned, totalRemaining],
  );

  const stats = [
    { label: t("hasanat.stats.totalStock"), value: totalStock, icon: Layers, color: "text-primary", bg: "bg-primary/10", border: "border-primary/10", accent: "primary" as const },
    { label: t("hasanat.stats.available"), value: totalRemaining, icon: Package, color: "text-success", bg: "bg-success/10", border: "border-success/20", accent: "success" as const },
    { label: t("hasanat.stats.distributed"), value: totalDistributed, icon: Star, color: "text-warning", bg: "bg-warning/10", border: "border-warning/20", accent: "warning" as const },
    { label: t("hasanat.stats.redeemed"), value: totalRedeemed, icon: Gift, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20", accent: "info" as const },
    { label: t("hasanat.stats.active"), value: totalActive, icon: TrendingUp, color: "text-info", bg: "bg-info/10", border: "border-info/20", accent: "info" as const },
    { label: t("hasanat.stats.returned"), value: totalReturned, icon: RotateCcw, color: "text-muted-foreground", bg: "bg-muted", border: "border-border", accent: "destructive" as const },
  ];

  // Per-denomination stock
  interface DenStockEntry extends Denomination {
    total: number;
    remaining: number;
    used: number;
  }
  const denominationStock = denoms.map((denomination: Denomination): DenStockEntry => {
    const denominationBatches = batches.filter((batch: StockBatch) => batch.denominationId === denomination.id);
    const total = denominationBatches.reduce((sum: number, batch: StockBatch) => sum + batch.quantity, 0);
    const remaining = denominationBatches.reduce((sum: number, batch: StockBatch) => sum + batch.remaining, 0);
    return { ...denomination, total, remaining, used: total - remaining };
  }).filter((denomination: DenStockEntry) => denomination.total > 0);

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <section aria-label={t("hasanat.dashboard.statsAria")} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((stat, index) => (
          <StatCard
            key={stat.label}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            accent={stat.accent}
            delayIndex={index}
            variant="compact"
          />
        ))}
      </section>

      {/* Charts row */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
      >
        {/* Distribution donut */}
        <Card accentColor="primary" className="p-5 shadow-sm hover:shadow-md border-border/80">
          <h3 className="text-sm font-bold text-foreground mb-4 m-0">{t("hasanat.dashboard.cardDistribution")}</h3>
          <div className="flex flex-col items-stretch gap-6 sm:flex-row sm:items-center">
            <div className="mx-auto h-[8.125rem] w-full max-w-[10rem] shrink-0 sm:mx-0">
              <SafeResponsiveContainer height={130}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={58} dataKey="value" paddingAngle={3}>
                    {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value) => [t("hasanat.dashboard.cardsCount", { count: Number(value) }), ""]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                </PieChart>
              </SafeResponsiveContainer>
            </div>
            <div className="min-w-0 flex-1 space-y-2.5">
              {pieData.map((entry) => (
                <div key={entry.name} className="flex min-w-0 items-center gap-2.5">
                  <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: entry.color }} aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{entry.name}</span>
                  <span className="shrink-0 text-sm font-bold text-foreground">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Per-denomination stock */}
        <Card accentColor="info" className="p-5 shadow-sm hover:shadow-md border-border/80">
          <h3 className="text-sm font-bold text-foreground mb-4 m-0">{t("hasanat.dashboard.stockByDenomination")}</h3>
          <div className="space-y-3">
            {denominationStock.map((denomination: DenStockEntry) => {
              const pct = denomination.total > 0 ? Math.round((denomination.used / denomination.total) * 100) : 0;
              return (
                <div key={denomination.id}>
                  <div className="mb-1 flex min-w-0 items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="shrink-0 text-sm" aria-hidden="true">{denomination.icon}</span>
                      <span className="truncate text-sm font-semibold text-foreground">{denomination.name}</span>
                      <span className="shrink-0 text-xs font-bold text-muted-foreground">
                        {t("hasanat.dashboard.pts", { count: denomination.points })}
                      </span>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{denomination.remaining}/{denomination.total}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-border overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${denomination.name} stock usage`}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: denomination.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </motion.div>

      {/* Usage meter */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <Card accentColor="success" className="p-5 shadow-sm hover:shadow-md border-border/80">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-foreground m-0">{t("hasanat.dashboard.overallStockUsage")}</h3>
            <span className="text-sm font-bold text-foreground">
              {t("hasanat.dashboard.stockUsagePct", { count: usedPct })}
            </span>
          </div>
          <div className="h-3 rounded-full bg-border overflow-hidden" role="progressbar" aria-valuenow={usedPct} aria-valuemin={0} aria-valuemax={100}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${usedPct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-primary to-success"
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-muted-foreground">
              {t("hasanat.dashboard.stockUsed", { count: totalStock - totalRemaining })}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("hasanat.dashboard.stockRemaining", { count: totalRemaining })}
            </span>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
