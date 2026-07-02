import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Star, Package, Gift, RotateCcw, TrendingUp, Layers } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import type { Denomination, StockBatch, Distribution } from '@/lib/data/hasanatData';
import { useBrandPalette } from "@/lib/contexts/BrandingPaletteContext";

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
      { name: "Active", value: totalActive, color: palette.charts[3] },
      { name: "Redeemed", value: totalRedeemed, color: palette.charts[4] },
      { name: "Returned", value: totalReturned, color: palette.charts[1] },
      { name: "Available", value: totalRemaining, color: palette.primary },
    ],
    [palette, totalActive, totalRedeemed, totalReturned, totalRemaining],
  );

  const stats = [
    { label: "Total Stock", value: totalStock, icon: Layers, color: "text-primary", bg: "bg-primary/10", border: "border-primary/10", accent: "primary" as const },
    { label: "Available", value: totalRemaining, icon: Package, color: "text-success", bg: "bg-success/10", border: "border-success/20", accent: "success" as const },
    { label: "Distributed", value: totalDistributed, icon: Star, color: "text-warning", bg: "bg-warning/10", border: "border-warning/20", accent: "warning" as const },
    { label: "Redeemed", value: totalRedeemed, icon: Gift, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20", accent: "indigo" as const },
    { label: "Active (In-Hand)", value: totalActive, icon: TrendingUp, color: "text-info", bg: "bg-info/10", border: "border-info/20", accent: "info" as const },
    { label: "Returned", value: totalReturned, icon: RotateCcw, color: "text-muted-foreground", bg: "bg-muted", border: "border-border", accent: "rose" as const },
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
            primary: "bg-primary/45 group-hover:bg-primary",
            success: "bg-success/45 group-hover:bg-success",
            warning: "bg-warning/45 group-hover:bg-warning",
            indigo: "bg-indigo-500/45 group-hover:bg-indigo-500",
            info: "bg-info/45 group-hover:bg-info",
            rose: "bg-rose-500/45 group-hover:bg-rose-500",
          }
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="relative overflow-hidden group rounded-2xl border border-border/85 bg-card/45 backdrop-blur-sm p-4 pl-5.5 space-y-2 transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors duration-300 ${stripeColors[stat.accent]}`} />
              <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`} aria-hidden="true">
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div>
                <p className={`text-[20px] font-bold ${stat.color} leading-tight m-0`}>{stat.value}</p>
                <h3 className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-1 m-0">{stat.label}</h3>
              </div>
            </motion.div>
          );
        })}
      </section>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Distribution donut */}
        <Card accentColor="primary" className="p-5 shadow-sm hover:shadow-md border-border/80">
          <h3 className="text-sm font-bold text-foreground mb-4 m-0">Card Distribution</h3>
          <div className="flex items-center gap-6">
            <PieChart width={130} height={130}>
              <Pie data={pieData} cx={60} cy={60} innerRadius={38} outerRadius={58} dataKey="value" paddingAngle={3}>
                {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(value) => [`${value} cards`, ""]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
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
          <h3 className="text-sm font-bold text-foreground mb-4 m-0">Stock by Denomination</h3>
          <div className="space-y-3">
            {denominationStock.map((denomination: DenStockEntry) => {
              const pct = denomination.total > 0 ? Math.round((denomination.used / denomination.total) * 100) : 0;
              return (
                <div key={denomination.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px]" aria-hidden="true">{denomination.icon}</span>
                      <span className="text-[12px] font-semibold text-foreground">{denomination.name}</span>
                      <span className="text-[10px] font-bold text-muted-foreground">{denomination.points} pts</span>
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
      </div>

      {/* Usage meter */}
      <Card accentColor="success" className="p-5 shadow-sm hover:shadow-md border-border/80">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground m-0">Overall Stock Usage</h3>
          <span className="text-[13px] font-bold text-foreground">{usedPct}% used</span>
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
          <span className="text-[10px] text-muted-foreground">{totalStock - totalRemaining} used</span>
          <span className="text-[10px] text-muted-foreground">{totalRemaining} remaining</span>
        </div>
      </Card>
    </div>
  );
}
