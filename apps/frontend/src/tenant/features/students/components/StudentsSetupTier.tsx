import { lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { STUDENTS_MODULE_MANIFEST } from "@mms/shared";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { SetupReadOnlyMessage } from "@/components/ui/SetupReadOnlyMessage";
import { useTranslation } from "@/hooks/useTranslation";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { ModulePanelSuspenseFallback } from "@/components/ui/ModulePanelSuspenseFallback";
import React from "react";

const StudentsSetupPanel = lazy(
  () => import("@/tenant/features/students/components/StudentsSetupPanel"),
);
const StudentsSetupTier = React.memo(function StudentsSetupTier(): React.JSX.Element {
      const { t } = useTranslation();
      const { canEditSetup } = useModulePermissions(STUDENTS_MODULE_MANIFEST);

      return (
        <motion.div
          key="setup"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <ErrorBoundary>
            <div className="space-y-4">
              {!canEditSetup ? (
                <SetupReadOnlyMessage title={t("students.setupReadOnly")} />
              ) : (
                <Suspense fallback={<ModulePanelSuspenseFallback />}>
                  <StudentsSetupPanel />
                </Suspense>
              )}
            </div>
          </ErrorBoundary>
        </motion.div>
      );
    });
export default StudentsSetupTier;
