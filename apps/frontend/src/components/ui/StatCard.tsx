import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string | null;
  icon?: LucideIcon | React.ComponentType<{ className?: string; style?: React.CSSProperties }> | null;
  accent?:
    | "primary"
    | "success"
    | "warning"
    | "destructive"
    | "info"
    | "indigo"
    | "rose"
    | "teal"
    | "purple"
    | "muted"
    | "green"
    | "emerald"
    | "amber"
    | "red"
    | "blue"
    | "violet"
    | string;
  color?:
    | "primary"
    | "success"
    | "warning"
    | "destructive"
    | "info"
    | "indigo"
    | "rose"
    | "teal"
    | "purple"
    | "muted"
    | "green"
    | "emerald"
    | "amber"
    | "red"
    | "blue"
    | "violet"
    | string;
  trend?: number;
  delayIndex?: number;
  onClick?: () => void;
  className?: string;
}

const ACCENT_MAP: Record<
  string,
  { stripe: string; iconBg: string; iconText: string; ring: string }
> = {
  primary: {
    stripe: "bg-primary/60 group-hover:bg-primary",
    iconBg: "bg-primary/10",
    iconText: "text-primary",
    ring: "ring-primary/20",
  },
  success: {
    stripe: "bg-success/60 group-hover:bg-success",
    iconBg: "bg-success/10",
    iconText: "text-success",
    ring: "ring-success/20",
  },
  warning: {
    stripe: "bg-warning/60 group-hover:bg-warning",
    iconBg: "bg-warning/10",
    iconText: "text-warning",
    ring: "ring-warning/20",
  },
  destructive: {
    stripe: "bg-destructive/60 group-hover:bg-destructive",
    iconBg: "bg-destructive/10",
    iconText: "text-destructive",
    ring: "ring-destructive/20",
  },
  info: {
    stripe: "bg-info/60 group-hover:bg-info",
    iconBg: "bg-info/10",
    iconText: "text-info",
    ring: "ring-info/20",
  },
  indigo: {
    stripe: "bg-indigo-500/60 group-hover:bg-indigo-500",
    iconBg: "bg-indigo-500/10",
    iconText: "text-indigo-500",
    ring: "ring-indigo-500/20",
  },
  rose: {
    stripe: "bg-rose-500/60 group-hover:bg-rose-500",
    iconBg: "bg-rose-500/10",
    iconText: "text-rose-500",
    ring: "ring-rose-500/20",
  },
  teal: {
    stripe: "bg-teal-500/60 group-hover:bg-teal-500",
    iconBg: "bg-teal-500/10",
    iconText: "text-teal-500",
    ring: "ring-teal-500/20",
  },
  purple: {
    stripe: "bg-purple-500/60 group-hover:bg-purple-500",
    iconBg: "bg-purple-500/10",
    iconText: "text-purple-500",
    ring: "ring-purple-500/20",
  },
  muted: {
    stripe: "bg-muted-foreground/30 group-hover:bg-muted-foreground",
    iconBg: "bg-muted",
    iconText: "text-muted-foreground",
    ring: "ring-muted/20",
  },
};

// Aliases for compatibility
ACCENT_MAP.green = ACCENT_MAP.success;
ACCENT_MAP.emerald = ACCENT_MAP.success;
ACCENT_MAP.amber = ACCENT_MAP.warning;
ACCENT_MAP.red = ACCENT_MAP.destructive;
ACCENT_MAP.blue = ACCENT_MAP.info;
ACCENT_MAP.violet = ACCENT_MAP.primary;

function resolveAccent(accent?: string) {
  if (!accent) return ACCENT_MAP.primary;
  
  // Handle tailwind background classes passed as color (from legacy FinancialReports.tsx)
  if (accent.includes("success")) return ACCENT_MAP.success;
  if (accent.includes("destructive")) return ACCENT_MAP.destructive;
  if (accent.includes("warning")) return ACCENT_MAP.warning;
  if (accent.includes("info") || accent.includes("blue")) return ACCENT_MAP.info;
  if (accent.includes("primary") || accent.includes("violet")) return ACCENT_MAP.primary;
  
  return ACCENT_MAP[accent] || ACCENT_MAP.primary;
}

export function StatCard({
  label,
  value,
  sub = null,
  icon: Icon = null,
  accent,
  color,
  trend,
  delayIndex = 0,
  onClick,
  className,
}: StatCardProps): React.JSX.Element {
  const theme = resolveAccent(accent || color);
  const Comp = onClick ? motion.button : motion.div;
  const buttonProps = onClick ? { type: "button" as const } : {};

  return (
    <Comp
      {...buttonProps}
      onClick={onClick}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delayIndex * 0.04, duration: 0.3, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden group flex items-center justify-between rounded-2xl border border-border/80 bg-card/45 backdrop-blur-sm p-4 pl-5.5 shadow-sm hover:shadow-md transition-all duration-300 text-left min-h-[82px] w-full",
        onClick && "cursor-pointer hover:border-primary/40 hover:bg-card/75",
        className
      )}
    >
      <div className={cn("absolute inset-inline-start-0 top-0 bottom-0 w-1 transition-colors duration-300", theme.stripe)} />
      
      <div className="flex items-center gap-3.5 min-w-0">
        {Icon && (
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ml-0.5 shadow-sm ring-4", theme.iconBg, theme.ring)}>
            <Icon className={cn("w-5 h-5", theme.iconText)} />
          </div>
        )}
        <div className="min-w-0">
          <span className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1.5">
            {label}
          </span>
          <p className="text-lg font-black text-foreground leading-none tracking-tight">
            {value}
          </p>
          {sub && (
            <p className="text-[10px] font-semibold text-muted-foreground mt-1 opacity-70 truncate">
              {sub}
            </p>
          )}
        </div>
      </div>

      {trend !== undefined && (
        <span
          className={cn(
            "flex items-center gap-0.5 text-[11px] font-bold self-start ml-2 shrink-0 select-none",
            trend >= 0 ? "text-success" : "text-destructive"
          )}
          aria-label={trend >= 0 ? "Positive trend" : "Negative trend"}
        >
          {trend >= 0 ? (
            <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
          ) : (
            <ArrowDownRight className="w-3 h-3" aria-hidden="true" />
          )}
          {Math.abs(trend)}%
        </span>
      )}
    </Comp>
  );
}
