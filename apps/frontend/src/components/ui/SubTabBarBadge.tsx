import React from "react";
import { cn } from "@/lib/utils";

export function SubTabBadge({ badge, active }: { badge: number | string; active: boolean }): React.JSX.Element {
  return (
    <span
      className={cn(
        "inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1.5 text-2xs font-bold transition-colors",
        active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground group-hover:bg-muted-foreground/20",
      )}
    >
      {badge}
    </span>
  );
}

export function SubTabPillBadge({ badge, active }: { badge: number | string; active: boolean }): React.JSX.Element {
  return (
    <span
      className={cn(
        "inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1.5 text-2xs font-bold",
        active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
      )}
    >
      {badge}
    </span>
  );
}
