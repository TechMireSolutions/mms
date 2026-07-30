import type React from "react";
import { motion } from "framer-motion";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import KPISummary from "@/tenant/features/reports/components/KPISummary";
import ModuleReports from "@/tenant/features/reports/components/ModuleReports";

export function TeachersReportsTier(): React.JSX.Element {
  return (
    <motion.div
      key="reports"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <ErrorBoundary>
        <div className="space-y-4">
          <KPISummary category="teachers" />
          <ModuleReports category="teachers" />
        </div>
      </ErrorBoundary>
    </motion.div>
  );
}
