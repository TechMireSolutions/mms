import type React from "react";
import { motion } from "framer-motion";

interface ModuleTierMotionProps {
  tier: string;
  className?: string;
  "aria-busy"?: boolean;
  children: React.ReactNode;
}

/** Shared Framer-motion wrapper for module Work/Setup/Reports tiers. */
export function ModuleTierMotion({
  tier,
  className,
  "aria-busy": ariaBusy,
  children,
}: ModuleTierMotionProps): React.JSX.Element {
  return (
    <motion.div
      key={tier}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className={className}
      aria-busy={ariaBusy}
    >
      {children}
    </motion.div>
  );
}
