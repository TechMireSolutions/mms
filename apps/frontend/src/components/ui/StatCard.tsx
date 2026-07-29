import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { formatNumber } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";

type AccentColor =
  | "primary"
  | "success"
  | "warning"
  | "destructive"
  | "info"
  | "secondary"
  | "muted"
  | "indigo"
  | "rose"
  | "teal"
  | "purple"
  | "green"
  | "emerald"
  | "amber"
  | "red"
  | "blue"
  | "violet"
  | string;

export interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string | null;
  icon?: LucideIcon | React.ComponentType<{ className?: string; style?: React.CSSProperties }> | null;
  accent?: AccentColor;
  /** @deprecated Use `accent` instead */
  color?: AccentColor;
  trend?: number;
  delayIndex?: number;
  onClick?: () => void;
  className?: string;
  variant?: "default" | "compact";
  isActive?: boolean;
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
  secondary: {
    stripe: "bg-secondary/60 group-hover:bg-secondary",
    iconBg: "bg-secondary/10",
    iconText: "text-secondary",
    ring: "ring-secondary/20",
  },
  muted: {
    stripe: "bg-muted-foreground/30 group-hover:bg-muted-foreground",
    iconBg: "bg-muted",
    iconText: "text-muted-foreground",
    ring: "ring-muted/20",
  },
};

// Compatibility aliases → semantic tokens only
ACCENT_MAP.green = ACCENT_MAP.success;
ACCENT_MAP.emerald = ACCENT_MAP.success;
ACCENT_MAP.amber = ACCENT_MAP.warning;
ACCENT_MAP.red = ACCENT_MAP.destructive;
ACCENT_MAP.rose = ACCENT_MAP.destructive;
ACCENT_MAP.blue = ACCENT_MAP.info;
ACCENT_MAP.indigo = ACCENT_MAP.info;
ACCENT_MAP.teal = ACCENT_MAP.info;
ACCENT_MAP.violet = ACCENT_MAP.primary;
ACCENT_MAP.purple = ACCENT_MAP.secondary;

function resolveAccent(accent?: string) {
  if (!accent) return ACCENT_MAP.primary;
  
  // Handle tailwind background classes passed as color (from legacy FinancialReports.tsx)
  if (accent.includes("success") || accent.includes("emerald") || accent.includes("green")) return ACCENT_MAP.success;
  if (accent.includes("destructive") || accent.includes("rose") || accent.includes("red")) return ACCENT_MAP.destructive;
  if (accent.includes("warning") || accent.includes("amber")) return ACCENT_MAP.warning;
  if (accent.includes("info") || accent.includes("blue") || accent.includes("indigo") || accent.includes("teal")) return ACCENT_MAP.info;
  if (accent.includes("secondary") || accent.includes("purple")) return ACCENT_MAP.secondary;
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
  variant = "default",
  isActive = false,
}: StatCardProps): React.JSX.Element {
  const { t } = useTranslation();
  const theme = resolveAccent(accent || color);
  const Comp = onClick ? motion.button : motion.div;
  const buttonProps = onClick ? { type: "button" as const, "aria-pressed": isActive } : {};
  const isCompact = variant === "compact";

  const resolvedAccentColor = (accent || color) as React.ComponentProps<typeof Card>["accentColor"];
  const formattedValue = typeof value === "number" ? formatNumber(value) : value;

  if (isCompact) {
    return (
      <Comp
        {...buttonProps}
        onClick={onClick}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delayIndex * 0.04, duration: 0.3, ease: "easeOut" }}
        className={cn("w-full text-start", onClick && "cursor-pointer")}
      >
        <Card
          accentColor={resolvedAccentColor}
          className={cn(
            "flex items-center justify-between gap-3 px-4 py-3 ps-5.5 min-h-11 w-full",
            onClick && "hover:border-primary/40 hover:bg-card/75",
            isActive && "ring-2 ring-primary/60 border-primary/60 bg-primary/5",
            className
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ms-0.5 shadow-sm ring-4", theme.iconBg, theme.ring)} aria-hidden="true">
                <Icon className={cn("w-4 h-4", theme.iconText)} />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide truncate">
                {label}
              </p>
              <p className="text-lg font-bold text-foreground leading-tight tabular-nums">
                {formattedValue}
              </p>
              {sub && (
                <p className="text-xs font-semibold text-muted-foreground mt-1 opacity-70 truncate">
                  {sub}
                </p>
              )}
            </div>
          </div>
          {trend !== undefined && (
            <span
              className={cn(
                "flex items-center gap-0.5 text-xs font-bold ms-2 shrink-0 select-none",
                trend >= 0 ? "text-success" : "text-destructive"
              )}
              aria-label={trend >= 0 ? t("ui.statCard.positiveTrend") : t("ui.statCard.negativeTrend")}
            >
              {trend >= 0 ? (
                <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
              ) : (
                <ArrowDownRight className="w-3 h-3" aria-hidden="true" />
              )}
              {Math.abs(trend)}%
            </span>
          )}
        </Card>
      </Comp>
    );
  }

  return (
    <Comp
      {...buttonProps}
      onClick={onClick}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delayIndex * 0.04, duration: 0.3, ease: "easeOut" }}
      className={cn("w-full text-start", onClick && "cursor-pointer")}
    >
      <Card
        accentColor={resolvedAccentColor}
        className={cn(
          "flex items-center justify-between p-4 ps-5.5 min-h-[5.125rem] w-full",
          onClick && "hover:border-primary/40 hover:bg-card/75",
          isActive && "ring-2 ring-primary/60 border-primary/60 bg-primary/5",
          className
        )}
      >
        <div className="flex items-center gap-3.5 min-w-0">
          {Icon && (
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ms-0.5 shadow-sm ring-4", theme.iconBg, theme.ring)} aria-hidden="true">
              <Icon className={cn("w-5 h-5", theme.iconText)} />
            </div>
          )}
          <div className="min-w-0">
            <span className="block text-xs font-black text-muted-foreground uppercase tracking-widest leading-none mb-1.5">
              {label}
            </span>
            <p className="text-lg font-black text-foreground leading-none tracking-tight tabular-nums">
              {formattedValue}
            </p>
            {sub && (
              <p className="text-xs font-semibold text-muted-foreground mt-1 opacity-70 truncate">
                {sub}
              </p>
            )}
          </div>
        </div>

        {trend !== undefined && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-bold self-start ms-2 shrink-0 select-none",
              trend >= 0 ? "text-success" : "text-destructive"
            )}
            aria-label={trend >= 0 ? t("ui.statCard.positiveTrend") : t("ui.statCard.negativeTrend")}
          >
            {trend >= 0 ? (
              <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
            ) : (
              <ArrowDownRight className="w-3 h-3" aria-hidden="true" />
            )}
            {Math.abs(trend)}%
          </span>
        )}
      </Card>
    </Comp>
  );
}

