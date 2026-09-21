import React from "react";
import type { ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { FORM_CARD } from "@/components/ui/formStyles";
import { cn } from "@/lib/utils";

import { CARD_STRIPE_BASE, CARD_STRIPE_INSET } from "@/lib/semanticTone";

export const directoryEntityCardVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.18, ease: "easeOut" as const } },
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
      className={cn(
        FORM_CARD,
        "p-4 space-y-4 shadow-xs [contain-intrinsic-size:180px] [content-visibility:auto]",
        accentClassName && CARD_STRIPE_INSET,
        isSelected
          ? "border-primary/50 bg-primary/5 shadow-xs"
          : "border-foreground/10 hover:border-foreground/20",
        className,
      )}
      style={{
        contain: "content",
        ...motionProps.style,
      }}
      {...motionProps}
    >
      {accentClassName ? (
        <div
          aria-hidden="true"
          className={cn(
            CARD_STRIPE_BASE,
            accentClassName,
            reducedMotion ? "" : "transition-colors duration-150 ease-out",
          )}
        />
      ) : null}
      {children}
    </motion.div>
  );
});

