import React from "react";
import { motion } from "framer-motion";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  change?: number;
  changeLabel?: string;
  index?: number;
}

/**
 * StatsCard Component
 *
 * An individual card displaying a single statistic with an optional trend indicator.
 *
 * @param {StatsCardProps} props - The component properties.
 * @returns {React.ReactElement} The rendered statistics card.
 */
export default function StatsCard({ title, value, icon: Icon, change, changeLabel, index = 0 }: StatsCardProps) {
  const isPositive = change !== undefined && change > 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: "easeOut" }}
      className="bg-card rounded-xl border border-border p-5 hover:shadow-lg hover:shadow-primary/[0.03] transition-all duration-300"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-medium text-muted-foreground m-0">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1.5 tracking-tight m-0">{value}</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-primary/8 flex items-center justify-center" aria-hidden="true">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
      {change !== undefined && (
        <div className="flex items-center gap-1.5 mt-3">
          <span className={`text-xs font-semibold ${isPositive ? "text-success" : "text-destructive"}`} aria-label={`Trend ${isPositive ? 'up' : 'down'} ${Math.abs(change)} percent`}>
            {isPositive ? "+" : ""}{change}%
          </span>
          {changeLabel && <span className="text-xs text-muted-foreground">{changeLabel}</span>}
        </div>
      )}
    </motion.article>
  );
}
