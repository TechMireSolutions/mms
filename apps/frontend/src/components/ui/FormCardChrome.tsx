import type React from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { REMOVE_BTN } from "@/components/ui/formPrimitiveStyles";

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
