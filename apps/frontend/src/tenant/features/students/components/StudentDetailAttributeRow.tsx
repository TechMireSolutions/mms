import type React from "react";

interface StudentDetailAttributeRowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}

export function StudentDetailAttributeRow({
  icon: Icon,
  label,
  value,
}: StudentDetailAttributeRowProps): React.JSX.Element {
  return (
    <div className="relative overflow-hidden group/row flex items-center gap-3 p-3 bg-card/45 backdrop-blur-xs rounded-2xl border border-border/80 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="absolute start-0 top-0 bottom-0 w-1 bg-primary/45 transition-colors group-hover/row:bg-primary" />
      <div className="p-2 rounded-lg bg-muted text-muted-foreground ms-1">
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0 text-start">
        <span className="block text-xs font-bold text-muted-foreground uppercase tracking-tight mb-0.5">{label}</span>
        <span className="text-xs font-semibold text-foreground">{value}</span>
      </div>
    </div>
  );
}
