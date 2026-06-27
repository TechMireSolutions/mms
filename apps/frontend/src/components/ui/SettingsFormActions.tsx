import React from "react";
import { Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface SettingsFormActionsProps {
  saveLabel: string;
  savingLabel?: string;
  onSave?: () => void;
  dirty?: boolean;
  saving?: boolean;
  saved?: boolean;
  saveDisabled?: boolean;
  showSave?: boolean;
}

/**
 * Consistent Save action for `/settings` panels.
 */
export function SettingsFormActions({
  saveLabel,
  savingLabel,
  onSave,
  dirty = false,
  saving = false,
  saved = false,
  saveDisabled = false,
  showSave = true,
}: SettingsFormActionsProps): React.JSX.Element {
  const saveText = saving ? (savingLabel ?? saveLabel) : saveLabel;

  if (!showSave || !onSave) {
    return <></>;
  }

  return (
    <div className="flex w-full items-center justify-end gap-3 border-t border-border/40 mt-6 pt-4">
      <Button
        type="button"
        onClick={onSave}
        disabled={saveDisabled || !dirty || saving}
        className="min-h-[44px] px-5 py-2.5 ml-auto"
      >
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
        <span>{saveText}</span>
      </Button>
    </div>
  );
}
