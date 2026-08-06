import { motion } from "framer-motion";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

const MotionButton = motion.create(Button);

export interface DirectoryCardViewButtonProps {
  label: string;
  ariaLabel: string;
  onClick: () => void;
  className?: string;
}

/** Shared outline View control for Work directory entity card footers. */
export function DirectoryCardViewButton({
  label,
  ariaLabel,
  onClick,
  className,
}: DirectoryCardViewButtonProps): React.JSX.Element {
  const reducedMotion = useReducedMotion();
  const scaleHover = reducedMotion ? 1 : 1.02;
  const scaleTap = reducedMotion ? 1 : 0.98;

  return (
    <MotionButton
      type="button"
      variant="outline"
      whileHover={{ scale: scaleHover }}
      whileTap={{ scale: scaleTap }}
      onClick={onClick}
      className={cn(
        "flex items-center min-h-11 h-auto gap-1.5 px-3 py-2 rounded-xl border border-border/50 dark:border-border/30 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/80 hover:border-border transition-colors cursor-pointer shadow-none",
        className,
      )}
      aria-label={ariaLabel}
    >
      <Eye aria-hidden="true" className="w-3.5 h-3.5" />
      <span>{label}</span>
    </MotionButton>
  );
}
