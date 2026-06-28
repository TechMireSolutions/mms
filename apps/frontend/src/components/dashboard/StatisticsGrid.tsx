import React from "react";
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

export interface StatItem {
  id: string;
  icon: string;
  color: string;
  trend: number;
  value: string | number;
  title: string;
  sub: string;
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
            className="bg-card rounded-xl border border-border p-4 md:p-5 hover:shadow-md hover:shadow-black/[0.04] transition-all duration-300 group relative text-left flex flex-col justify-between"
          >
            <header className="flex items-start justify-between mb-3 select-none">
              <div
                className={`w-9 h-9 rounded-lg ${colorTheme.bg} ring-4 ${colorTheme.ring} flex items-center justify-center aspect-square flex-shrink-0`}
                aria-hidden="true"
              >
                <Icon className={`w-4.5 h-4.5 ${colorTheme.text}`} style={{ width: 18, height: 18 }} />
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

            <main className="space-y-0.5 flex-1 min-w-0">
              <p className="text-[22px] font-black text-foreground tracking-tight leading-none m-0 truncate">
                {statItem.value}
              </p>
              <h4 className="text-[12px] font-bold text-foreground/80 mt-1 m-0 truncate">
                {statItem.title}
              </h4>
            </main>

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
