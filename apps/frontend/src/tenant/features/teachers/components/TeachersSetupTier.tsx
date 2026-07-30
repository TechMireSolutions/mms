import type React from "react";
import { motion } from "framer-motion";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { TeachersSettings as TeachersSettingsPanel } from "@/tenant/features/teachers/components/TeachersSettings";

export function TeachersSetupTier(): React.JSX.Element {
  return (
    <motion.div
      key="setup"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <ErrorBoundary>
        <TeachersSettingsPanel />
      </ErrorBoundary>
    </motion.div>
  );
}
