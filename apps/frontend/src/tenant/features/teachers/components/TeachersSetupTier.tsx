import type React from "react";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ModuleTierMotion } from "@/components/ui/ModuleTierMotion";
import { TeachersSettings as TeachersSettingsPanel } from "@/tenant/features/teachers/components/TeachersSettings";

export function TeachersSetupTier(): React.JSX.Element {
  return (
    <ModuleTierMotion tier="setup">
      <ErrorBoundary>
        <TeachersSettingsPanel />
      </ErrorBoundary>
    </ModuleTierMotion>
  );
}
