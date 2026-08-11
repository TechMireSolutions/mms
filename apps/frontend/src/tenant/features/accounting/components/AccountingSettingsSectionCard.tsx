import React from "react";
import { WORK_SURFACE } from "@/components/ui/formStyles";

interface AccountingSettingsSectionCardProps {
  title: string;
  icon?: React.ElementType | null;
  children: React.ReactNode;
}

export function AccountingSettingsSectionCard({
  title,
  icon: Icon,
  children,
}: AccountingSettingsSectionCardProps): React.JSX.Element {
  return (
    <section aria-label={title} className={`${WORK_SURFACE} overflow-hidden`}>
      <header className="flex items-center gap-2 px-5 py-3.5 border-b border-border bg-muted/30">
        {Icon && <Icon className="w-4 h-4 text-primary" aria-hidden="true" />}
        <h3 className="text-sm font-bold text-foreground m-0">{title}</h3>
      </header>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}
