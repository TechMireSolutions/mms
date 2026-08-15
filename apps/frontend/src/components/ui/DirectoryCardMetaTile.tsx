import React from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface DirectoryCardMetaTileProps {
  label: string;
  children: ReactNode;
  className?: string;
}

/** Shared metadata tile for Work directory entity cards. */
export const DirectoryCardMetaTile = React.memo(function DirectoryCardMetaTile({
  label,
  children,
  className,
}: DirectoryCardMetaTileProps): React.JSX.Element {
  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 bg-muted/40 dark:bg-muted/15 px-2.5 py-1.5 rounded-xl border border-border/30 dark:border-border/10 text-start min-w-0",
        className,
      )}
    >
      <span className="text-xs font-bold text-muted-foreground uppercase tracking-tight truncate leading-none">
        {label}
      </span>
      <div className="text-xs font-semibold text-foreground truncate mt-0.5">{children}</div>
    </div>
  );
});

