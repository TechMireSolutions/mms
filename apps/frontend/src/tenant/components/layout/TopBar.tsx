import React from "react";
import { Search } from "lucide-react";
import TopBarActions from "@/tenant/components/layout/TopBarActions";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

export interface TopBarProps {
  /** Reflects whether the desktop sidebar is currently collapsed to adjust the start inset. */
  sidebarCollapsed: boolean;
}

/**
 * Global application top-bar header containing search and session controls.
 */
export default function TopBar({ sidebarCollapsed }: TopBarProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <header
      className={cn(
        "fixed top-0 end-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-card/80 px-4 backdrop-blur-xl transition-all duration-300 sm:px-6",
        sidebarCollapsed ? "start-[4.5rem]" : "start-[16.25rem]",
      )}
    >
      <div className="hidden min-w-0 flex-1 md:flex md:max-w-md md:mx-auto">
        <div className="relative w-full">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            id="global-search"
            name="global-search"
            type="text"
            placeholder={t("nav.globalSearchPlaceholder")}
            className="w-full min-h-11 rounded-lg border border-border/50 bg-muted/50 py-2 ps-10 pe-12 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <kbd className="absolute end-3 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            ⌘K
          </kbd>
        </div>
      </div>

      <TopBarActions className="ms-auto" />
    </header>
  );
}
