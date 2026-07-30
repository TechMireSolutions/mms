import { motion } from "framer-motion";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import ModuleReports from "@/tenant/features/reports/components/ModuleReports";

export function StudentsReportsTier() {
  return (
    <motion.div
      key="reports"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <ErrorBoundary>
        <ModuleReports category="students" />
      </ErrorBoundary>
    </motion.div>
  );
}
