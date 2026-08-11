import { AnimatePresence } from "framer-motion";
import { TeachersReportsTier } from "@/tenant/features/teachers/components/TeachersReportsTier";
import { TeachersSetupTier } from "@/tenant/features/teachers/components/TeachersSetupTier";
import { TeachersWorkTier } from "@/tenant/features/teachers/components/TeachersWorkTier";
import type { TeachersPageTabPanelProps } from "@/tenant/features/teachers/hooks/useTeachersPageTabPanelProps";

export function TeachersPageTabPanel({
  activeTab,
  workTierProps,
}: TeachersPageTabPanelProps): React.JSX.Element {
  return (
    <AnimatePresence mode="wait">
      {activeTab === "work" ? (
        <TeachersWorkTier {...workTierProps} />
      ) : activeTab === "reports" ? (
        <TeachersReportsTier />
      ) : activeTab === "setup" ? (
        <TeachersSetupTier />
      ) : null}
    </AnimatePresence>
  );
}
