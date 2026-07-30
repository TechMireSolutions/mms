import type { LucideIcon } from "lucide-react";

export interface SectionTitleProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  noMargin?: boolean;
}

export function SectionTitle({ icon: Icon, title, subtitle, noMargin = false }: SectionTitleProps) {
  return (
    <header className={`flex min-w-0 items-center gap-2.5 ${noMargin ? "" : "mb-3"}`}>
      <div className="w-7 h-7 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center" aria-hidden="true">
        <Icon className="w-3.5 h-3.5 text-primary" />
      </div>
      <div className="min-w-0">
        <h2 className="text-sm font-bold text-foreground m-0 truncate">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground m-0 truncate">{subtitle}</p>}
      </div>
    </header>
  );
}
