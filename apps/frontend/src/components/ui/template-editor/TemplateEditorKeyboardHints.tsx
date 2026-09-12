/**
 * @file TemplateEditorKeyboardHints.tsx
 * @description Bottom footer displaying keyboard shortcut hints.
 */

import React from "react";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";

export interface TemplateEditorKeyboardHintsProps {
  t: TranslationFunction;
}

export function TemplateEditorKeyboardHints({
  t,
}: TemplateEditorKeyboardHintsProps): React.JSX.Element {
  return (
    <footer className="flex-shrink-0 border-t border-border bg-card px-4 py-1.5 flex items-center gap-4 flex-wrap">
      {[
        ["Ctrl+S", t("templateEditor.save")],
        ["Ctrl+Z", t("templateEditor.undo")],
        ["Ctrl+Y", t("templateEditor.redo")],
        ["Ctrl+A", t("templateEditor.emptyHint")],
        ["Ctrl+D", t("templateEditor.duplicate")],
        ["Del", t("templateEditor.delete")],
        ["Esc", t("templateEditor.close")],
      ].map(([shortcutKey, shortcutLabel]) => (
        <span key={shortcutKey} className="text-xs text-muted-foreground">
          <kbd className="px-1 py-0.5 rounded border border-border bg-muted text-foreground font-mono text-xs">
            {shortcutKey}
          </kbd>{" "}
          {shortcutLabel}
        </span>
      ))}
    </footer>
  );
}
