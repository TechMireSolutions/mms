import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { formatNumber } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { resolveAccent, type AccentColor } from "@/components/ui/statCardAccent";

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

function StatCardTrend({ trend }: { trend: number }) {
  const { t } = useTranslation();
  return (
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
  );
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
          {trend !== undefined && <StatCardTrend trend={trend} />}
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
            <SectionLabel className="block leading-none mb-1.5">
              {label}
            </SectionLabel>
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
          <span className="self-start">
            <StatCardTrend trend={trend} />
          </span>
        )}
      </Card>
    </Comp>
  );
}
