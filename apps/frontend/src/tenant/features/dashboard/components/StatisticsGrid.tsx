import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap, CalendarCheck, BookOpen, UserCheck,
  DollarSign, AlertCircle, Star, TrendingUp, Receipt,
  Users, Target, ShieldCheck, Trash2, Plus, Pencil,
  Award, Clock, Heart, Briefcase, Activity, CheckCircle2, PieChart,
  Zap, BarChart2
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";

const MotionButton = motion.create(Button);

const ICONS: Record<string, React.ElementType> = {
  GraduationCap, CalendarCheck, BookOpen, UserCheck, DollarSign, AlertCircle, Star, TrendingUp, Receipt,
  Users, Target, ShieldCheck, Award, Clock, Heart, Briefcase, Activity, CheckCircle2, PieChart,
  Zap, BarChart2
};

interface ColorTheme {
  bg: string;
  text: string;
  ring: string;
}

const COLOR_MAP: Record<string, ColorTheme> = {
  emerald: { bg: "bg-success/10", text: "text-success", ring: "ring-success/20" },
  blue: { bg: "bg-info/10", text: "text-info", ring: "ring-info/20" },
  violet: { bg: "bg-primary/10", text: "text-primary", ring: "ring-primary/20" },
  amber: { bg: "bg-warning/10", text: "text-warning", ring: "ring-warning/20" },
  red: { bg: "bg-destructive/10", text: "text-destructive", ring: "ring-destructive/20" },
};

const ACCENT_BAR_MAP: Record<string, string> = {
  emerald: "bg-success/60",
  blue: "bg-info/60",
  violet: "bg-primary/60",
  amber: "bg-warning/60",
  red: "bg-destructive/60",
};

export interface StatItem {
  id: string;
  icon: string;
  color: string;
  trend: number;
  value: string | number;
  title: string;
  sub: string;
  sparklineData?: number[];
}

function Sparkline({ trend, data, color }: { trend: number; data?: number[]; color: string }) {
  const points = useMemo(() => {
    if (data && data.length > 1) return data;
    const base = 100;
    const change = trend;
    const factor = change >= 0 ? 1 : -1;
    return [
      base,
      base + change * 0.2 + factor * 2,
      base + change * 0.5 - factor * 3,
      base + change * 0.8 + factor * 1.5,
      base + change
    ];
  }, [data, trend]);

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min === 0 ? 1 : max - min;

  const width = 60;
  const height = 24;

  const svgPoints = points.map((p, idx) => {
    const x = (idx / (points.length - 1)) * width;
    const y = height - ((p - min) / range) * (height - 4) - 2;
    return { x, y };
  });

  const pathD = svgPoints.map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(' ');

  const strokeColor = {
    emerald: "stroke-success",
    blue: "stroke-info",
    violet: "stroke-primary",
    amber: "stroke-warning",
    red: "stroke-destructive",
  }[color] || "stroke-success";

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} fill="none" className="overflow-visible">
      <motion.path
        d={pathD}
        className={strokeColor}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      />
    </svg>
  );
}

interface StatsGridProps {
  statItems: StatItem[];
  customCardIds?: string[];
  onDeleteCustomCard?: (id: string) => void;
  onEditCustomCard?: (id: string) => void;
  isEditMode?: boolean;
  onAddCardClick?: () => void;
}

export default function StatsGrid({
  statItems,
  customCardIds = [],
  onDeleteCustomCard,
  onEditCustomCard,
  isEditMode = false,
  onAddCardClick
}: StatsGridProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <section aria-label={t("dashboard.statsSectionLabel")} className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 font-sans">
      {statItems.map((statItem, statIndex) => {
        const Icon = ICONS[statItem.icon] || DollarSign;
        const colorTheme = COLOR_MAP[statItem.color] || COLOR_MAP.emerald;
        const hasPositiveTrend = statItem.trend >= 0;
        const isCustomCard = customCardIds.includes(statItem.id);

        return (
          <motion.article
            key={statItem.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: statIndex * 0.05, duration: 0.35, ease: "easeOut" }}
            className="relative overflow-hidden group rounded-2xl border border-border/80 bg-card/45 backdrop-blur-sm p-4.5 md:p-5 px-5.5 hover:shadow-md transition-all duration-300 text-left flex flex-col justify-between"
          >
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${ACCENT_BAR_MAP[statItem.color] || "bg-success/60"} transition-colors`} />
            <header className="flex items-start justify-between mb-3 select-none">
              <div
                className={`w-9 h-9 rounded-lg ${colorTheme.bg} ring-4 ${colorTheme.ring} flex items-center justify-center aspect-square flex-shrink-0`}
                aria-hidden="true"
              >
                <Icon className={`w-4.5 h-4.5 ${colorTheme.text}`} />
              </div>

              <div className="flex items-center gap-1">
                {statItem.trend !== 0 && !isEditMode && (
                  <span
                    className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${hasPositiveTrend ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                      }`}
                    aria-label={t("dashboard.trendAria", {
                      direction: hasPositiveTrend ? t("dashboard.trendUp") : t("dashboard.trendDown"),
                      value: Math.abs(statItem.trend),
                    })}
                  >
                    {hasPositiveTrend ? "+" : ""}{statItem.trend}%
                  </span>
                )}
                {isEditMode && (
                  <div className="flex items-center gap-1">
                    {onEditCustomCard && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditCustomCard(statItem.id);
                        }}
                        className="p-1 w-7 h-7 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all cursor-pointer border border-transparent hover:border-primary/10"
                        title={t("dashboard.editCardConfig")}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {isCustomCard && onDeleteCustomCard && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCustomCard(statItem.id);
                        }}
                        className="p-1 w-7 h-7 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all cursor-pointer border border-transparent hover:border-destructive/10"
                        title={t("dashboard.deleteCard")}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </header>

            <div className="flex items-end justify-between mt-1">
              <main className="space-y-0.5 flex-1 min-w-0">
                <p className="text-[22px] font-black text-foreground tracking-tight leading-none m-0 truncate">
                  {statItem.value}
                </p>
                <h4 className="text-[12px] font-bold text-foreground/80 mt-1 m-0 truncate">
                  {statItem.title}
                </h4>
              </main>
              {!isEditMode && (
                <div className="w-16 h-8 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0 pointer-events-none flex-shrink-0 ml-2">
                  <Sparkline trend={statItem.trend} data={statItem.sparklineData} color={statItem.color} />
                </div>
              )}
            </div>

            <footer className="text-[11px] text-muted-foreground mt-2.5 border-t border-border/30 pt-2 m-0 truncate">
              {statItem.sub}
            </footer>
          </motion.article>
        );
      })}

      {isEditMode && onAddCardClick && (
        <MotionButton
          variant="outline"
          onClick={onAddCardClick}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: statItems.length * 0.05, duration: 0.35, ease: "easeOut" }}
          className="border border-dashed border-border rounded-xl p-4 md:p-5 flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all duration-300 group text-muted-foreground min-h-[115px] h-auto"
        >
          <div className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
            <Plus className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <span className="text-xs font-bold group-hover:text-primary transition-colors">
            {t("dashboard.addMetricCard")}
          </span>
        </MotionButton>
      )}
    </section>
  );
}
