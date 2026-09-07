import React from "react";
import type { ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { FORM_CARD } from "@/components/ui/formStyles";
import { cn } from "@/lib/utils";

import { CARD_STRIPE_BASE, CARD_STRIPE_INSET } from "@/lib/semanticTone";

export const directoryEntityCardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" as const } },
};

export const directoryEntityCardVariantsReduced = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0, transition: { duration: 0 } },
};

export interface DirectoryEntityCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  isSelected?: boolean;
  reducedMotion?: boolean;
  accentClassName?: string;
  children: ReactNode;
}

/** Shared Work directory entity card shell (FORM_CARD + selection chrome). */
export const DirectoryEntityCard = React.memo(function DirectoryEntityCard({
  isSelected = false,
  reducedMotion = false,
  accentClassName,
  className,
  children,
  ...motionProps
}: DirectoryEntityCardProps): React.JSX.Element {
  return (
    <motion.div
      layout={!reducedMotion}
      variants={reducedMotion ? directoryEntityCardVariantsReduced : directoryEntityCardVariants}
      whileHover={
        reducedMotion
          ? undefined
          : { y: -4, scale: 1.01, transition: { duration: 0.2 } }
      }
      className={cn(
        FORM_CARD,
        "p-4 space-y-4 shadow-xs",
        accentClassName && CARD_STRIPE_INSET,
        reducedMotion ? "hover:shadow-none" : "hover:shadow-md",
        isSelected
          ? "border-primary/50 bg-primary/5 shadow-xs shadow-primary/5"
          : "border-border/50 hover:border-primary/35",
        className,
      )}
      {...motionProps}
    >
      {accentClassName ? (
        <div
          aria-hidden="true"
          className={cn(
            CARD_STRIPE_BASE,
            accentClassName,
            reducedMotion ? "" : "transition-colors duration-300",
          )}
        />
      ) : null}
      {children}
    </motion.div>
  );
});

