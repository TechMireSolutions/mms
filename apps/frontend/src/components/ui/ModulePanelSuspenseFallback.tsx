import { Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

/** Compact Suspense / panel loading status for module Setup and similar panels. */
export function ModulePanelSuspenseFallback({
  className,
  spinnerClassName,
}: {
  className?: string;
  spinnerClassName?: string;
}): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <div
      className={cn("flex items-center justify-center py-12", className)}
      role="status"
      aria-live="polite"
    >
      <Loader2
        className={cn("h-5 w-5 shrink-0 animate-spin text-muted-foreground", spinnerClassName)}
        aria-hidden="true"
      />
      <span className="sr-only">{t("common.loading")}</span>
    </div>
  );
}
