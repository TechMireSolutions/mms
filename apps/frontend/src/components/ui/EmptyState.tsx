import React from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }> | null;
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
  variant?: "default" | "dashed";
  className?: string;
  role?: "status" | "presentation" | "alert";
}

/**
 * EmptyState — shown when a list has no data.
 *
 * @param {EmptyStateProps} props - The component props.
 * @returns {React.ReactElement} The rendered EmptyState component.
 */
export const EmptyState = React.memo(function EmptyState({
  icon,
  title,
  description = "",
  action = null,
  compact = false,
  variant = "default",
  className,
  role = "status",
}: EmptyStateProps): React.ReactElement {
  const isDashed = variant === "dashed";
  const Icon = icon === undefined ? (isDashed ? null : Inbox) : icon;

  return (
    <div
      role={role}
      className={cn(
        "flex flex-col items-center justify-center text-center",
        isDashed
          ? cn(
              "rounded-xl border-2 border-dashed border-border",
              compact ? "py-8 px-4" : "py-12 px-4",
            )
          : compact
            ? "py-8 px-4"
            : "py-16 px-6",
        className,
      )}
    >
      {Icon && (
        isDashed ? (
          <Icon
            className={cn(
              "text-muted-foreground mx-auto mb-2",
              compact ? "w-6 h-6" : "w-8 h-8",
            )}
            aria-hidden
          />
        ) : (
          <div
            className={cn(
              "rounded-2xl bg-muted flex items-center justify-center mb-4",
              compact ? "w-10 h-10" : "w-14 h-14",
            )}
          >
            <Icon
              className={cn(
                "text-muted-foreground",
                compact ? "w-5 h-5" : "w-7 h-7",
              )}
            />
          </div>
        )
      )}
      <p
        className={cn(
          isDashed
            ? "text-sm font-medium text-foreground m-0"
            : cn("font-semibold text-foreground", compact ? "text-sm" : "text-base"),
        )}
      >
        {title}
      </p>
      {description && (
        <p
          className={cn(
            isDashed
              ? "text-xs text-muted-foreground mt-0.5 m-0"
              : cn("text-muted-foreground mt-1.5 max-w-xs", compact ? "text-xs" : "text-sm"),
          )}
        >
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
});

