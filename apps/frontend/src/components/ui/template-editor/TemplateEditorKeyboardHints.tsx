/**
 * @file TemplateEditorKeyboardHints.tsx
 * @description Bottom footer displaying platform-aware keyboard shortcut hints.
 */

import React, { useMemo } from "react";
import { Keyboard } from "lucide-react";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";

export interface TemplateEditorKeyboardHintsProps {
  t: TranslationFunction;
}

export function TemplateEditorKeyboardHints({
  t,
}: TemplateEditorKeyboardHintsProps): React.JSX.Element {
  const isMac = useMemo(() => {
    return typeof window !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
  }, []);

  const mod = isMac ? "⌘" : "Ctrl+";

  const shortcuts: [string, string][] = [
    [`${mod}S`, t("templateEditor.save")],
    [`${mod}Z`, t("templateEditor.undo")],
    [isMac ? "⇧⌘Z" : "Ctrl+Y", t("templateEditor.redo")],
    [`${mod}A`, "Select All"],
    [`${mod}D`, t("templateEditor.duplicate")],
    ["Arrows", "Nudge (Shift: 8px)"],
    ["Del", t("templateEditor.delete")],
    ["Esc", "Deselect"],
  ];

  return (
    <footer className="flex-shrink-0 border-t border-border/80 bg-card/95 px-4 py-1.5 flex items-center gap-4 flex-wrap select-none">
      <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground me-1">
        <Keyboard className="w-3.5 h-3.5 text-primary/70" aria-hidden="true" />
        <span className="hidden sm:inline">Shortcuts:</span>
      </div>
      {shortcuts.map(([shortcutKey, shortcutLabel]) => (
        <span key={shortcutKey} className="text-xs text-muted-foreground/90 flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded border border-border/80 bg-muted/70 text-foreground font-mono text-[11px] shadow-2xs">
            {shortcutKey}
          </kbd>
          <span>{shortcutLabel}</span>
        </span>
      ))}
    </footer>
  );
}
