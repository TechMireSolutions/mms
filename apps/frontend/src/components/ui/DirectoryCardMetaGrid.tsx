import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface DirectoryCardMetaGridProps {
  children: ReactNode;
  className?: string;
}

/** Shared metadata tile grid wrapper for Work directory entity cards. */
export function DirectoryCardMetaGrid({
  children,
  className,
}: DirectoryCardMetaGridProps): React.JSX.Element {
  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-border/40 dark:border-border/20 ms-1",
        className,
      )}
    >
      {children}
    </div>
  );
}
