import React from "react";
import { LucideIcon } from "lucide-react";

interface ReportSummaryCardProps {
  icon?: LucideIcon | React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string | number;
  sub?: string | null;
  color?: "primary" | "green" | "amber" | "red" | "blue" | "violet";
}

/**
 * ReportSummaryCard displays a single statistical metric card in reports.
 *
 * @param props - Component props.
 * @returns React.JSX.Element
 */
export default function ReportSummaryCard({
  icon: Icon,
  label,
  value,
  sub = null,
  color = "primary",
}: ReportSummaryCardProps): React.JSX.Element {
  const colors: Record<string, string> = {
    primary: "bg-primary/10 text-primary shadow-sm shadow-primary/5",
    green:   "bg-success/10 text-success shadow-sm shadow-success/5",
    amber:   "bg-warning/10 text-warning shadow-sm shadow-warning/5",
    red:     "bg-destructive/10 text-destructive shadow-sm shadow-destructive/5",
    blue:    "bg-info/10 text-info shadow-sm shadow-info/5",
    violet:  "bg-primary/10 text-primary shadow-sm shadow-primary/5",
  };
  
  return (
    <div className="bg-card/40 backdrop-blur-xl rounded-2xl border border-border/50 p-4 flex items-center gap-3.5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all group">
      {Icon && (
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${colors[color] || colors.primary}`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div className="min-w-0">
        <span className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1.5">{label}</span>
        <p className="text-lg font-black text-foreground leading-none tracking-tight">{value}</p>
        {sub && <p className="text-[10px] font-semibold text-muted-foreground mt-1 opacity-70 truncate">{sub}</p>}
      </div>
    </div>
  );
}
