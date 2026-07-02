import React from "react";
import { Search } from "lucide-react";
import TopBarActions from "./TopBarActions";

export interface TopBarProps {
  /** Reflects whether the desktop sidebar is currently collapsed to adjust the left margin. */
  sidebarCollapsed: boolean;
}

/**
 * Global application top-bar header containing search and session controls.
 */
export default function TopBar({ sidebarCollapsed }: TopBarProps): React.JSX.Element {
  return (
    <header
      className={`fixed top-0 right-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-card/80 px-4 backdrop-blur-xl transition-all duration-300 sm:px-6 ${
        sidebarCollapsed ? "left-[72px]" : "left-[260px]"
      }`}
    >
      <div className="hidden min-w-0 flex-1 md:flex md:max-w-md md:mx-auto">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="global-search"
            name="global-search"
            type="text"
            placeholder="Search students, sessions..."
            className="w-full rounded-lg border border-border/50 bg-muted/50 py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            ⌘K
          </kbd>
        </div>
      </div>

      <TopBarActions className="ml-auto" />
    </header>
  );
}
