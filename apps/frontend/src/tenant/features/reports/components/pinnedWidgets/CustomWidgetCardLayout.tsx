import React from "react";
import { Users } from "lucide-react";
import { motion } from "framer-motion";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import { COLOR_MAP, ICONS_LIST } from "@/tenant/features/reports/components/pinnedWidgets/types";
import type { computeCustomCard } from "@/tenant/features/reports/components/reportMetadata";

type ComputedCustomCard = ReturnType<typeof computeCustomCard>;

interface CustomWidgetCardLayoutProps {
  computedCard: ComputedCustomCard;
}

export function CustomWidgetCardLayout({ computedCard }: CustomWidgetCardLayoutProps): React.JSX.Element {
  const Icon = ICONS_LIST[computedCard.icon || ""] || Users;
  const colorClasses = COLOR_MAP[computedCard.color || ""] || COLOR_MAP.emerald;
  const isPositive = computedCard.trend >= 0;

  return (
    <motion.div
      layout
      whileHover={{ y: -4, scale: 1.015 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className={`${WORK_SURFACE} p-5 hover:shadow-surface-lg transition-all relative text-start flex flex-col justify-between min-h-[8.75rem] font-sans overflow-hidden group`}
    >
      <div className={`absolute start-0 top-0 bottom-0 w-[3.5px] rounded-e-[2px] ${colorClasses.bar}/60 group-hover:${colorClasses.bar} transition-colors duration-300`} />
      <div className={`absolute -end-8 -top-8 w-20 h-20 rounded-full ${colorClasses.glow} transition-all duration-500`} />
      <div className="flex items-start justify-between">
        <div className={`w-9 h-9 rounded-lg ${colorClasses.bg} ring-4 ${colorClasses.ring} flex items-center justify-center aspect-square flex-shrink-0`}>
          <Icon className={`w-4.5 h-4.5 ${colorClasses.text}`} style={{ width: 18, height: 18 }} />
        </div>
        {computedCard.trend !== 0 && (
          <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
            isPositive ? "bg-success/10 text-success border border-success/20" : "bg-destructive/10 text-destructive border border-destructive/20"
          }`}>
            {isPositive ? "+" : ""}{computedCard.trend}%
          </span>
        )}
      </div>
      <div className="space-y-0.5 flex-1 min-w-0 mt-3">
        <p className="text-xl font-black text-foreground tracking-tight leading-none truncate">
          {computedCard.value}
        </p>
        <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground mt-1 truncate">
          {computedCard.title}
        </h4>
      </div>
      <footer className="text-xs text-muted-foreground mt-3 border-t border-border/30 pt-2 truncate">
        {computedCard.sub}
      </footer>
    </motion.div>
  );
}
