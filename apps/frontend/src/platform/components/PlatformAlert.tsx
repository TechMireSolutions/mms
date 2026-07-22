import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PlatformAlertProps {
  message: string | React.ReactNode;
  variant?: 'error' | 'warning' | 'info' | 'destructiveBlock';
  className?: string;
  role?: string;
}

/**
 * Unified Alert component for the platform administration interface.
 * Implements DRY standard for error state and alert banners.
 */
export function PlatformAlert({
  message,
  variant = 'error',
  className,
  role,
}: PlatformAlertProps): React.JSX.Element {
  if (variant === 'error') {
    return (
      <div
        className={cn(
          "flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive",
          className
        )}
        role={role ?? "alert"}
      >
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
        <span>{message}</span>
      </div>
    );
  }

  if (variant === 'warning') {
    return (
      <div
        className={cn(
          "rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-sm text-foreground",
          className
        )}
        role={role ?? "status"}
      >
        {message}
      </div>
    );
  }

  if (variant === 'info') {
    return (
      <div
        className={cn(
          "rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground",
          className
        )}
        role={role}
      >
        {message}
      </div>
    );
  }

  // destructiveBlock
  return (
    <div
      className={cn(
        "rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-center space-y-2",
        className
      )}
      role={role ?? "alert"}
    >
      {message}
    </div>
  );
}
