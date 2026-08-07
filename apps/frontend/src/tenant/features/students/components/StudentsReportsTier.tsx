import { motion } from "framer-motion";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { KPISummary, ModuleReports } from "@/tenant/components/moduleReports";

export function StudentsReportsTier() {
  return (
    <motion.div
      key="reports"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="space-y-4"
    >
      <ErrorBoundary>
        <div className="space-y-4">
          <KPISummary category="students" />
          <ModuleReports category="students" />
        </div>
      </ErrorBoundary>
    </motion.div>
  );
}
