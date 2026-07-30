import type React from "react";
import type { LucideIcon } from "lucide-react";

interface FormEmptyStateProps {
  icon: LucideIcon;
  text: string;
}

export function FormEmptyState({ icon: Icon, text }: FormEmptyStateProps): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-border rounded-xl text-muted-foreground text-sm gap-2 bg-card">
      <Icon className="w-7 h-7 opacity-25" />
      <span>{text}</span>
    </div>
  );
}
