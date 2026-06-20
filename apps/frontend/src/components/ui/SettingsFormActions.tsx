import React from "react";
import { Loader2, RotateCcw, Save } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SettingsFormActionsProps {
  resetLabel: string;
  saveLabel: string;
  savingLabel?: string;
  onReset: () => void;
  onSave?: () => void;
  dirty?: boolean;
  saving?: boolean;
  saved?: boolean;
  resetDisabled?: boolean;
  saveDisabled?: boolean;
  showSave?: boolean;
}

/**
 * Consistent Save + Reset actions for `/settings` panels.
 */
export default function SettingsFormActions({
  resetLabel,
  saveLabel,
  savingLabel,
  onReset,
  onSave,
  dirty = false,
  saving = false,
  saved = false,
  resetDisabled = false,
  saveDisabled = false,
  showSave = true,
}: SettingsFormActionsProps): React.JSX.Element {
  const saveText = saving ? (savingLabel ?? saveLabel) : saveLabel;

  return (
    <div
      className={cn(
        "flex w-full flex-wrap items-center gap-3 pt-1",
        dirty &&
          "sticky bottom-0 z-20 -mx-5 mt-4 border-t border-border/80 bg-background/95 px-5 py-3.5 backdrop-blur-md shadow-[0_-10px_30px_-12px_hsl(var(--foreground)/0.08)] supports-[backdrop-filter]:bg-background/80 lg:-mx-6 lg:px-6",
      )}
    >
      <button
        type="button"
        onClick={onReset}
        disabled={resetDisabled || saving}
        className="flex min-h-[44px] items-center gap-2 rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        <span>{resetLabel}</span>
      </button>
      {showSave && onSave ? (
        <button
          type="button"
          onClick={onSave}
          disabled={saveDisabled || !dirty || saving}
          className={cn(
            "flex min-h-[44px] items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50",
            dirty && "ml-auto",
          )}
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          <span>{saveText}</span>
        </button>
      ) : null}
    </div>
  );
}
