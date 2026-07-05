import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Star, Package, Gift, RotateCcw, TrendingUp, Layers } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
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
    { label: t("hasanat.stats.redeemed"), value: totalRedeemed, icon: Gift, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20", accent: "indigo" as const },
    { label: t("hasanat.stats.active"), value: totalActive, icon: TrendingUp, color: "text-info", bg: "bg-info/10", border: "border-info/20", accent: "info" as const },
    { label: t("hasanat.stats.returned"), value: totalReturned, icon: RotateCcw, color: "text-muted-foreground", bg: "bg-muted", border: "border-border", accent: "rose" as const },
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
      <section aria-label="Hasanat Dashboard Statistics" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const stripeColors = {
            primary: "bg-primary/60 group-hover:bg-primary",
            success: "bg-success/60 group-hover:bg-success",
            warning: "bg-warning/60 group-hover:bg-warning",
            indigo: "bg-indigo-500/60 group-hover:bg-indigo-500",
            info: "bg-info/60 group-hover:bg-info",
            rose: "bg-rose-500/60 group-hover:bg-rose-500",
          };
          const ringClasses = {
            primary: "ring-primary/20",
            success: "ring-success/20",
            warning: "ring-warning/20",
            indigo: "ring-indigo-500/20",
            info: "ring-info/20",
            rose: "ring-rose-500/20",
          };
          return (
            <motion.article
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.35, ease: "easeOut" }}
              className="relative overflow-hidden group rounded-2xl border border-border/80 bg-card/45 backdrop-blur-sm p-4.5 md:p-5 px-5.5 hover:shadow-md transition-all duration-300 text-left flex flex-col justify-between"
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors duration-300 ${stripeColors[stat.accent]}`} />
              <header className="flex items-start justify-between mb-3 select-none">
                <div className={`w-9 h-9 rounded-lg ${stat.bg} ring-4 ${ringClasses[stat.accent]} flex items-center justify-center aspect-square flex-shrink-0`} aria-hidden="true">
                  <Icon className={`w-4.5 h-4.5 ${stat.color}`} style={{ width: 18, height: 18 }} />
                </div>
              </header>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide m-0">{stat.label}</p>
                <p className="text-xl font-bold text-foreground mt-1 m-0">{stat.value}</p>
              </div>
            </motion.article>
          );
        })}
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
          <div className="flex items-center gap-6">
            <PieChart width={130} height={130}>
              <Pie data={pieData} cx={60} cy={60} innerRadius={38} outerRadius={58} dataKey="value" paddingAngle={3}>
                {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(value) => [t("hasanat.dashboard.cardsCount", { count: Number(value) }), ""]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
            </PieChart>
            <div className="space-y-2.5">
              {pieData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: entry.color }} aria-hidden="true" />
                  <span className="text-[12px] text-muted-foreground flex-1">{entry.name}</span>
                  <span className="text-[12px] font-bold text-foreground">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Per-denomination stock */}
        <Card accentColor="indigo" className="p-5 shadow-sm hover:shadow-md border-border/80">
          <h3 className="text-sm font-bold text-foreground mb-4 m-0">{t("hasanat.dashboard.stockByDenomination")}</h3>
          <div className="space-y-3">
            {denominationStock.map((denomination: DenStockEntry) => {
              const pct = denomination.total > 0 ? Math.round((denomination.used / denomination.total) * 100) : 0;
              return (
                <div key={denomination.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px]" aria-hidden="true">{denomination.icon}</span>
                      <span className="text-[12px] font-semibold text-foreground">{denomination.name}</span>
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {t("hasanat.dashboard.pts", { count: denomination.points })}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">{denomination.remaining}/{denomination.total}</span>
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
            <span className="text-[13px] font-bold text-foreground">
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
            <span className="text-[10px] text-muted-foreground">
              {t("hasanat.dashboard.stockUsed", { count: totalStock - totalRemaining })}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {t("hasanat.dashboard.stockRemaining", { count: totalRemaining })}
            </span>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
