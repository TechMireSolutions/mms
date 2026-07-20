import React from 'react';
import { motion } from 'framer-motion';
import { formatNumber } from '@/lib/utils';


export interface ModuleCommandMetricCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  accent?: "primary" | "success" | "warning" | "destructive" | "info" | "indigo" | "rose" | "teal" | "purple";
  delayIndex?: number;
  onClick?: () => void;
}

const ACCENT_MAP = {
  primary: {
    stripe: "bg-primary/60 group-hover/metric:bg-primary",
    iconBg: "bg-primary/10",
    iconText: "text-primary",
    ring: "ring-primary/20",
  },
  success: {
    stripe: "bg-success/60 group-hover/metric:bg-success",
    iconBg: "bg-success/10",
    iconText: "text-success",
    ring: "ring-success/20",
  },
  warning: {
    stripe: "bg-warning/60 group-hover/metric:bg-warning",
    iconBg: "bg-warning/10",
    iconText: "text-warning",
    ring: "ring-warning/20",
  },
  destructive: {
    stripe: "bg-destructive/60 group-hover/metric:bg-destructive",
    iconBg: "bg-destructive/10",
    iconText: "text-destructive",
    ring: "ring-destructive/20",
  },
  info: {
    stripe: "bg-info/60 group-hover/metric:bg-info",
    iconBg: "bg-info/10",
    iconText: "text-info",
    ring: "ring-info/20",
  },
  indigo: {
    stripe: "bg-indigo-500/60 group-hover/metric:bg-indigo-500",
    iconBg: "bg-indigo-500/10",
    iconText: "text-indigo-500",
    ring: "ring-indigo-500/20",
  },
  rose: {
    stripe: "bg-rose-500/60 group-hover/metric:bg-rose-500",
    iconBg: "bg-rose-500/10",
    iconText: "text-rose-500",
    ring: "ring-rose-500/20",
  },
  teal: {
    stripe: "bg-teal-500/60 group-hover/metric:bg-teal-500",
    iconBg: "bg-teal-500/10",
    iconText: "text-teal-500",
    ring: "ring-teal-500/20",
  },
  purple: {
    stripe: "bg-purple-500/60 group-hover/metric:bg-purple-500",
    iconBg: "bg-purple-500/10",
    iconText: "text-purple-500",
    ring: "ring-purple-500/20",
  },
};

/** Single metric tile for module command centres (globle1 §2.1). */
export function ModuleCommandMetricCard({
  icon: Icon,
  label,
  value,
  accent = 'primary',
  delayIndex = 0,
  onClick,
}: ModuleCommandMetricCardProps): React.JSX.Element {
  const theme = ACCENT_MAP[accent] || ACCENT_MAP.primary;
  const baseClass =
    'relative overflow-hidden group/metric flex items-center gap-3 rounded-2xl border border-border/80 bg-card/45 backdrop-blur-sm px-4 py-3 ps-5.5 min-h-[44px] w-full text-start transition-all duration-300 shadow-sm';
  const interactiveClass = onClick ? ' cursor-pointer hover:shadow-md hover:border-primary/40 hover:bg-card/75' : '';

  const content = (
    <>
      <div className={`absolute start-0 top-0 bottom-0 w-1 transition-colors duration-300 ${theme.stripe}`} />
      <div className={`w-8 h-8 rounded-lg ${theme.iconBg} ring-4 ${theme.ring} flex items-center justify-center flex-shrink-0 ms-0.5`} aria-hidden="true">
        <Icon className={`w-4 h-4 ${theme.iconText}`} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide truncate">{label}</p>
        <p className="text-lg font-bold text-foreground leading-tight tabular-nums">{formatNumber(value)}</p>

      </div>
    </>
  );

  const Comp = onClick ? motion.button : motion.div;
  const buttonProps = onClick ? { type: 'button' as const } : {};

  return (
    <Comp
      {...buttonProps}
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delayIndex * 0.04, duration: 0.3, ease: 'easeOut' }}
      className={`${baseClass}${interactiveClass}`}
    >
      {content}
    </Comp>
  );
}
