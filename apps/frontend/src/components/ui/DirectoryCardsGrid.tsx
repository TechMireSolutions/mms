import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export interface DirectoryCardsGridProps {
  children: ReactNode;
  className?: string;
}

/** Shared Work cards grid with optional staggered entrance (Contacts gold-standard). */
export function DirectoryCardsGrid({
  children,
  className,
}: DirectoryCardsGridProps): React.JSX.Element {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      variants={reducedMotion ? undefined : containerVariants}
      initial={reducedMotion ? false : "hidden"}
      animate={reducedMotion ? undefined : "visible"}
      className={cn("grid grid-cols-1 sm:grid-cols-2 gap-4", className)}
    >
      {children}
    </motion.div>
  );
}
