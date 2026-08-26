import { motion } from 'framer-motion';
import KPISummary from '@/components/ui/reports/KPISummary';
import ModuleReports from '@/components/ui/reports/ModuleReports';

export function UsersReportsTier(): React.JSX.Element {
  return (
    <motion.div
      key="reports"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="space-y-4"
    >
      <KPISummary category="faculty" />
      <ModuleReports category="faculty" />
    </motion.div>
  );
}
