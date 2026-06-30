import React from "react";
import { AlertTriangle, RefreshCw, WifiOff } from "lucide-react";

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  type?: "generic" | "network" | "permission";
  compact?: boolean;
}

/**
 * ErrorState — shown when a data fetch or validation fails.
 *
 * @param {ErrorStateProps} props - The component props.
 * @returns {React.ReactElement} The rendered ErrorState component.
 */
export function ErrorState({
  title,
  description,
  onRetry,
  type = "generic",
  compact = false,
}: ErrorStateProps): React.ReactElement {
  const configs = {
    generic:    { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10", defaultTitle: "Something went wrong" },
    network:    { icon: WifiOff,       color: "text-warning",   bg: "bg-warning/10",       defaultTitle: "Connection error" },
    permission: { icon: AlertTriangle, color: "text-warning",   bg: "bg-warning/10",       defaultTitle: "Access denied" },
  };

  const stateConfig = configs[type] || configs.generic;
  const Icon = stateConfig.icon;

  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? "py-8 px-4" : "py-16 px-6"}`}>
      <div className={`${stateConfig.bg} rounded-2xl flex items-center justify-center mb-4 ${compact ? "w-10 h-10" : "w-14 h-14"}`}>
        <Icon className={`${stateConfig.color} ${compact ? "w-5 h-5" : "w-7 h-7"}`} />
      </div>
      <p className={`font-semibold text-foreground ${compact ? "text-sm" : "text-[15px]"}`}>
        {title || stateConfig.defaultTitle}
      </p>
      {description && (
        <p className={`text-muted-foreground mt-1.5 max-w-xs ${compact ? "text-xs" : "text-sm"}`}>{description}</p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try again
        </button>
      )}
    </div>
  );
}
