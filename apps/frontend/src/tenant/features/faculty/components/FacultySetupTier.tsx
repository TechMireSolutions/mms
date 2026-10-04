import React, { lazy, Suspense, useRef } from "react";
import { FACULTY_MODULE_MANIFEST } from "@mms/shared";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ModuleTierMotion } from "@/components/ui/ModuleTierMotion";
import { ModulePanelSuspenseFallback } from "@/components/ui/ModulePanelSuspenseFallback";
import { SetupReadOnlyMessage } from "@/components/ui/SetupReadOnlyMessage";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { useModuleSetupSubTabs } from "@/lib/setup/useModuleSetupSubTabs";
import { useTranslation } from "@/hooks/useTranslation";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import {
  FACULTY_SETUP_SUB_TAB_DEFAULT,
  FACULTY_SETUP_SUB_TAB_IDS,
  FACULTY_SETUP_SUB_TAB_KEYS,
  type FacultySetupSubTabId,
} from "@/tenant/features/faculty/facultyPageWorkSubTabs";

const FacultySettings = lazy(
  () => import("@/tenant/features/faculty/components/FacultySettings").then((m) => ({
    default: m.FacultySettings,
  })),
);
const FacultyDepartmentsSetupSection = lazy(
  () => import("@/tenant/features/faculty/components/FacultyDepartmentsSetupSection").then((m) => ({
    default: m.FacultyDepartmentsSetupSection,
  })),
);
const FacultyDesignationsSetupSection = lazy(
  () => import("@/tenant/features/faculty/components/FacultyDesignationsSetupSection").then((m) => ({
    default: m.FacultyDesignationsSetupSection,
  })),
);

export interface FacultySetupTierProps {
  /** Initial Setup sub-tab (e.g. from legacy peer-tab migration). */
  initialSubTab?: FacultySetupSubTabId;
  /** Reports Preferences draft dirtiness to the Setup shell (leave-guard). */
  onPrefsDirtyChange?: (isDirty: boolean) => void;
}

export const FacultySetupTier = function FacultySetupTier({
  initialSubTab = FACULTY_SETUP_SUB_TAB_DEFAULT,
  onPrefsDirtyChange,
}: FacultySetupTierProps = {}): React.JSX.Element {
  const { t } = useTranslation();
  const { canEditSetup } = useModulePermissions(FACULTY_MODULE_MANIFEST);
  const prefsDirtyRef = useRef(false);

  const handlePrefsDirtyChange = (dirty: boolean) => {
    prefsDirtyRef.current = dirty;
    onPrefsDirtyChange?.(dirty);
  };

  const subTabs = useModuleSetupSubTabs({
    initialKey: initialSubTab,
    isDirty: (currentKey: string) => currentKey === "preferences" && prefsDirtyRef.current,
    onDiscard: (leavingKey: string) => {
      if (leavingKey === "preferences") {
        prefsDirtyRef.current = false;
        onPrefsDirtyChange?.(false);
      }
    },
  });

  const setupTabs = FACULTY_SETUP_SUB_TAB_IDS.map((id) => ({
    key: id,
    label: t(FACULTY_SETUP_SUB_TAB_KEYS[id]),
  }));

  return (
    <ModuleTierMotion tier="setup">
      <ErrorBoundary>
        <div className="space-y-4">
          <SubTabBar
            tabs={setupTabs}
            value={subTabs.sub}
            onChange={subTabs.handleSubTabChange}
          />
          {!canEditSetup ? (
            <SetupReadOnlyMessage title={t("faculty.setup.readOnly")} />
          ) : (
            <Suspense fallback={<ModulePanelSuspenseFallback />}>
              {subTabs.sub === "preferences" && (
                <FacultySettings onPrefsDirtyChange={handlePrefsDirtyChange} />
              )}
              {subTabs.sub === "departments" && <FacultyDepartmentsSetupSection />}
              {subTabs.sub === "designations" && <FacultyDesignationsSetupSection />}
            </Suspense>
          )}
        </div>
      </ErrorBoundary>
    </ModuleTierMotion>
  );
};

export default FacultySetupTier;
