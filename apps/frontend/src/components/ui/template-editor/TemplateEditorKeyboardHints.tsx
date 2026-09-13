/**
 * @file TemplateEditorKeyboardHints.tsx
 * @description Sleek bottom footer displaying platform-aware keyboard shortcut hints in a compact single-line bar.
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
    [`${mod}A`, t("templateEditor.selectAll")],
    [`${mod}C / ${mod}V`, `${t("templateEditor.copy")} / ${t("templateEditor.paste")}`],
    [`${mod}D`, t("templateEditor.duplicate")],
    ["Arrows", t("templateEditor.nudgeHint")],
    ["Del", t("templateEditor.delete")],
    ["Esc", t("templateEditor.deselect")],
  ];

  return (
    <footer
      aria-label={t("templateEditor.shortcuts")}
      className="flex-shrink-0 h-7 border-t border-border/70 bg-card/95 backdrop-blur-xs px-3 flex items-center justify-between gap-3 select-none overflow-hidden"
    >
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-0.5 w-full">
        <div className="flex items-center gap-1.5 font-semibold text-muted-foreground shrink-0 text-3xs uppercase tracking-wider">
          <Keyboard className="w-3.5 h-3.5 text-primary/80" aria-hidden="true" />
          <span>{t("templateEditor.shortcuts")}:</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {shortcuts.map(([shortcutKey, shortcutLabel]) => (
            <span key={shortcutKey} className="text-muted-foreground/90 flex items-center gap-1 whitespace-nowrap">
              <kbd className="px-1.5 py-0.5 rounded border border-border/80 bg-muted/60 text-foreground font-mono text-3xs font-medium shadow-2xs">
                {shortcutKey}
              </kbd>
              <span className="text-3xs">{shortcutLabel}</span>
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}
