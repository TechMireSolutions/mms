import type { AppTranslationKey } from '@mms/shared';
import React from "react";
import {
  GraduationCap, CalendarCheck, BookOpen, UserCheck, DollarSign, AlertCircle, Star, TrendingUp, Receipt,
  Users, Target, ShieldCheck, Award, Clock, Heart, Briefcase, Activity, CheckCircle2, PieChart, Zap, BarChart2,
} from "lucide-react";
import { WIDGET_CHART_PALETTES } from "@mms/shared";
import type { CustomCard } from "@/tenant/features/reports/components/reportMetadata";

export interface CustomWidget {
  id: string;
  title: string;
  /** When set, dashboard/report UI uses `t(titleKey)` instead of `title`. */
  titleKey?: AppTranslationKey;
  category: string;
  collection: CustomCard["collection"];
  
  widgetType?: "kpi" | "progress" | "switch" | "chart" | "sessions-list" | "attendance-summary" | "fee-summary" | "outstanding-list" | "overdue-obligations" | "enrollment-trends" | "revenue-expenses" | "attendance-rate" | "hasanat-distribution" | "card";

  // Card fields merged
  icon?: string;
  subTextType?: "fixed" | "dynamic";
  fixedSubText?: string;
  trend?: number;
  trendType?: "manual" | "database";
  role?: string;
  
  // Switch utility settings
  switchActionType?: "app_setting" | "db_record";
  switchStateKey?: string;
  switchLabelOn?: string;
  switchLabelOff?: string;
  switchCollection?: CustomCard["collection"];
  switchRecordId?: string;
  switchField?: string;

  // Threshold alert settings
  thresholdEnabled?: boolean;
  thresholdCondition?: "lt" | "gt" | "equals";
  thresholdValue?: number;
  thresholdColor?: "red" | "amber" | "yellow";

  // Existing properties for Recharts chart rendering (fallback/compatibility)
  chartType?: "bar" | "line" | "area" | "pie" | "radar" | "kpi" | "progress" | "switch";
  xAxisField?: string;
  operation: "count" | "sum" | "avg" | "percentage";
  targetField?: string;
  filterField?: string;
  filterOperator?: "equals" | "contains" | "gt" | "lt";
  filterValue?: string;
  color: string;
  isPinnedToDashboard: boolean;
}

const ALERT_COLOR_MAP: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  red: {
    bg: "bg-destructive/10 dark:bg-destructive/20",
    text: "text-destructive dark:text-destructive",
    border: "border-destructive/30 dark:border-destructive/20",
    glow: "shadow-[0_0_15px_rgba(239,68,68,0.15)]",
  },
  amber: {
    bg: "bg-warning/10 dark:bg-warning/20",
    text: "text-warning dark:text-warning",
    border: "border-warning/30 dark:border-warning/20",
    glow: "shadow-[0_0_15px_rgba(245,158,11,0.15)]",
  },
  yellow: {
    bg: "bg-warning/10 dark:bg-warning/20",
    text: "text-warning",
    border: "border-warning/30 dark:border-warning/20",
    glow: "shadow-[0_0_15px_rgba(234,179,8,0.15)]",
  }
};

const COLOR_MAP: Record<string, { bg: string; text: string; ring: string }> = {
  emerald: { bg: "bg-success/10", text: "text-success", ring: "ring-success/20" },
  blue:    { bg: "bg-info/10",    text: "text-info",    ring: "ring-info/20"    },
  violet:  { bg: "bg-primary/10",  text: "text-primary",  ring: "ring-primary/20"  },
  amber:   { bg: "bg-warning/10",   text: "text-warning",   ring: "ring-warning/20"   },
  red:     { bg: "bg-destructive/10",     text: "text-destructive",     ring: "ring-destructive/20"     },
};

const ICONS_LIST: Record<string, React.ElementType> = {
  GraduationCap, CalendarCheck, BookOpen, UserCheck, DollarSign, AlertCircle, Star, TrendingUp, Receipt,
  Users, Target, ShieldCheck, Award, Clock, Heart, Briefcase, Activity, CheckCircle2, PieChart, Zap, BarChart2
};

export {
  ALERT_COLOR_MAP,
  WIDGET_CHART_PALETTES as THEME_PALETTES,
  COLOR_MAP,
  ICONS_LIST,
};
