import React from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
}

/**
 * EmptyState — shown when a list has no data.
 *
 * @param {EmptyStateProps} props - The component props.
 * @returns {React.ReactElement} The rendered EmptyState component.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title = "Nothing here yet",
  description = "",
  action = null,
  compact = false,
}: EmptyStateProps): React.ReactElement {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? "py-8 px-4" : "py-16 px-6"}`}>
      <div className={`rounded-2xl bg-muted flex items-center justify-center mb-4 ${compact ? "w-10 h-10" : "w-14 h-14"}`}>
        <Icon className={`text-muted-foreground ${compact ? "w-5 h-5" : "w-7 h-7"}`} />
      </div>
      <p className={`font-semibold text-foreground ${compact ? "text-sm" : "text-[15px]"}`}>{title}</p>
      {description && (
        <p className={`text-muted-foreground mt-1.5 max-w-xs ${compact ? "text-xs" : "text-sm"}`}>{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
