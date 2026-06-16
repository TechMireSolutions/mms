import React from "react";
import {
  GraduationCap, CalendarCheck, BookOpen, UserCheck, DollarSign, AlertCircle, Star, TrendingUp, Receipt,
  Users, Target, ShieldCheck, Award, Clock, Heart, Briefcase, Activity, CheckCircle2, PieChart, Zap, BarChart2,
} from "lucide-react";
import type { CustomCard } from "../reportMetadata";

export interface CustomWidget {
  id: string;
  title: string;
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

const WIDGET_COLOR_MAP: Record<string, string> = {
  emerald: "#10b981",
  green: "#10b981",
  blue: "#3b82f6",
  violet: "#8b5cf6",
  amber: "#f59e0b",
  red: "#ef4444",
  yellow: "#eab308",
};

const ALERT_COLOR_MAP: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  red: {
    bg: "bg-destructive/10 dark:bg-red-950/20",
    text: "text-red-600 dark:text-red-400",
    border: "border-destructive/30 dark:border-destructive/20",
    glow: "shadow-[0_0_15px_rgba(239,68,68,0.15)]",
  },
  amber: {
    bg: "bg-amber-500/10 dark:bg-amber-950/20",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/30 dark:border-amber-500/20",
    glow: "shadow-[0_0_15px_rgba(245,158,11,0.15)]",
  },
  yellow: {
    bg: "bg-yellow-500/10 dark:bg-yellow-950/20",
    text: "text-yellow-600 dark:text-yellow-400",
    border: "border-yellow-500/30 dark:border-yellow-500/20",
    glow: "shadow-[0_0_15px_rgba(234,179,8,0.15)]",
  }
};

const THEME_PALETTES: Record<string, string[]> = {
  emerald: ["#10b981", "#34d399", "#059669", "#047857", "#065f46"],
  green: ["#10b981", "#34d399", "#059669", "#047857", "#065f46"],
  blue: ["#3b82f6", "#60a5fa", "#2563eb", "#1d4ed8", "#1e40af"],
  violet: ["#8b5cf6", "#a78bfa", "#7c3aed", "#6d28d9", "#5b21b6"],
  amber: ["#f59e0b", "#fbbf24", "#d97706", "#b45309", "#92400e"],
  red: ["#ef4444", "#f87171", "#dc2626", "#b91c1c", "#991b1b"],
};

const COLOR_MAP: Record<string, { bg: string; text: string; ring: string }> = {
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-500", ring: "ring-emerald-500/20" },
  blue:    { bg: "bg-blue-500/10",    text: "text-blue-500",    ring: "ring-blue-500/20"    },
  violet:  { bg: "bg-violet-500/10",  text: "text-violet-500",  ring: "ring-violet-500/20"  },
  amber:   { bg: "bg-amber-500/10",   text: "text-amber-500",   ring: "ring-amber-500/20"   },
  red:     { bg: "bg-destructive/10",     text: "text-destructive",     ring: "ring-destructive/20"     },
};

const ICONS_LIST: Record<string, React.ElementType> = {
  GraduationCap, CalendarCheck, BookOpen, UserCheck, DollarSign, AlertCircle, Star, TrendingUp, Receipt,
  Users, Target, ShieldCheck, Award, Clock, Heart, Briefcase, Activity, CheckCircle2, PieChart, Zap, BarChart2
};

export {
  WIDGET_COLOR_MAP,
  ALERT_COLOR_MAP,
  THEME_PALETTES,
  COLOR_MAP,
  ICONS_LIST,
};
