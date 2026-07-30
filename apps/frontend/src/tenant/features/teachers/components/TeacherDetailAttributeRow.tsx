import React from "react";
import { useTranslation } from "@/hooks/useTranslation";

export function TeacherDetailAttributeRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/40 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1 text-start">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className="text-sm font-medium text-foreground mt-0.5 break-words">{value || t("common.notSpecified")}</div>
      </div>
    </div>
  );
}
