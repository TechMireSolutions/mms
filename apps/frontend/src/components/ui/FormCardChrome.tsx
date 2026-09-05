import { Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { REMOVE_BTN } from "@/components/ui/formPrimitiveStyles";
import { cn } from "@/lib/utils";

export function CardTypeLabel({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{children}</span>
  );
}

interface CardRemoveButtonProps {
  onClick: () => void;
  label: string;
}

export function CardRemoveButton({ onClick, label }: CardRemoveButtonProps): React.JSX.Element {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className={`min-w-11 min-h-11 p-0 flex items-center justify-center rounded-lg transition-colors ${REMOVE_BTN}`}
      aria-label={label}
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  );
}

export interface CardPrimaryButtonProps {
  isPrimary: boolean;
  onClick: () => void;
  title?: string;
  ariaLabel?: string;
  primaryLabel?: string;
  setPrimaryLabel?: string;
  className?: string;
}

export function CardPrimaryButton({
  isPrimary,
  onClick,
  title,
  ariaLabel,
  primaryLabel = "Primary",
  setPrimaryLabel = "Set Primary",
  className,
}: CardPrimaryButtonProps): React.JSX.Element {
  const resolvedLabel = isPrimary ? primaryLabel : setPrimaryLabel;
  const resolvedTitle = title || resolvedLabel;
  const resolvedAriaLabel = ariaLabel || resolvedTitle;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-2xs font-semibold transition-colors min-h-11 touch-manipulation select-none",
        isPrimary
          ? "bg-primary/10 text-primary border border-primary/30"
          : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/40 border border-transparent",
        className,
      )}
      title={resolvedTitle}
      aria-label={resolvedAriaLabel}
    >
      <Star className={cn("w-3 h-3", isPrimary && "fill-primary text-primary")} aria-hidden="true" />
      <span>{resolvedLabel}</span>
    </button>
  );
}

