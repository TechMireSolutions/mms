import React from "react";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { ModuleTierMotion } from "@/components/ui/ModuleTierMotion";
import { FacultyWorkTier } from "@/tenant/features/faculty/components/FacultyWorkTier";
import { FacultyDepartmentsSetupSection } from "@/tenant/features/faculty/components/FacultyDepartmentsSetupSection";
import { FacultyDesignationsSetupSection } from "@/tenant/features/faculty/components/FacultyDesignationsSetupSection";
import type { FacultyWorkTierProps } from "@/tenant/features/faculty/components/facultyWorkTierProps";
import type { FacultyWorkSubTabId } from "@/tenant/features/faculty/facultyPageWorkSubTabs";

export interface FacultyWorkShellSubTab {
  key: FacultyWorkSubTabId;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface FacultyWorkShellProps {
  subTabs: readonly FacultyWorkShellSubTab[];
  activeSubTab: FacultyWorkSubTabId;
  onSubTabChange: (subTab: FacultyWorkSubTabId) => void;
  directoryProps: FacultyWorkTierProps;
  onRequestAddDepartment?: () => void;
  onRequestAddDesignation?: () => void;
}

/** Work-tier shell: Faculties directory + Departments + Designations catalogs. */
export function FacultyWorkShell({
  subTabs,
  activeSubTab,
  onSubTabChange,
  directoryProps,
  onRequestAddDepartment,
  onRequestAddDesignation,
}: FacultyWorkShellProps): React.JSX.Element {
  return (
    <div className="space-y-4">
      <SubTabBar
        tabs={subTabs}
        value={activeSubTab}
        onChange={onSubTabChange}
        panelIdPrefix="faculty-work"
      />

      {activeSubTab === "faculties" ? (
        <FacultyWorkTier {...directoryProps} />
      ) : null}

      {activeSubTab === "departments" ? (
        <ModuleTierMotion tier="work-departments">
          <FacultyDepartmentsSetupSection onRequestAdd={onRequestAddDepartment} />
        </ModuleTierMotion>
      ) : null}

      {activeSubTab === "designations" ? (
        <ModuleTierMotion tier="work-designations">
          <FacultyDesignationsSetupSection onRequestAdd={onRequestAddDesignation} />
        </ModuleTierMotion>
      ) : null}
    </div>
  );
}
