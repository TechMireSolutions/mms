import React, { useMemo } from "react";
import { Search } from "lucide-react";
import TopBarActions from "@/tenant/components/layout/TopBarActions";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

export interface TopBarProps {
  /** Reflects whether the desktop sidebar is currently collapsed to adjust the start inset. */
  sidebarCollapsed: boolean;
  onOpenCommandPalette?: () => void;
}

/**
 * Global application top-bar header containing search and session controls.
 */
export default function TopBar({ sidebarCollapsed, onOpenCommandPalette }: TopBarProps): React.JSX.Element {
  const { t } = useTranslation();

  const shortcutText = useMemo(() => {
    if (typeof navigator === "undefined") return "⌘K";
    const isMac = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform || navigator.userAgent || "");
    return isMac ? "⌘K" : "Ctrl+K";
  }, []);

  return (
    <header
      role="banner"
      className={cn(
        "fixed top-0 end-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-card/80 px-4 backdrop-blur-xl transition-all duration-300 sm:px-6",
        sidebarCollapsed ? "start-[4.5rem]" : "start-[16.25rem]",
      )}
    >
      <div className="hidden min-w-0 flex-1 md:flex md:max-w-md md:mx-auto">
        <Button
          type="button"
          variant="outline"
          onClick={onOpenCommandPalette}
          aria-label={t("nav.globalSearchPlaceholder")}
          aria-keyshortcuts="Control+K Meta+K"
          className="relative flex w-full items-center justify-start rounded-lg border-border/50 bg-muted/50 ps-10 pe-14 min-h-11 h-11 text-sm font-normal text-muted-foreground text-start hover:bg-muted hover:text-foreground cursor-pointer shadow-none"
        >
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <span className="truncate">{t("nav.globalSearchPlaceholder")}</span>
          <kbd
            aria-hidden="true"
            className="absolute end-3 top-1/2 -translate-y-1/2 rounded border border-border bg-card px-1.5 py-0.5 text-xs text-muted-foreground font-mono select-none"
          >
            {shortcutText}
          </kbd>
        </Button>
      </div>

      <TopBarActions className="ms-auto" />
    </header>
  );
}
