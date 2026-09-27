import React, { useState, useEffect, useCallback, useDeferredValue, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import { COMMAND_ITEMS } from "@/components/ui/commandPaletteItems";
import { CommandPaletteModal } from "@/components/ui/CommandPaletteModal";

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps): React.JSX.Element | null {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const translate = useCallback(
    (key: string) => {
      try {
        const val = (t as unknown as (k: string) => string)(key);
        return typeof val === "string" && val ? val : "";
      } catch {
        return "";
      }
    },
    [t],
  );

  const filteredItems = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (!q) return COMMAND_ITEMS;
    return COMMAND_ITEMS.filter((item) => {
      const translatedLabel = translate(item.labelKey) || item.fallbackLabel;
      return (
        translatedLabel.toLowerCase().includes(q) ||
        item.fallbackLabel.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [deferredQuery, translate]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [deferredQuery]);

  const handleSelect = useCallback(
    (path: string) => {
      onClose();
      setQuery("");
      navigate(path);
    },
    [navigate, onClose],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (filteredItems.length > 0 ? (prev + 1) % filteredItems.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        filteredItems.length > 0 ? (prev - 1 + filteredItems.length) % filteredItems.length : 0,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex].path);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <CommandPaletteModal
      open={open}
      onClose={onClose}
      ariaLabel={t("common.commandPalette")}
      searchPlaceholder={translate("nav.globalSearchPlaceholder")}
      query={query}
      onQueryChange={setQuery}
      onKeyDown={handleKeyDown}
      listboxId="tenant-command-listbox"
      activeDescendantId={filteredItems[selectedIndex] ? `tenant-cmd-item-${filteredItems[selectedIndex].id}` : undefined}
    >
      <div className="max-h-80 overflow-y-auto p-2" role="listbox" id="tenant-command-listbox">
        {filteredItems.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            {t("nav.globalSearchNoResults", { query })}
          </div>
        ) : (
          filteredItems.map((item, index) => {
            const Icon = item.icon;
            const isSelected = index === selectedIndex;
            const translatedLabel = translate(item.labelKey) || item.fallbackLabel;

            return (
              <button
                key={item.id}
                id={`tenant-cmd-item-${item.id}`}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(item.path)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={cn(
                  "flex w-full min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-start text-sm transition-colors cursor-pointer",
                  isSelected
                    ? "bg-primary text-primary-foreground font-medium shadow-sm"
                    : "text-foreground hover:bg-muted/70",
                )}
              >
                <Icon
                  className={cn(
                    "h-4.5 w-4.5 shrink-0",
                    isSelected ? "text-primary-foreground" : "text-muted-foreground",
                  )}
                  aria-hidden="true"
                />
                <span className="flex-1 truncate">{translatedLabel}</span>
                <span
                  className={cn(
                    "text-xs opacity-70",
                    isSelected ? "text-primary-foreground" : "text-muted-foreground",
                  )}
                >
                  {item.path}
                </span>
              </button>
            );
          })
        )}
      </div>
    </CommandPaletteModal>
  );
}
