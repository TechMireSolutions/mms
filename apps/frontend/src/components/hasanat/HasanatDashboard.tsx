import React from "react";
import { motion } from "framer-motion";
import { Star, Package, Gift, RotateCcw, TrendingUp, Layers } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { DENOMINATIONS, STOCK_BATCHES, DISTRIBUTIONS, Denomination, StockBatch, Distribution } from '@/lib/data/hasanatData';

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
export default function HasanatDashboard() {
  const totalStock = STOCK_BATCHES.reduce((s: number, b: StockBatch) => s + b.quantity, 0);
  const totalRemaining = STOCK_BATCHES.reduce((s: number, b: StockBatch) => s + b.remaining, 0);
  const totalDistributed = DISTRIBUTIONS.reduce((s: number, d: Distribution) => s + d.quantity, 0);
  const totalRedeemed = DISTRIBUTIONS.filter((d: Distribution) => d.status === "redeemed").reduce((s: number, d: Distribution) => s + d.quantity, 0);
  const totalReturned = DISTRIBUTIONS.filter((d: Distribution) => d.status === "returned").reduce((s: number, d: Distribution) => s + d.quantity, 0);
  const totalActive = DISTRIBUTIONS.filter((d: Distribution) => d.status === "active").reduce((s: number, d: Distribution) => s + d.quantity, 0);
  const usedPct = totalStock > 0 ? Math.round(((totalStock - totalRemaining) / totalStock) * 100) : 0;

  const stats = [
    { label: "Total Stock", value: totalStock, icon: Layers, color: "text-primary", bg: "bg-primary/10", border: "border-primary/10" },
    { label: "Available", value: totalRemaining, icon: Package, color: "text-success", bg: "bg-success/10", border: "border-success/20" },
    { label: "Distributed", value: totalDistributed, icon: Star, color: "text-warning", bg: "bg-warning/10", border: "border-warning/20" },
    { label: "Redeemed", value: totalRedeemed, icon: Gift, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
    { label: "Active (In-Hand)", value: totalActive, icon: TrendingUp, color: "text-info", bg: "bg-info/10", border: "border-info/20" },
    { label: "Returned", value: totalReturned, icon: RotateCcw, color: "text-muted-foreground", bg: "bg-muted", border: "border-border" },
  ];

  // Per-denomination stock
  interface DenStockEntry extends Denomination {
    total: number;
    remaining: number;
    used: number;
  }
  const denStock = DENOMINATIONS.map((den: Denomination): DenStockEntry => {
    const batches = STOCK_BATCHES.filter((b: StockBatch) => b.denominationId === den.id);
    const total = batches.reduce((s: number, b: StockBatch) => s + b.quantity, 0);
    const remaining = batches.reduce((s: number, b: StockBatch) => s + b.remaining, 0);
    return { ...den, total, remaining, used: total - remaining };
  }).filter((d: DenStockEntry) => d.total > 0);

  const pieData = [
    { name: "Active", value: totalActive, color: "#3b82f6" },
    { name: "Redeemed", value: totalRedeemed, color: "#7c3aed" },
    { name: "Returned", value: totalReturned, color: "#9ca3af" },
    { name: "Available", value: totalRemaining, color: "#10b981" },
  ];

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <section aria-label="Hasanat Dashboard Statistics" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`rounded-xl border ${s.border} bg-card p-3.5`}
            >
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-2`} aria-hidden="true">
                <Icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className={`text-[20px] font-bold ${s.color} m-0`}>{s.value}</p>
              <h3 className="text-[10px] text-muted-foreground font-medium mt-0.5 m-0">{s.label}</h3>
            </motion.div>
          );
        })}
      </section>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Distribution donut */}
        <section aria-label="Card Distribution Chart" className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-bold text-foreground mb-4 m-0">Card Distribution</h3>
          <div className="flex items-center gap-6">
            <PieChart width={130} height={130}>
              <Pie data={pieData} cx={60} cy={60} innerRadius={38} outerRadius={58} dataKey="value" paddingAngle={3}>
                {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v) => [`${v} cards`, ""]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
            </PieChart>
            <div className="space-y-2.5">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} aria-hidden="true" />
                  <span className="text-[12px] text-muted-foreground flex-1">{d.name}</span>
                  <span className="text-[12px] font-bold text-foreground">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Per-denomination stock */}
        <section aria-label="Stock by Denomination" className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-bold text-foreground mb-4 m-0">Stock by Denomination</h3>
          <div className="space-y-3">
            {denStock.map((den: DenStockEntry) => {
              const pct = den.total > 0 ? Math.round((den.used / den.total) * 100) : 0;
              return (
                <div key={den.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px]" aria-hidden="true">{den.icon}</span>
                      <span className="text-[12px] font-semibold text-foreground">{den.name}</span>
                      <span className="text-[10px] font-bold text-muted-foreground">{den.points} pts</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">{den.remaining}/{den.total}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-border overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${den.name} stock usage`}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: den.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Usage meter */}
      <section aria-label="Overall Stock Usage" className="rounded-xl border border-border bg-card p-5">
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
      </section>
    </div>
  );
}
