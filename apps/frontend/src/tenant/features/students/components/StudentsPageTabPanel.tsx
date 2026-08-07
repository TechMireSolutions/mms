import { AnimatePresence } from "framer-motion";
import { StudentsReportsTier } from "@/tenant/features/students/components/StudentsReportsTier";
import StudentsSettingsPanel from "@/tenant/features/students/components/StudentsSettingsPanel";
import { StudentsWorkTier } from "@/tenant/features/students/components/StudentsWorkTier";
import type { StudentsPageTabPanelProps } from "@/tenant/features/students/hooks/useStudentsPageTabPanelProps";

export function StudentsPageTabPanel({
  activeTab,
  workTierProps,
}: StudentsPageTabPanelProps): React.JSX.Element {
  return (
    <AnimatePresence mode="wait">
      {activeTab === "work" ? (
        <StudentsWorkTier {...workTierProps} />
      ) : activeTab === "reports" ? (
        <StudentsReportsTier />
      ) : activeTab === "setup" ? (
        <StudentsSettingsPanel />
      ) : null}
    </AnimatePresence>
  );
}
