import { motion } from "framer-motion";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import StudentsSettings from "@/tenant/features/students/components/StudentsSettings";

export function StudentsSetupTier() {
  return (
    <motion.div
      key="setup"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <ErrorBoundary>
        <StudentsSettings />
      </ErrorBoundary>
    </motion.div>
  );
}
