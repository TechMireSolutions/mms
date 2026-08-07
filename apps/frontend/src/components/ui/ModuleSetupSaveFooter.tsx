import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WarningCallout } from "@/components/ui/WarningCallout";
import { cn } from "@/lib/utils";

export interface ModuleSetupSaveFooterProps {
  dirty: boolean;
  saving: boolean;
  saved: boolean;
  /** Shown above the footer when `dirty` is true. */
  unsavedWarning?: string;
  saveLabel: string;
  savedLabel: string;
  onSave: () => void | Promise<void>;
  /** Optional layout override (e.g. sticky Contacts chrome). */
  footerClassName?: string;
  buttonClassName?: string;
}

/** Shared Setup Fields/Preferences unsaved warning + Save footer. */
export function ModuleSetupSaveFooter({
  dirty,
  saving,
  saved,
  unsavedWarning,
  saveLabel,
  savedLabel,
  onSave,
  footerClassName,
  buttonClassName,
}: ModuleSetupSaveFooterProps): React.JSX.Element {
  return (
    <>
      {dirty && unsavedWarning ? (
        <WarningCallout role="alert" density="banner" description={unsavedWarning} />
      ) : null}

      <footer
        className={cn(
          "flex w-full items-center justify-end gap-3 border-t border-border/40 mt-6 pt-4",
          footerClassName,
        )}
      >
        <Button
          type="button"
          onClick={() => {
            void onSave();
          }}
          disabled={saving || !dirty}
          aria-busy={saving}
          className={cn(
            saved ? "bg-success hover:bg-success/90 text-success-foreground ms-auto" : "ms-auto",
            buttonClassName,
          )}
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="w-3.5 h-3.5" aria-hidden="true" />
          )}{" "}
          {saved ? savedLabel : saveLabel}
        </Button>
      </footer>
    </>
  );
}
